# Documentation Guide

This guide establishes the standards for writing `@deessejs/fp` documentation. It is inspired by best practices from Next.js, React, TypeScript, and fp-ts documentation.

> **Important**: This guide documents the *current state* of our thinking. See [VERSION_NOTES.md](./VERSION_NOTES.md) for V2 plans that address fundamental issues with this approach.

## Core Principles

### The Package is NOT the Product

**The documentation IS the product. The package is just the solution.**

A package exists to solve one or more problems. The documentation's role is to:
1. Help users understand the problem they have
2. Show how to solve it with the package
3. Guide them from "knowing nothing" to "mastery"

**This is backwards:**
```markdown
## Result

The Result type represents a value that can be either a success or a failure.
```

**This is correct:**
```markdown
## Type-Safe Error Handling

Every JavaScript developer faces this problem: you call a function that can fail, but there's no way to know from the type system whether it throws or what it throws. Exceptions escape, error types are unknown, and the compiler can't help you.

This guide explains how to handle errors in a way that:
- Makes potential failures explicit in the type signature
- Forces the compiler to verify you've handled every error case
- Turns runtime errors into compile-time errors
```

### Documentation is Teaching, Not Reference

The best documentation (like discord.py) is a **guide**, not an API reference. Users come to learn, not to copy-paste.

- **Reference API**: "What methods does Result have?"
- **Guide Documentation**: "How do I handle errors safely in TypeScript?"

A guide teaches. A reference just lists.

### The Problem-Solution-Skill Progression

Users go through three stages:

1. **Problem Awareness**: "I have a pain point"
2. **Solution Discovery**: "There's a way to solve this"
3. **Skill Mastery**: "I can use this effectively"

Your documentation must serve ALL three stages.

| Stage | User Mindset | Documentation Role |
|-------|--------------|-------------------|
| Problem Awareness | "My code is a mess with try-catch" | Explain the pain |
| Solution Discovery | "Result types exist?" | Introduce the concept |
| Skill Mastery | "How do I chain operations?" | Show patterns & APIs |

### The "I Know Nothing" Assumption

Write for someone who:
- Doesn't know the concept exists
- Has never used functional programming
- Needs step-by-step guidance

If they can't learn from your documentation alone, it has failed.

### 1. Storytelling Before API

Documentation must explain **why and how** things work, not just display API signatures.

**Bad**:
```typescript
## map

Transforms the value contained in the Result.

```typescript
const result = ok(10).map(x => x * 2);
```
```

**Good**:
```typescript
## Transforming Values

When working with a `Result`, you often want to transform the value it contains without losing the error context. This is exactly what `map` does.

Imagine you have a function that divides two numbers:

```typescript
const divide = (a: number, b: number): Result<number, string> => {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
};

const result = divide(10, 2);
// How do we transform this result to get the square of the quotient?
```

Use `map` to apply a transformation:

```typescript
const quotient = divide(10, 2)
  .map(x => x * x);  // Transforms 5 to 25

quotient.value; // 25
```

If the result is an error, `map` does nothing—the error is preserved:

```typescript
const failed = divide(10, 0)
  .map(x => x * x);

failed.error; // "Division by zero" - error is preserved
```
```

### 2. Narrative Structure

Each page should follow a logical progression:

1. **Introduction** - What is it and why use it?
2. **Problem Solved** - What problem does this abstraction solve?
3. **Fundamental Concepts** - How does it work under the hood?
4. **Practical Usage** - Real-world examples
5. **API Reference** - For quick reference

## Page Structure

### Frontmatter

```yaml
---
title: Result
description: Type-safe success and failure handling
---
```

### Section 1: Introduction (WHY)

Explain:
- What the type represents
- The problem it solves
- When to use it

```markdown
## Introduction

Error handling in TypeScript is traditionally complex. Exceptions can escape unexpectedly, error types are not statically verified, and error handling code quickly becomes nested and difficult to maintain.

The `Result` type solves this by making errors **explicit in the type signature**. Instead of hoping a function won't throw, the return type clearly indicates whether the operation can fail.
```

### Section 2: Creation (HOW - Creation)

Explain how to create the type, with context:

```markdown
## Creating a Result

There are two ways to create a Result: success or failure.

### The Success Path

When an operation succeeds, use `ok`:

```typescript
const success: Result<number, string> = ok(42);
```

But why wrap a simple number? Imagine a validation function:

```typescript
const validateAge = (age: number): Result<number, string> => {
  if (age < 0) return err("Age cannot be negative");
  if (age > 150) return err("Invalid age");
  return ok(age);
};
```

By returning a `Result`, you make it **impossible** for the caller to ignore the error case—TypeScript forces them to handle it.
```

