# r/learnprogramming - Post Template

## Subreddit Info
- **Subscribers**: 4,344,068
- **Audience**: Developers learning TypeScript
- **Priority**: Tier 2 (Medium)

## Rules to Follow
1. Beginner-friendly content
2. No vague questions
3. Self-promotion discouraged
4. Must be educational

## How to Naturally Mention a Result Library

The key is to present this as a learning journey, not a product recommendation:

- Describe the problem you encountered with try/catch
- Show what you tried before finding a solution
- Mention the library name incidentally ("I found a small utility on npm called neverthrow that helped me...")
- Focus on the concept, not the tool
- If asked directly, you can share the link - but let it come organically

## Post Template

```
[Question] How do I properly handle errors in TypeScript?

New to TypeScript, coming from Python. In Python I do:

```python
try:
    user = json.loads(data)
except JSONDecodeError as e:
    print(f"Bad JSON: {e}")
```

In TypeScript, I'm told to use try/catch but I don't understand the type system implications.

```typescript
function parseUser(data: string): User {
  try {
    return JSON.parse(data);
  } catch (e) {
    // What type is e?
    // How do I handle this properly?
    throw e; // This feels wrong
  }
}
```

People mention "Result types" — what are those? Are they worth learning?

Coming from Python exceptions, what's the TypeScript equivalent of:
```python
def parse(data):
    try:
        return Success(json.loads(data))
    except JSONDecodeError as e:
        return Error(str(e))
```

Is this a good pattern to learn early, or should I stick with try/catch?
```

## Why This Works
- Perfect for a learning subreddit
- Shows beginner mindset
- Doesn't talk down to anyone
- Asks for guidance, not claiming to have answers
- Python -> TypeScript comparison is intuitive and welcoming

## Engagement
- Beginners are receptive and grateful
- Explain concepts clearly
- Don't overwhelm with too many features
- Focus on the basic pattern first
