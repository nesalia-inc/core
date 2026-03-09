/**
 * Database Operations Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Wrapping database queries with AsyncResult
 * - Using Try for error-prone operations
 * - Composing multiple database operations
 * - Transaction-like behavior with flatMap
 */

import { ok, err, attempt, fromPromise, okAsync, errAsync } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

type Post = {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: Date;
};

type Comment = {
  id: number;
  postId: number;
  userId: number;
  text: string;
  createdAt: Date;
};

type DatabaseError = {
  type: "NOT_FOUND" | "CONSTRAINT" | "CONNECTION" | "QUERY";
  message: string;
};

// ============================================================================
// Mock Database (simulating real DB operations)
// ============================================================================

class Database {
  private users: User[] = [
    { id: 1, name: "Alice", email: "alice@example.com", createdAt: new Date() },
    { id: 2, name: "Bob", email: "bob@example.com", createdAt: new Date() },
  ];

  private posts: Post[] = [
    { id: 1, userId: 1, title: "First Post", content: "Hello!", createdAt: new Date() },
    { id: 2, userId: 1, title: "Second Post", content: "World!", createdAt: new Date() },
  ];

  private comments: Comment[] = [
    { id: 1, postId: 1, userId: 2, text: "Great post!", createdAt: new Date() },
  ];

