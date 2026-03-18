# Maybe

The Maybe type represents a value that may or may not be present (`Some` or `None`). It's the functional alternative to `null` and `undefined`.

## Why Maybe?

TypeScript's `null` and `undefined` are the source of many runtime errors:

```typescript
// Problem: This could be undefined, but the type doesn't tell us
const user = users.find(u => u.id === id);
// Type: User | undefined

// Solution: The type clearly shows presence or absence
import { some, none, fromNullable, Maybe } from '@deessejs/core';
const user = fromNullable(users.find(u => u.id === id));
// Type: Maybe<User>
```

With Maybe, **absence becomes explicit in your types**. No more `Cannot read property 'name' of undefined` surprises.

---

## Quick Start

```typescript
import { some, none, fromNullable, isSome, isNone } from '@deessejs/core';

// Present value
const present: Maybe<number> = some(42);

// Absent value
const absent: Maybe<number> = none();

// From nullable (null or undefined becomes None)
const maybe = fromNullable(getUserById(123));
```

---

## API Reference

### Creating Maybes

#### `some(value)` - Create a present value

```typescript
import { some } from '@deessejs/core';

const result = some(42);
// { ok: true, value: 42 }
```

#### `none()` - Create an absent value

```typescript
import { none } from '@deessejs/core';

const result = none();
// { ok: false }
// Note: none() is a singleton, always returns the same instance
```

#### `fromNullable(value)` - Convert nullable to Maybe

```typescript
import { fromNullable, isSome, isNone } from '@deessejs/core';

fromNullable(42);      // Some(42)
fromNullable(null);    // None
fromNullable(undefined); // None

// Important: 0, '', false are treated as present (not absent)
fromNullable(0);       // Some(0) - NOT None!
fromNullable('');      // Some('') - NOT None!
fromNullable(false);   // Some(false) - NOT None!
```

> **Key difference from null checks:** `fromNullable` only treats `null` and `undefined` as absent. This is intentional - `0`, `''`, and `false` are valid values.

#### `someUnit()` - Create a Some with undefined value

```typescript
import { someUnit } from '@deessejs/core';

const result = someUnit();
// Some(undefined) - present but with no meaningful value
```

---

### Type Guards

#### `isSome(maybe)` - Check for presence

```typescript
import { some, isSome } from '@deessejs/core';

const result = some(42);

if (isSome(result)) {
  console.log(result.value); // TypeScript knows it's Some
}
```

#### `isNone(maybe)` - Check for absence

```typescript
import { none, isNone } from '@deessejs/core';

const result = none();

if (isNone(result)) {
  // TypeScript knows it's None
  console.log('No value');
}
```

> **Why type guards?** They narrow the type, so TypeScript knows which branch you're in:

```typescript
import { isSome, isNone, Maybe } from '@deessejs/core';

function handle(maybe: Maybe<number>) {
  if (isSome(maybe)) {
    // TypeScript knows: maybe is Some<number>
    console.log(maybe.value);
  } else {
    // TypeScript knows: maybe is None
    console.log('No value');
  }
}
```

---

### Transformation Methods

#### `map(maybe, fn)` - Transform the value

Transforms the present value, passes None through unchanged:

```typescript
import { some, none, map } from '@deessejs/core';

const result = map(some(2), x => x * 2);
// Some(4)

const failed = map(none(), x => x * 2);
// None
```

Equivalent to the method on Some:

```typescript
import { some } from '@deessejs/core';

some(2).map(x => x * 2); // Some(4)
```

#### `flatMap(maybe, fn)` - Chain operations

Chains operations that can return Maybe. If Some, applies the function. If None, returns None:

```typescript
import { some, none, flatMap, Maybe } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

const findUser = (id: number): Maybe<User> => {
  if (id > 0) return some({ id, name: 'John' });
  return none();
};

const getEmail = (user: User): Maybe<string> =>
  some(user.name.toLowerCase() + '@example.com');

// Chain them
const result = flatMap(some(1), findUser);
// Some({ id: 1, name: 'John' })

const result2 = flatMap(some(-1), findUser);
// None

const result3 = flatMap(some(1), x => flatMap(findUser(x.id), getEmail));
// Some('john@example.com')
```

> **When to use flatMap:** Whenever your transformation function itself returns a Maybe.

---

### Extraction Methods

#### `getOrElse(maybe, defaultValue)` - Get value or fallback

Returns the present value, or a default if None:

```typescript
import { some, none, getOrElse } from '@deessejs/core';

const success = getOrElse(some(42), 0);  // 42
const failure = getOrElse(none(), 0);    // 0
```

#### `getOrCompute(maybe, fn)` - Get value or compute fallback

Returns the present value, or computes one if None. Useful for expensive fallbacks:

```typescript
import { some, none, getOrCompute } from '@deessejs/core';

const success = getOrCompute(some(42), () => expensiveOperation());
// 42 (expensiveOperation never called)

const failure = getOrCompute(none(), () => 0);
// 0 (computed on demand)
```

---

### Side Effects

#### `tap(maybe, fn)` - Side effect on present value

