# r/typescript - Post Template

## Subreddit Info
- **Subscribers**: 177,204
- **Audience**: TypeScript-focused developers
- **Priority**: Tier 1 (High)

## Rules to Follow
1. Your post should be TypeScript focused
2. No general advertising, promoting services/libs with zero TS utility
3. No excessive self-promotion (follow Reddit's site-wide self-promotion guidelines)
4. Must be open source
5. No recruiters or recruitment posts

## Post Template

```
Handling errors that TypeScript can't track: Result types in practice

TypeScript prides itself on type safety, but there's a gap in the story.

Functions can throw. But the type system doesn't tell you.

```typescript
function parseUser(data: string): User {
  return JSON.parse(data); // Can throw SyntaxError!
}
```

TypeScript says "this returns User" - but JSON.parse has returned `unknown` since TS 4.4+. It can throw, and the type system only knows this if you're using strict mode with noImplicitAny.

I've been exploring Result types (Rust, Go, Haskell do this) to make errors explicit:

```typescript
function parseUser(data: string): Result<User, ParseError> {
  return attempt(() => JSON.parse(data));
}
```

Now the signature tells the truth: "this either gives you a User OR a ParseError - handle both."

Questions for the community:
1. How do you handle this in your projects?
2. Is this overkill or genuinely useful?
3. What patterns have worked for you?

(I've been working on a lightweight library for this, but genuinely curious what others are doing.)
```

## Why This Works
- Leads with the problem (not the library)
- Invites discussion (asks questions)
- Doesn't hard-sell
- If people ask, you share the library naturally

## Timing Recommendation
- Post during US business hours (Eastern Time)
- Tuesday through Thursday typically perform best

## Engagement
- Respond to ALL comments within the first 2 hours
- Answer questions about the approach
- Be helpful, not promotional
