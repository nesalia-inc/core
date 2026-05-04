# r/functionalprogramming - Post Template

## Subreddit Info
- **Subscribers**: 33,658
- **Audience**: FP community interested in error handling patterns
- **Priority**: Tier 1 (High)

## Rules to Follow
1. Posts should be related to Functional Programming
2. Self-promotion OK if not spammy
3. No paywall content
4. Content must be in English
5. Avoid spamming or cluttering
6. No affiliated links

## Post Template

```
Error handling in TypeScript: exploring Result patterns from FP

Coming from Haskell/Rust, I've been exploring how TypeScript handles errors differently.

In Haskell:
```haskell
parseUser :: String -> Either ParseError User
```

The type tells you everything. You MUST handle the error case.

In TypeScript:
```typescript
function parseUser(data: string): User {
  return JSON.parse(data); // Can throw... but type says nothing
}
```

I've been looking at established FP libraries in TypeScript to bring this guarantee:

- fp-ts has Either and TaskEither
- neverthrow has a Result type with async support
- ts-results is a lightweight option

```typescript
import { Result, attempt } from 'neverthrow';

const result = attempt(() => JSON.parse(data));
// result is Result<unknown, Error>
```

But I'm curious - how do FP folks handle this in TypeScript projects? Are you using fp-ts? Raw Either? Something else?

What's your mental model for error handling when you can't use traditional FP patterns?
```

## Why This Works
- Respects the FP community's expertise
- Asks for their input (not lecturing)
- Sparks debate about approaches
- References established libraries (fp-ts, neverthrow)

## Engagement
- The FP community is skeptical but valuable
- Be prepared to defend the pragmatic approach
- Acknowledge fp-ts's theoretical power
- Explain why simpler API was chosen
