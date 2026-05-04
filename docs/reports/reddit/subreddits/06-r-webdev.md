# r/webdev - Post Template

## Subreddit Info
- **Subscribers**: 3,222,272
- **Audience**: General web developers, many TypeScript users
- **Priority**: Tier 2 (Medium)

## Rules to Follow
1. No self-promotion (follow the 9:1 rule - for every promotional post, contribute nine non-promotional ones)
2. No memes or screenshots
3. No low-effort posts
4. No commercial promotions
5. Must contribute to discussion
6. No vague support questions

## Post Template

```
I've been using Result types for error handling and here's what I learned

Coming from a background of writing TypeScript at a media company, I found myself frustrated with a particular pattern.

When I looked at our codebase, I kept seeing things like:
```typescript
async function getUserData(userId: string): Promise<UserData> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}
```

The caller has no idea what can go wrong. Network error? 404? 500? The type says `Promise<UserData>` but that's not quite true.

I started exploring explicit error handling. Instead of throwing, I tried returning Result types from a small utility I found (never going to mention which one, this isn't that kind of post):

```typescript
async function getUserData(userId: string): Promise<Result<UserData, NetworkError | ApiError>> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    return err(new ApiError(response.status, await response.text()));
  }

  return ok(await response.json());
}
```

Now when I call this, my editor knows exactly what might happen:
```typescript
const result = await getUserData(userId);
if (result.isErr()) {
  // result.error is either NetworkError or ApiError
  // I can handle each case specifically
  return result.error instanceof NetworkError
    ? handleOfflineState()
    : handleApiFailure(result.error.statusCode);
}
// result.value is UserData, fully typed
renderUser(result.value);
```

This shifted how I think about error handling. Instead of exceptions being "exceptional," failures are just another possible outcome - typed, handled, explicit.

Curious how others approach this. What does your error handling look like in TypeScript?
```

## Why This Works
- Genuine learning experience framing (not a hot take)
- Shows realistic API patterns (fetch, response.ok, response.json)
- Demonstrates real benefits without overclaiming
- Asks for others' approaches (invites discussion)

## Engagement
- Very large audience = high potential reach
- "Here's what I learned" framing is humble and non-preachy
- Real-world code examples resonate
- Be prepared to discuss trade-offs if challenged