### Section 3: Transformation (TRANSFORM)

This is the functional core—show `map`, `flatMap`, etc.

```markdown
## Transforming Results

Now that you have a Result, how do you work with it?

### map - Transform the Value

When you want to transform the contained value without losing error context:

```typescript
const result = ok(10)
  .map(x => x * 2)   // Ok(20)
  .map(x => x + 1);  // Ok(21)
```

If it's an error, transformations are skipped:

```typescript
const result = err("error")
  .map(x => x * 2);  // err("error") - nothing happens
```

### flatMap - Chain Operations

When your transformation returns a Result itself, use `flatMap` to avoid nested Results:

```typescript
const parseNumber = (s: string): Result<number, string> => {
  const n = Number(s);
  return isNaN(n) ? err("Invalid number") : ok(n);
};

const result = ok("42")
  .flatMap(parseNumber)  // Ok(42) - not Ok(Ok(42))
  .flatMap(n => ok(n * 2)); // Ok(84)
```
```

### Section 4: Handling (HANDLING)

How to extract the value—`getOrElse`, `match`, etc.

```markdown
## Extracting the Value

When you're ready to use the result, several options are available.

### getOrElse - Default Value

For simple cases where you want a default value on error:

```typescript
const value = ok(42).getOrElse(0);   // 42
const failed = err("e").getOrElse(0); // 0
```

### match - Exhaustible Pattern Matching

For complete handling that forces you to deal with all cases:

```typescript
const message = match(
  result,
  (value) => `Success: ${value}`,
  (error) => `Error: ${error}`
);
```

TypeScript warns you if you forget a case!
```

### Section 5: API Reference

Minimal table for quick reference:

```markdown
## API

| Function | Description |
|----------|-------------|
| `ok(value)` | Creates a success Result |
| `err(error)` | Creates a failure Result |
| `map(result, fn)` | Transforms the value |
| `flatMap(result, fn)` | Chains operations |
| `getOrElse(result, def)` | Default value |
| `match(result, ok, err)` | Pattern matching |
```

## Anti-patterns to Avoid

### 1. Listing Without Context

**Avoid**:
```markdown
## Methods

- `ok(value)` - Creates an Ok
- `err(error)` - Creates an Err
- `map(fn)` - Transforms
```

**Prefer**:
```markdown
## Transforming Without Losing Context

When you transform a Result, you want to preserve...
```

### 2. Isolated Examples

**Avoid**:
```typescript
ok(10).map(x => x * 2)
```

**Prefer**:
```typescript
// You have a validation function
const validateEmail = (email: string): Result<string, string> => {
  if (!email.includes('@')) return err("Invalid email");
  return ok(email);
};

// How to chain with transformation?
const result = ok("user@example.com")
  .flatMap(validateEmail)
  .map(email => email.toLowerCase());
```

### 3. Explaining "what" Without "why"

**Avoid**:
```markdown
`ok` creates a Result representing success.
```

**Prefer**:
```markdown
When an operation can fail, you have two choices:
1. Throw an exception (loses type context)
2. Return a Result (explicit type)

`ok` is the construction that indicates: "this operation succeeded".
```

## Style Elements

### Headings

- Use the feature name as the main heading
- `##` for major sections
- `###` for subsections

### Code

- Always include language: ` ```typescript `
- Name files for multiple examples
- Show input AND output for short examples

### Links

- Link to other types when relevant
- "See also: Maybe for optional values"

### Tables

- Use for comparisons and API references
- Keep consistent across pages

## Revision Checklist

Before publishing a page, verify:

- [ ] Introduction explains "why" in 2 sentences
- [ ] Each major method has a concrete example
- [ ] Examples show real use cases
- [ ] There is a clear "when to use" section
- [ ] API reference is up to date
- [ ] Links to other types work
- [ ] Tone is pedagogical but professional

## Documentation Patterns from Other Docs

### 1. Before/After (fp-ts, Rust)

Show the transformation from imperative to functional:

```markdown
## Imperative vs Functional

Here's how you'd traditionally do it:

```typescript
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

try {
  const result = divide(10, 2);
  console.log(result * 2);
} catch (e) {
  console.error(e.message);
}
```

With Result, the same code becomes:

```typescript
const divide = (a: number, b: number): Result<number, string> =>
  b === 0 ? err("Division by zero") : ok(a / b);

const result = divide(10, 2)
  .map(x => x * 2)
  .getOrElse(0);
```

The error is now **explicit in the type**—no try-catch,
no hidden exceptions.
```

### 2. Concrete Problem (React)

Start with a real case that doesn't work:

```markdown
## The Exception Problem

Imagine a parsing function:

