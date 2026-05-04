# r/javascript - Post Template

## Subreddit Info
- **Subscribers**: 2,431,107
- **Audience**: Large JavaScript/TypeScript community
- **Priority**: Tier 1 (High)

## Rules to Follow
1. No excessive self-promotion
2. Must include code (not just demos)
3. No low-effort content or listicles
4. OK to promote own content if not spammy
5. Discussion posts are welcome

## Post Template

```
Typed error handling for JSON.parse() in TypeScript - am I overcomplicating this?

Just ran into this again and it's been driving me crazy.

```typescript
const user = JSON.parse(responseBody); // What does this return?
// Since TS 4.4+: unknown (honest - it can be anything)
// Before TS 4.4: any (TypeScript had no idea)
```

Since TypeScript 4.4, JSON.parse returns `unknown` which is honest - it forces you to narrow the type. But handling the actual error cases still feels manual.

I've been experimenting with wrapping it:

```typescript
const result = attempt(() => JSON.parse(responseBody));

if (result.isErr()) {
  // result.error is typed as Error
  console.error('Parse failed:', result.error.message);
  return;
}
// result.value is unknown - still need to narrow/validate
const user = result.value as User;
```

No more mysterious "undefined is not a function" three stack frames deep.

Am I overcomplicating this? How do you all handle JSON parsing in TypeScript?
```

## Why This Works
- Shows a relatable problem (JSON.parse)
- Presents the solution organically
- Invites pushback ("Am I overcomplicating this?")
- Very concrete example

## Engagement
- Large audience = high potential reach
- Focus on practical examples
- Answer questions about the pattern
