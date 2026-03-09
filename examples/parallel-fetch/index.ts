/**
 * Parallel Data Fetching Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Running multiple async operations in parallel with AsyncResult.all
 * - Racing multiple requests with AsyncResult.race
 * - Mapping over arrays with AsyncResult.traverse
 * - Combining multiple data sources
 */

import { fromPromise, okAsync, errAsync, race, all, traverse } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type User = {
  id: number;
  name: string;
  email: string;
};

type Post = {
  id: number;
  userId: number;
  title: string;
};

type Comment = {
  id: number;
  postId: number;
  text: string;
};

type DataError = {
  type: "NOT_FOUND" | "TIMEOUT" | "NETWORK";
  message: string;
};

// ============================================================================
// Mock API functions
// ============================================================================

const fetchUser = async (id: number): Promise<User> => {
  await delay(100 + Math.random() * 100);
  return { id, name: `User ${id}`, email: `user${id}@example.com` };
}

const fetchPost = async (id: number): Promise<Post> => {
  await delay(100 + Math.random() * 100);
  return { id, userId: 1, title: `Post ${id}` };
}

const fetchComments = async (postId: number): Promise<Comment[]> => {
  await delay(100 + Math.random() * 100);
  return [
    { id: 1, postId, text: "Great!" },
    { id: 2, postId, text: "Awesome!" },
  ];
}

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Example 1: Fetch multiple users in parallel
// ============================================================================

const fetchMultipleUsers = async (ids: number[]) => {
  console.log(`\n=== Example 1: Fetch Multiple Users in Parallel ===`);
  console.time("Fetch time");

  const results = await all(
    ...ids.map((id) => fromPromise(fetchUser(id)))
  );

  console.timeEnd("Fetch time");

  return results.match(
    (users) => {
      console.log(`✓ Fetched ${users.length} users:`);
      users.forEach((user) => console.log(`  - ${user.name}`));
      return users;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 2: Race between multiple servers
// ============================================================================

const fetchFromFastestServer = async (userId: number) => {
  console.log(`\n=== Example 2: Race Between Servers ===`);
  console.time("Race time");

  // Simulate fetching from multiple servers (primary, replica, cache)
  const primary = fromPromise(
    fetchUser(userId).then((u) => ({ source: "primary", user: u }))
  );

  const replica = fromPromise(
    fetchUser(userId).then((u) => delay(200).then(() => ({ source: "replica", user: u })))
  );

  const cache = fromPromise(
    fetchUser(userId).then((u) => delay(300).then(() => ({ source: "cache", user: u })))
  );

  const result = await race(primary, replica, cache);

  console.timeEnd("Race time");

  return result.match(
    (data) => {
      console.log(`✓ ${data.source} responded first with: ${data.user.name}`);
      return data;
    },
    (error) => {
      console.log(`✗ All servers failed: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 3: Traverse - Map array with async operations
// ============================================================================

const fetchPostsForUsers = async (userIds: number[]) => {
  console.log(`\n=== Example 3: Traverse Pattern ===`);
  console.time("Traverse time");

  // Fetch all posts for each user
  const result = await traverse(userIds, (userId) =>
    fromPromise(
      fetchUser(userId).then(async (user) => {
        const posts = await Promise.all([
          fetchPost(userId * 10 + 1),
          fetchPost(userId * 10 + 2),
        ]);
        return { user, posts };
      })
    )
  );

  console.timeEnd("Traverse time");

  return result.match(
    (results) => {
      console.log(`✓ Fetched data for ${results.length} users:`);
      results.forEach(({ user, posts }) => {
        console.log(`  ${user.name}: ${posts.length} posts`);
      });
      return results;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 4: Aggregate data from multiple sources
// ============================================================================

const aggregateUserData = async (userId: number) => {
  console.log(`\n=== Example 4: Aggregate from Multiple Sources ===`);

  // Fetch all data in parallel
  const result = await all(
    fromPromise(fetchUser(userId)),
    fromPromise(fetchPost(userId * 10 + 1)),
    fromPromise(fetchComments(userId * 10 + 1))
  );

  return result.match(
    ([user, post, comments]) => {
      console.log(`✓ Aggregated data for ${user.name}:`);
      console.log(`  User: ${user.email}`);
      console.log(`  Post: ${post.title}`);
      console.log(`  Comments: ${comments.length}`);
      return { user, post, comments };
    },
    (error) => {
      console.log(`✗ Aggregation failed: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 5: Batch processing with parallelism
// ============================================================================

const processBatch = async (items: number[], batchSize: number = 3) => {
  console.log(`\n=== Example 5: Batch Processing ===`);

  const allResults: Array<{ id: number; data: User }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);

    const result = await all(...batch.map((id) => fromPromise(fetchUser(id))));

    if (result.isOk()) {
      allResults.push(...result.value.map((user) => ({ id: user.id, data: user })));
    }
  }

  console.log(`✓ Processed ${allResults.length} items total`);
  return allResults;
}

// ============================================================================
// Example 6: Fallback pattern with race
// ============================================================================

const fetchWithFallback = async (userId: number) => {
  console.log(`\n=== Example 6: Fallback Pattern ===`);

  // Try cache first, fallback to primary
  const cacheResult = fromPromise(
    fetchUser(userId).then((u) => ({ source: "cache" as const, user: u }))
  );

  const primaryResult = fromPromise(
    delay(500).then(() => fetchUser(userId).then((u) => ({ source: "primary" as const, user: u })))
  );

  // Use cache if available (fast), otherwise primary
  const result = await race(cacheResult, primaryResult);

  return result.match(
    (data) => {
      console.log(`✓ Got data from ${data.source}: ${data.user.name}`);
      return data;
    },
    (error) => {
      console.log(`✗ Fallback failed: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 7: Complex data pipeline
// ============================================================================

const buildUserDashboard = async (userId: number) => {
  console.log(`\n=== Example 7: Complex Data Pipeline ===`);

  const result = await fromPromise(fetchUser(userId))
    .flatMapAsync(async (user) => {
      // Fetch user's posts and recent activity in parallel
      const [posts, activity] = await Promise.all([
        fromPromise(fetchPost(userId * 10 + 1)),
        fromPromise(fetchComments(userId * 10 + 1)),
      ]);

      return posts.flatMapAsync((post) =>
        activity.mapAsync((comments) => okAsync({ user, post, comments }))
      );
    })
    .mapErr((error): DataError => ({
      type: "NETWORK",
      message: error.message,
    }));

  return result.match(
    (dashboard) => {
      console.log(`✓ Dashboard ready for ${dashboard.user.name}`);
      console.log(`  Latest post: ${dashboard.post.title}`);
      console.log(`  Recent comments: ${dashboard.comments.length}`);
      return dashboard;
    },
    (error) => {
      console.log(`✗ Dashboard build failed: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Parallel Data Fetching with @deessejs/core              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Parallel fetch
    await fetchMultipleUsers([1, 2, 3, 4, 5]);

    // Example 2: Race
    await fetchFromFastestServer(1);

    // Example 3: Traverse
    await fetchPostsForUsers([1, 2, 3]);

    // Example 4: Aggregate
    await aggregateUserData(1);

    // Example 5: Batch processing
    await processBatch([1, 2, 3, 4, 5, 6, 7], 3);

    // Example 6: Fallback
    await fetchWithFallback(1);

    // Example 7: Complex pipeline
    await buildUserDashboard(1);

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
