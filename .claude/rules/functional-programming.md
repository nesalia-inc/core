---
paths:
  - "**/*.ts"
---

# Functional Programming Rules

## No Classes or OOP

This project uses a functional programming style. Classes and object-oriented patterns are not allowed.

### Why This Matters

- Functional code is easier to compose and test
- No hidden state or mutable data
- Predictable behavior without side effects
- Better tree-shaking and dead code elimination

### Allowed Patterns

- **Functions**: plain functions that transform data
- **Types**: TypeScript interfaces and type aliases
- **Objects**: frozen data objects for data transfer
- **Factories**: functions that create other functions or objects

### Prohibited Patterns

- Classes with `class` keyword
- Constructor functions
- `this` context
- Inheritance (`extends`, `implements`)
- Method chaining on objects (use standalone functions instead)
- `new SomeClass()` patterns

### Examples

```typescript
// Good - function-based design
import { ok, err, map, flatMap } from "@deessejs/fp";

const processData = (input: string) => {
  const result = parse(input);
  return result.ok ? transform(result.value) : err(result.error);
};

// Bad - class-based design
class DataProcessor {
  private data: string;

  constructor(data: string) {
    this.data = data;
  }

  process(): Result<string> {
    // ...
  }
}
```

### Standalone Functions

All operations should be standalone functions, not methods on objects:

```typescript
// Good - standalone function
import { map } from "@deessejs/fp";

const doubled = map(result, x => x * 2);

// Bad - method on object
const doubled = result.map(x => x * 2);
```

For AsyncResult and other types that use Thenable pattern, the `then()` method is allowed because it implements the Thenable interface for `await` support.

### Anti-patterns to Avoid

- Do not create classes for data containers
- Do not use inheritance for code reuse
- Do not use `private`, `protected` visibility
- Do not use `static` methods on classes

### Design Patterns to Use Instead

- **Composition**: compose functions together
- **Currying**: partial application of functions
- **Pure functions**: no side effects, same input = same output
- **Factory functions**: create objects via functions instead of constructors
- **Pattern matching**: use `match()` instead of type checks

### Reference

See `packages/fp/src/result/` and `packages/fp/src/async-result/` for examples of functional patterns.