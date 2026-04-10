# r/reactjs - Post Template

## Subreddit Info
- **Subscribers**: 498,713
- **Audience**: React developers using TypeScript
- **Priority**: Tier 2 (Medium)

## Rules to Follow
1. Posts must include code
2. No low-effort content
3. Portfolio Sunday for showcasing projects
4. Guidelines: needs code, original works, AI, career, commercial activity

## Post Template

```
Data fetching in React: handling errors at the type level

Data fetching in React apps can fail in multiple ways, but error handling often feels bolted on.

```typescript
// This can fail in multiple ways, but types don't tell us
const user = await fetchUser(id);
// - Network error
// - 404 not found
// - JSON parse error
// - Server error
```

I've been exploring Result types with React Query to make failure modes explicit:

```typescript
function UserProfile({ id }: { id: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return <Profile user={data} />;
}
```

React Query gives you typed error handling with proper loading states. The failure modes are explicit.

For more custom needs, I've been using Result types to wrap the raw fetch:

```typescript
const result = await attemptAsync(() => fetchUser(id));

if (result.isErr()) {
  // result.error is typed - no guessing
  throw new Error(`Failed to load user: ${result.error.message}`);
}
```

How are you all handling async error boundaries in TypeScript React apps?
```

## Why This Works
- React-focused problem
- Shows the pattern in a familiar context (React Query)
- Asks for community input
- Uses correct React patterns

## Key Pain Points to Highlight
- Error boundaries vs Result types
- React Query / SWR error handling
- Data fetching in concurrent mode
- Loading states vs error states

## Engagement
- React devs care about patterns and best practices
- Be ready to discuss integration with React Query/SWR
- React Query is widely adopted - relatable pain point