  async findUserById(id: number): Promise<User | null> {
    await this.delay();
    return this.users.find((u) => u.id === id) || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    await this.delay();
    return this.users.find((u) => u.email === email) || null;
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    await this.delay();

    // Simulate constraint violation
    const existing = this.users.find((u) => u.email === user.email);
    if (existing) {
      throw new Error("Email already exists");
    }

    const newUser: User = {
      id: Math.max(...this.users.map((u) => u.id)) + 1,
      ...user,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async findPostsByUserId(userId: number): Promise<Post[]> {
    await this.delay();
    return this.posts.filter((p) => p.userId === userId);
  }

  async createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post> {
    await this.delay();

    // Simulate foreign key constraint
    const user = this.users.find((u) => u.id === post.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newPost: Post = {
      id: Math.max(...this.posts.map((p) => p.id)) + 1,
      ...post,
      createdAt: new Date(),
    };
    this.posts.push(newPost);
    return newPost;
  }

  async findCommentsByPostId(postId: number): Promise<Comment[]> {
    await this.delay();
    return this.comments.filter((c) => c.postId === postId);
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 50));
  }
}

const db = new Database();

// ============================================================================
// Example 1: Simple query with AsyncResult
// ============================================================================

const getUserById = async (id: number): Promise<Result<User, DatabaseError>> => {
  console.log(`\n=== Example 1: Find user by ID ===`);
  console.log(`Searching for user ${id}...`);

  const result = await fromPromise(db.findUserById(id))
    .map((user) => {
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    })
    .mapErr((error): DatabaseError => ({
      type: "NOT_FOUND",
      message: error.message,
    }));

  return result.match(
    (user) => {
      console.log(`✓ Found user: ${user.name} (${user.email})`);
      return ok(user);
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      return err(error);
    }
  );
}

// ============================================================================
// Example 2: Handling constraint violations
// ============================================================================

const createNewUser = async (
  name: string,
  email: string
): Promise<Result<User, DatabaseError>> => {
  console.log(`\n=== Example 2: Create new user ===`);
  console.log(`Creating user: ${name} (${email})...`);

  const result = await fromPromise(db.createUser({ name, email }))
    .mapErr((error): DatabaseError => {
      if (error.message.includes("already exists")) {
        return {
          type: "CONSTRAINT",
          message: "A user with this email already exists",
        };
      }
      return {
        type: "QUERY",
        message: error.message,
      };
    });

  return result.match(
    (user) => {
      console.log(`✓ User created: ${user.name} (ID: ${user.id})`);
      return ok(user);
    },
    (error) => {
      console.log(`✗ Error [${error.type}]: ${error.message}`);
      return err(error);
    }
  );
}

// ============================================================================
// Example 3: Query with foreign key relationship
// ============================================================================

const getUserWithPosts = async (userId: number) => {
  console.log(`\n=== Example 3: Get user with posts ===`);

  const result = await fromPromise(db.findUserById(userId))
    .flatMap((user) => {
      if (!user) {
        return errAsync<DatabaseError>({
          type: "NOT_FOUND",
          message: "User not found",
        });
      }
      return okAsync(user);
    })
    .flatMapAsync(async (user) => {
      const posts = await fromPromise(db.findPostsByUserId(user.id));
      return posts.map((postList) => ({ user, posts: postList }));
    })
    .mapErr((error): DatabaseError => error);

  return result.match(
    (data) => {
      console.log(`✓ ${data.user.name} has ${data.posts.length} posts`);
      data.posts.forEach((post) => {
        console.log(`  - ${post.title}`);
      });
      return data;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
};

// ============================================================================
// Example 4: Transaction-like behavior
// ============================================================================

const createPostWithValidation = async (
  userId: number,
  title: string,
  content: string
) => {
  console.log(`\n=== Example 4: Transaction-like operation ===`);

  // Verify user exists first
  const userResult = await fromPromise(db.findUserById(userId));
  if (userResult.isErr() || !userResult.value) {
    console.log(`✗ User ${userId} not found`);
    return err<DatabaseError>({
      type: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Validate title length
  if (title.length < 5) {
    console.log(`✗ Title too short`);
    return err<DatabaseError>({
      type: "CONSTRAINT",
      message: "Title must be at least 5 characters",
    });
  }

  // Create post
  const result = await fromPromise(
    db.createPost({ userId, title, content })
  ).mapErr((error): DatabaseError => ({
    type: "QUERY",
    message: error.message,
  }));

  return result.match(
    (post) => {
      console.log(`✓ Post created: ${post.title} (ID: ${post.id})`);
      return ok(post);
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      return err(error);
    }
  );
}

// ============================================================================
// Example 5: Complex query with nested data
// ============================================================================

const getPostWithComments = async (postId: number) => {
  console.log(`\n=== Example 5: Get post with comments ===`);

  const result = await fromPromise(
    db.findPostsByUserId(postId) // Note: simplified for demo
  )
    .flatMapAsync(async (posts) => {
      const post = posts[0]; // Get first post for demo
      if (!post) {
        return errAsync<DatabaseError>({
          type: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Fetch comments
      return fromPromise(db.findCommentsByPostId(post.id)).map((comments) => ({
        post,
        comments,
      }));
    })
    .mapErr((error): DatabaseError => error);

  return result.match(
    (data) => {
      console.log(`✓ Post: ${data.post.title}`);
      console.log(`  Comments: ${data.comments.length}`);
      data.comments.forEach((comment) => {
        console.log(`    - ${comment.text}`);
      });
      return data;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 6: Using Try for unsafe operations
// ============================================================================

type DatabaseRecord = {
  user?: string;
  data?: unknown;
};

const parseDatabaseJson = (jsonString: string): Result<DatabaseRecord, DatabaseError> => {
  console.log(`\n=== Example 6: Safe JSON parsing with Try ===`);

  return attempt(() => JSON.parse(jsonString))
    .mapErr((error): DatabaseError => ({
      type: "QUERY",
      message: `Invalid JSON: ${error.message}`,
    }))
    .match(
      (data) => {
        console.log(`✓ JSON parsed successfully`);
        return ok(data);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 7: Batch operations
// ============================================================================

const createMultiplePosts = async (userId: number, postDataList: Array<{ title: string; content: string }>) => {
  console.log(`\n=== Example 7: Batch operations ===`);

  // Verify user exists
  const userResult = await fromPromise(db.findUserById(userId));
  if (userResult.isErr() || !userResult.value) {
    return err<DatabaseError>({
      type: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Create all posts (in real app, use actual transaction)
  const results = await Promise.all(
    postDataList.map((data) =>
      fromPromise(db.createPost({ userId, ...data }))
        .mapErr((error): DatabaseError => ({
          type: "QUERY",
          message: error.message,
        }))
    )
  );

  const successes = results.filter((r) => r.isOk());
  const failures = results.filter((r) => r.isErr());

  console.log(`✓ Created ${successes.length} posts`);
  if (failures.length > 0) {
    console.log(`✗ Failed to create ${failures.length} posts`);
  }

  return ok(successes.map((r) => (r.isOk() ? r.value : null)).filter(Boolean));
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Database Operations with @deessejs/core                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Simple query
    await getUserById(1);
    await getUserById(999);

    // Example 2: Create user (handle constraint)
    await createNewUser("Charlie", "charlie@example.com");
    await createNewUser("Alice", "alice@example.com"); // Duplicate

    // Example 3: User with posts
    await getUserWithPosts(1);

    // Example 4: Transaction-like
    await createPostWithValidation(1, "My New Post", "Post content here");
    await createPostWithValidation(1, "Bad", "Content"); // Title too short

    // Example 5: Post with comments
    await getPostWithComments(1);

    // Example 6: Try for JSON parsing
    parseDatabaseJson('{"user": "alice"}');
    parseDatabaseJson("invalid json");

    // Example 7: Batch operations
    await createMultiplePosts(1, [
      { title: "Batch Post 1", content: "Content 1" },
      { title: "Batch Post 2", content: "Content 2" },
    ]);

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