Executes a function on the value without changing it. Useful for logging:

```typescript
import { some, none, tap } from '@deessejs/core';

tap(some(42), value => console.log('Got:', value));
// Logs: "Got: 42"
// Returns: Some(42)

tap(none(), value => console.log('Got:', value));
// Nothing logged
// Returns: None
```

---

### Pattern Matching

#### `match(maybe, someFn, noneFn)` - Handle both cases

The most expressive way to handle Maybe:

```typescript
import { some, match } from '@deessejs/core';

const result = some(42);

const message = match(
  result,
  value => `Got: ${value}`,
  () => 'No value'
);
// "Got: 42"
```

Can return different types:

```typescript
import { none, match } from '@deessejs/core';

const result = none();

const value = match(
  result,
  x => x * 2,    // Some: double the number
  () => -1       // None: return -1
);
// -1
```

---

### Conversions

#### `toNullable(maybe)` - Convert to nullable

```typescript
import { some, none, toNullable } from '@deessejs/core';

toNullable(some(42)); // 42
toNullable(none());   // null
```

#### `toUndefined(maybe)` - Convert to undefined

```typescript
import { some, none, toUndefined } from '@deessejs/core';

toUndefined(some(42)); // 42
toUndefined(none());   // undefined
```

---

## Method Chaining

Maybe objects have methods built-in, enabling fluent chains:

```typescript
import { some, none } from '@deessejs/core';

const result = some(5)
  .map(x => x * 2)       // Some(10)
  .map(x => x + 1)       // Some(11)
  .flatMap(x => x > 10 ? some(x) : none());
// None (11 is not > 10)
```

Each method returns a new Maybe, so you can chain indefinitely.

---

## Real-World Examples

### Finding an item in a list

```typescript
import { fromNullable, getOrElse, Maybe } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

const findUser = (id: number): Maybe<User> =>
  fromNullable(users.find(u => u.id === id));

// Usage
const user = getOrElse(findUser(1), { id: 0, name: 'Guest' });
// { id: 1, name: 'Alice' }

const unknown = getOrElse(findUser(999), { id: 0, name: 'Guest' });
// { id: 0, name: 'Guest' }
```

### Optional Configuration

```typescript
import { fromNullable, map, Maybe } from '@deessejs/core';

interface Config {
  apiUrl: string;
  timeout: number;
}

const getConfig = (): Partial<Config> => {
  // Imagine this reads from environment or config file
  return { apiUrl: 'https://api.example.com' };
};

const maybeConfig = fromNullable(getConfig());

const withTimeout = map(maybeConfig, config => ({
  ...config,
  timeout: config.timeout ?? 5000,
}));

// Usage: withTimeout is Maybe<Config>
```

### Chained Property Access

```typescript
import { some, none, flatMap, Maybe } from '@deessejs/core';

interface Company {
  name: string;
  address?: {
    city?: string;
  };
}

const getCity = (company: Maybe<Company>): Maybe<string> =>
  flatMap(company, c =>
    flatMap(c.address, a =>
      fromNullable(a.city)
    )
  );

const company: Maybe<Company> = some({
  name: 'Acme',
  address: { city: 'Paris' }
});

getCity(company); // Some('Paris')

const companyWithoutCity: Maybe<Company> = some({
  name: 'Acme',
  address: {}
});

getCity(companyWithoutCity); // None
```

---

## Best Practices

### 1. Use `fromNullable` for External Data

```typescript
// Good: Convert external data to Maybe
const user = fromNullable(database.findUser(id));

// Instead of: let user: User | undefined = ...
```

### 2. Distinguish Between "Not Found" and "Error"

```typescript
import { ok, err, Result } from '@deessejs/core';

// Result: for operations that can fail with an error
const fetchUser = (id: number): Result<User, 'NOT_FOUND' | 'ERROR'> => {
  const user = database.findUser(id);
  if (!user) return err('NOT_FOUND');
  return ok(user);
};

// Maybe: for optional/config values
const config = fromNullable(loadConfig());
```

### 3. Use `match` for Complex Logic

```typescript
import { match } from '@deessejs/core';

const display = match(
  maybeUser,
  user => `<div>Welcome, ${user.name}</div>`,
  () => `<div>Please log in</div>`
);
```

---

## Maybe vs Result

| Use Case | Type | When |
|----------|------|------|
| Value might not exist | **Maybe** | Finding in a list, optional config |
| Operation might fail | **Result** | API calls, file operations, validation |

> **Rule of thumb:** Use Maybe for optional values (null/undefined). Use Result for operations that can fail with an error.

---

## Comparison with Alternatives

| Feature | @deessejs/core | fp-ts Option |
|---------|---------------|--------------|
| Bundle size | ~2KB | ~40KB |
| Learning curve | Low | High |
| Methods | 11 | 20+ |
| TypeScript | 5.0+ | 4.0+ |
| Dependencies | 0 | Many |

---

## Related

- [Result](./result.md) - For operations that can fail
- [Try](./try.md) - For wrapping functions that might throw
- [AsyncResult](./async-result.md) - For async operations with error handling