```typescript
const parseInt = (s: string): number => {
  const n = Number(s);
  if (isNaN(n)) throw new Error("Invalid number");
  return n;
};
```

This function can throw an exception. How to use it safely? You must wrap in try-catch:

```typescript
try {
  const n = parseInt(userInput);
  // ...
} catch (e) {
  // How to handle this error?
}
```

The problem: TypeScript can't verify you've handled all error cases.
An exception can escape.
```

### 3. Analogy (Next.js)

Use analogies to explain concepts:

```markdown
## Understanding `map`

Think of `map` as an assembly line:

1. A box arrives (your Result)
2. You apply a transformation (the function you pass to map)
3. The box comes out with the transformed value

If the box contained an error... it remains an error.
The transformation is simply not applied.
```

### 4. TypeScript's "Hello World" Pattern

Start with the simplest possible case:

```markdown
## Hello World of Maybe

The "hello world" of Maybe—creating an optional value:

```typescript
const present: Maybe<number> = some(42);
const absent: Maybe<number> = none();
```

These two lines represent the heart of Maybe: a value that can
be present or absent.
```

### 5. Progressive Disclosure (Next.js)

Reveal information progressively:

```markdown
## To Get Started

// Short section with the essentials

## Deep Dive

// For those who want to understand the details

## Reference

// For quick lookup
```

### 6. Embedded FAQs

Anticipate reader questions:

```markdown
## But... why not just use `undefined`?

You could simply return `number | undefined`.
Why use Maybe?

- **Exhaustiveness**: TypeScript forces you to handle both cases
- **Explicit API**: The return type clearly says "this can be absent"
- **Methods**: `map`, `flatMap`, `getOrElse` make code more expressive
```

## Page Templates

### Monad Type Page

```markdown
# [Type Name]

## Why [Type]?

[Explanation of the problem it solves]

## [Imperative vs Functional / Before & After]

[Code example showing the transformation]

## Creating [Type]

### some/none or ok/err

[Explanation with context]

## Transforming

### map

[Problem -> Solution -> Code]

### flatMap

[Problem -> Solution -> Code with emphasis on avoiding nesting]

## Extracting

### getOrElse

[Simple use case]

### match

[Complex use case with exhaustiveness]

## When to Use?

[Comparative table with other types]

## API

[Reference table]
```

### Usage/Guide Page

```markdown
# [Use Case Title]

## The Problem

[Concrete description of the problem]

## Imperative Approach

[Traditional code]

## Functional Approach

[Code with @deessejs/fp]

## Common Patterns

[Examples of frequent use cases]
```

---

## Critical Self-Assessment

### What's Wrong With This Guide (V1)

This guide (V1) has fundamental issues:

1. **Feature-centric, not problem-centric**: It organizes by type (Result, Maybe, Try) rather than by user problem (validation, parsing, fallback)

2. **API-first thinking**: The structure still assumes users want to learn about types first, then methods

3. **Missing the learning journey**: No clear progression from beginner to advanced

4. **No "why this, not that"**: Users don't know when to use Result vs Maybe vs Try

5. **Assumes knowledge**: Still uses terms like "monad", "functor" without explanation

### When Package Features Are Insufficient

Sometimes documentation feels thin because **the package doesn't solve enough problems**.

Signs:
- Every use case looks like "parse or validate"
- No real-world scenarios beyond basic examples
- Users constantly ask "how do I do X?"

This is a **package problem**, not a documentation problem. The fix is to add features, not more documentation.

### The discord.py Standard

discord.py is the gold standard because:
- Every feature has a dedicated guide
- Guides are ordered by what users actually want to do
- Code is embedded in realistic contexts
- It teaches the Discord API, not just the library

We should explain:
- "How to validate user input safely"
- "How to parse external API responses"
- "How to handle configuration errors"
- "How to chain fallbacks gracefully"

NOT:
- "Here's the Result type"
- "Here's the map method"

---

## Global Documentation Patterns (from FastAPI, React, Next.js)

### Documentation Structure Hierarchy

The best documentation sites share a common structure:

```
/Learn or /Tutorial     # Step-by-step guides (problem-based)
/Reference             # API documentation (feature-based)
/How-to                # Recipes for specific tasks
/Advanced              # Deep dives for advanced users
/About                 # Meta information
```

**FastAPI example:**
```
/learn/
  /tutorial/           # First Steps, Path Parameters, Query Parameters...
  /advanced/           # Advanced topics
  /deployment/         # Deployment guides
