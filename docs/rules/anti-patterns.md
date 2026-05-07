# Anti-Patterns

## Why Anti-Patterns Matter

Anti-patterns section help you:
- Prevent users from making common mistakes
- Explain why certain approaches don't work well
- Save time debugging issues that are already documented

## When to Include Anti-Patterns

Every feature documentation page **SHOULD** include an anti-patterns section.

## Anti-Patterns Section Template

```mdx
## Anti-Patterns

### ❌ [Anti-Pattern Name]

[Explanation of why this approach is problematic]

```typescript
// ❌ Don't do this - [reason]
[bad code example]
```

[What can go wrong if you use this approach]

---

### ✅ [Correct Pattern]

[Explanation of the better approach]

```typescript
// ✅ Do this instead - [reason]
[good code example]
```
```

## Common Anti-Pattern Categories

### 1. Ignoring Error Types

```mdx
### ❌ Ignoring Errors

```typescript
// ❌ Bad: Assuming success
const result = parseJSON(data);
// If you forget to check isOk(), you might access .value on an Err!
```

Always handle both success and error cases explicitly.

---

### ✅ Good: Handle Both Cases

```typescript
// ✅ Good: Explicit error handling
const result = parseJSON(data);
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}
```
```

### 2. Wrong Tool for the Job

```mdx
### ❌ Using Exceptions for Expected Failures

```typescript
// ❌ Bad: Using exceptions for expected failures
function findUser(id: string): User {
  const user = database.find(id);
  if (!user) throw new Error('User not found'); // Exceptions are for UNEXPECTED errors
  return user;
}
```

---

### ✅ Good: Use Result for Expected Failures

```typescript
// ✅ Good: Explicit error handling
function findUser(id: string): Result<User, Error> {
  const user = database.find(id);
  if (!user) return err(new Error('User not found'));
  return ok(user);
}
```
```

### 3. Nested Callbacks

```mdx
### ❌ Nested Callbacks

```typescript
// ❌ Bad: Deeply nested
fetchUser(id, (user) => {
  fetchPosts(user.id, (posts) => {
    fetchComments(posts[0].id, (comments) => {
      // Deeply nested, hard to read
    });
  });
});
```

---

### ✅ Good: Flat Chain with flatMap

```typescript
// ✅ Good: Linear flow
const result = await fetchUser(id)
  .flatMap(user => fetchPosts(user.id))
  .flatMap(posts => fetchComments(posts[0].id));
```
```

## Tips for Writing Anti-Patterns

1. **Be specific** - Show the exact code that's problematic
2. **Explain why** - Not just "don't do this" but "because..."
3. **Show the alternative** - Always pair with the correct pattern
4. **Use visual cues** - ❌ for anti-patterns, ✅ for correct patterns
5. **Keep it real** - Use examples that users actually encounter
