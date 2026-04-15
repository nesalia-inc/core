# Research: Developer Pain Points with TypeScript Error Handling

## The #1 Complaint: "TypeScript's type system doesn't track thrown exceptions"

The most common frustration developers face: TypeScript provides type safety for return values, but functions can throw exceptions and the type system gives no indication. This means callers have no compiler guidance about what errors might occur.

### The Core Problem
```typescript
function parseUser(data: string): User {
  return JSON.parse(data); // Can throw SyntaxError!
}
```

TypeScript 4.4+ correctly returns `unknown` from `JSON.parse()` rather than a typed result. This is accurate type behavior, but it means callers receive no help in understanding what error handling is needed. The type signature says "this returns User" but cannot communicate that it can also throw `SyntaxError`. The caller has NO IDEA from the types alone what errors might occur.

### Pain Points
- Functions that throw have no indicator in their type signature
- Callers cannot know what errors they need to handle without reading documentation or implementation
- The compiler cannot help verify that error handling is complete
- Refactoring a function to throw new error types produces no type warnings at call sites

---

## The #2 Complaint: "try/catch is verbose and pollutes my code"

> "Wrapping every operation in try/catch breaks the natural flow of my code. Error handling gets deferred far from where the error actually happened."

### The Ugly Code Developers Hate
```typescript
try {
  const user = JSON.parse(data);
  const post = await fetchPost(user.id);
  const comment = await fetchComment(post.commentId);
} catch (e) {
  // Which step failed? What kind of error? No idea.
}
```

### Pain Points
- Syntaxactically heavy
- Breaks natural code flow
- Error handling logic gets deferred far from where the error actually happened
- Nesting try/catch makes code hard to read
- Every layer of nesting adds another try/catch or propagates errors manually

---

## The #3 Complaint: "Errors are silently swallowed"

> "Empty catch blocks are a common code smell."

### Common Bad Patterns
```typescript
// Silent failure - no idea what went wrong
try {
  doSomething();
} catch (e) {}

// Swallowing the error
catch (e) {
  console.log('error'); // Wrong: should log e
  // Or worse: do nothing
}
```

### Pain Points
- Empty catch blocks silently ignore errors
- Without intentional handling, errors provide no useful information for debugging
- Console.log debugging (not logging the error itself) is a common mistake

---

## The #4 Complaint: "Union type error handling is cumbersome"

> "Manually typing `Result<T, E>` everywhere is repetitive."

### The Pain of Doing It Yourself
- Propagating errors through nested calls requires explicit matching on each layer
- No standard pattern means every codebase reinvents the wheel
- Reinventing the wheel — every team does this slightly differently

---

## The #5 Complaint: "Async error handling is especially problematic"

> "Promise.catch() chains are easy to forget."

### The Async Nightmares
- Unhandled promise rejections in async functions silently fail in some environments
- No compile-time guarantee that async errors are handled
- `catch (e: unknown)` in TypeScript 4.4+ helps but requires boilerplate

```typescript
async function getUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    return data;
  } catch (err) {
    // What is err? NetworkError? ParseError? 404? 500?
    // Good luck typing this correctly
  }
}
```

---

## The #6 Complaint: "Every team reinvents error handling"

> "We have 5 different error handling patterns in our codebase. Nobody can agree on a standard."

### Community Frustration
- No standard pattern in the ecosystem
- Easy to create inconsistent error handling across codebase
- Hard to enforce at scale without buy-in from entire team

---

## Key Takeaways for Posts

### Lead with These Pain Points:
1. **"TypeScript's type system doesn't track thrown exceptions"** — The compiler can't help you remember to handle errors
2. **"try/catch is verbose and breaks your code flow"** — Clean code gets polluted with error handling
3. **"JSON.parse can crash your app and TypeScript won't warn you"** — A concrete, relatable example
4. **"Every team reinvents error handling"** — No standard pattern in the ecosystem

### Phrases That Resonate (Alternative Framing)
- "TypeScript's type system doesn't track thrown exceptions"
- "Exceptions break the type contract"
- "try/catch is a black hole for your error types"
- "TypeScript doesn't help you handle errors — Result types do"

---

*Research source: Community discussions analysis*
*Last updated: 2026-04-10*