/reference/             # FastAPI, Request, Response...
/how-to/               # Recipes
```

**React example:**
```
/learn/                # Tutorials
/reference/react/      # Hooks API reference
/community/            # Community resources
```

**Key insight**: Tutorials and Reference are ALWAYS separated. Never mix them.

### Page Naming Conventions

**Task-based names (good):**
- "Validating User Input"
- "Handling API Errors"
- "Parsing JSON Safely"
- "Chaining Operations"

**Feature-based names (avoid):**
- "The Result Type"
- "The map Method"
- "Maybe vs Result"

Users search for solutions, not types.

### Step-by-Step Writing Style

FastAPI excels at this. Each page breaks down into numbered steps:

```markdown
## Step 1: Import FastAPI

```python
from fastapi import FastAPI
```

## Step 2: Create the App

```python
app = FastAPI()
```

## Step 3: Define a Route

...
```

**Apply to our docs:**
```markdown
## Step 1: Create a Result

When an operation succeeds, wrap the value with `ok`:

```typescript
const success = ok(42);
```

## Step 2: Handle Errors

When an operation fails, create an error with `err`:

```typescript
const failure = err("Something went wrong");
```

## Step 3: Chain Operations

Use `map` to transform values:
...
```

### Code-First Approach

Show code immediately, then explain. FastAPI does this well:

```markdown
The simplest FastAPI file could look like this:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

Copy that to a file `main.py`.

Run the live server:
...
```

**Apply to our docs:**
```markdown
The simplest example creates a successful Result:

```typescript
const result = ok(42);
```

That's it. You've created a Result that represents a successful operation with the value `42`.

But what if something goes wrong?
...
```

### Technical Details in Collapsible Sections

FastAPI uses "Technical Details" callouts:

```markdown
## Step 2: Create the App

```python
app = FastAPI()
```

Here the `app` variable will be an "instance" of the class `FastAPI`.

> **Technical Details**
>
> `FastAPI` is a class that inherits directly from `Starlette`.
> You can use all Starlette functionality with `FastAPI` too.

This keeps the main flow clean while providing depth for advanced users.

### Recap at the End of Every Page

FastAPI always ends with a summary:

```markdown
## Recap

- Import FastAPI
- Create an app instance
- Define routes with decorators
- Run the server

[Next: Path Parameters →]
```

**Every page should end with:**
1. Summary of what was learned
2. Link to next topic

### Language: Documentation, Not Course

**Avoid (course language):**
- "In this chapter, you will learn..."
- "Now let's move on to..."
- "Congratulations, you now know..."
- "Take the quiz below..."

**Use (documentation language):**
- "This guide explains..."
- "This page covers..."
- "Use this when..."
- "See also: [related topic]"

### Realistic Scope for a Library

For a small error-handling library (not a framework):

| Section | Pages | Content |
|---------|-------|---------|
| Getting Started | 2 | Intro + Quick Start |
| Guides | 5-6 | Common use cases |
| Concepts | 4 | Result, Maybe, Try, Comparison |
| Reference | 2 | API details |

**Total target**: ~14 pages

This is realistic. Don't aim for 50+ pages like FastAPI - that comes with being a framework.

### Navigation Structure Template

```
/docs
  /getting-started/
    introduction.mdx        # Why error handling matters
    quick-start.mdx        # 5-minute overview

  /guides/
    validating-input.mdx   # How to validate user input
    parsing-data.mdx       # How to parse external data
    api-errors.mdx         # How to handle API failures
    chaining.mdx           # How to chain operations
    fallback.mdx           # How to provide defaults

  /concepts/
    result.mdx             # Understanding Result
    maybe.mdx              # Understanding Maybe
    try.mdx                # Understanding Try
    when-to-use.mdx        # Choosing the right type

  /reference/
    api.mdx                # Full API reference
```

### The "Hello World" Pattern

Start each concept with the simplest possible example:

```markdown
## Hello World of Result

The simplest thing you can do is create a successful Result:

```typescript
const result = ok(42);
```

That's it. One line. The value `42` wrapped in a Result.

Now let's see what you can do with it...
```

This grounds users in something concrete before introducing complexity.

### Before/After Comparison

Always show the transformation from imperative to functional:

```markdown
## Handling Parse Errors

Here's how you'd traditionally parse JSON:

```typescript
function parseUser(json: string): User {
  const data = JSON.parse(json);  // Can throw!
  return data;
}

try {
  const user = parseUser(input);
} catch (e) {
  console.error("Parse failed:", e);
}
```

The problem: exceptions can escape, and TypeScript doesn't know this function can fail.

With Result, the failure becomes explicit:

```typescript
const parseUser = (json: string): Result<User, string> => {
  try {
    return ok(JSON.parse(json));
  } catch {
    return err("Invalid JSON");
  }
};

const result = parseUser(input);
// TypeScript KNOWS this can fail
```

Now the compiler can help you handle errors properly.
```
