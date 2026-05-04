# Guidelines: Posting Principles

## The Golden Rule

> "Redditors hate being sold to. They love solving interesting problems together."

---

## 1. Lead with the Problem, Not the Solution

### When This Works

**WARNING**: "Lead with problem" ONLY works for established accounts with community history. New accounts (less than 3 months old, low karma) posting "problem-first" will be flagged as spam. Build community credibility first before using this technique.

This technique is effective for accounts that:
- Are 3+ months old
- Have 100+ comment karma in the target subreddit
- Have a history of genuine helpful comments

### If You Have a New Account

Post genuinely helpful comments for 2-3 months before attempting any promotion. Answer questions, participate in discussions, build a reputation.

### When You Have Credibility

### Don't Do This
> "We built @deessejs/fp to solve type-safe error handling! Check it out!"

### Do This
> "TypeScript's type system lies to you about errors. Here's the problem. How do you handle this?"

### Why It Works (For Established Accounts)
- Shows you understand their pain
- Invites discussion
- If your solution is good, they'll ask for it

---

## 2. Show Real Code with Real Pain Points

### Don't Do This
```typescript
// Abstraction that hides the problem
const result = await safeParse(data);
```

### Do This
```typescript
// Show the ugly before the clean
try {
  const user = JSON.parse(data);
  const post = await fetchPost(user.id);
  const comment = await fetchComment(post.commentId);
} catch (e) {
  // Which step failed? No idea.
}
```

### Why It Works
- Developers see their own code
- The pain is relatable
- The solution feels earned

---

## 3. Ask Questions, Don't Lecture

### Don't Do This
> "Result types are the correct approach to error handling. You should use them."

### Do This
> "Is this approach sane or have I lost my mind? What's your error handling philosophy?"

### Question Templates
- "Am I overcomplicating this?"
- "How do you handle this in your projects?"
- "What patterns have worked for you?"
- "Is this overkill or genuinely useful?"

---

## 4. Only Share the Library If People Ask

### Acceptable
> "I've been working on a lightweight library for this." (in a comment)

### Don't Do This
> Top-level post: "USE @deessejs/fp for type-safe error handling!"

### If Asked About the Library
- Share the npm/GitHub link
- Answer questions about API
- Be honest about trade-offs
- Don't spam multiple threads

---

## 5. Be Honest About Trade-offs

### Acknowledge
- "Yes, there's more upfront boilerplate"
- "It's not for every project"
- "fp-ts is a full FP toolkit, ours is focused on being approachable for teams coming from try/catch"

### Why It Works
- Builds trust
- Reduces backlash
- Signals confidence

---

## 6. Engage Authentically Over Time

### Rules
- **Stagger your replies** - don't reply to all comments within 2 hours. Space them out over 6-12 hours
- Thank people for their input
- Debates are good, defensiveness is not
- If you're wrong, admit it
- **Always disclose authorship** when sharing your own library

### What to Do
- Answer questions about the pattern
- Clarify if misunderstood
- Thank for feedback
- Debates about approach = good engagement
- Respond naturally over time, not in a burst

### What NOT to Do
- Don't ignore comments
- Don't be dismissive of criticism
- Don't repeat the same point multiple times
- Don't get defensive
- **Don't batch-reply to all comments within 2 hours** - this signals spam behavior

---

## What to Do If...

### Someone Criticizes the Library
1. Thank them for the feedback
2. Ask what would make it better
3. Be honest about limitations

### Someone Says "Just use try/catch"
1. Acknowledge it works for simple cases
2. Explain where Result types shine
3. Don't dismiss their approach

### Someone Mentions fp-ts
1. **NEVER say**: "fp-ts is overly complex"
2. **ALWAYS say**: "fp-ts is a full FP toolkit, ours is focused on being approachable for teams coming from try/catch"
3. Position @deessejs/fp as complementary, not competitive

### Someone Asks for the Link
1. Share it naturally
2. Don't make it the main point
3. Offer to answer questions

---

## Content Rules

### ALWAYS
- Include working code examples
- Show BEFORE/AFTER comparison
- Link to documentation (not just npm)
- Be honest about what the library does
- **Disclose authorship** when sharing your own library

### NEVER
- Post identical content across multiple subs
- Use clickbait titles
- Overhype or make unverifiable claims
- Ignore comments or questions
- **Mention the library name in the title**
- **Use "I built this" in the initial post**
- **Use recognizable API patterns (Result.ok(), fromPromise, etc.) in initial code examples** - this signals self-promotion

---

## Shadowban Warning

### How to Tell If You're Shadowbanned
- Your posts/comments don't appear for others but you can see them
- Use [camas.reddit.com](https://camas.reddit.com) to check if your content is visible
- Ask a trusted community member to check your post

### If Shadowbanned
1. **Do not** create a new account to evade the ban
2. **Appeal to Reddit** via the official ban appeal process
3. **Read the subreddit rules** - you likely violated them
4. **Wait 3-6 months** before attempting to post again from this account
5. **Fix the behavior**, don't just create a new account

### Prevention
- Never post the same content to multiple subreddits
- Never "I built this" or mention your library name in titles
- Space out posts over weeks, not days
- Build genuine community presence first

---

## When to Disclose Authorship

**Always disclose when sharing your own library.** This includes:
- Comments mentioning your library
- Posts where your library is relevant
- Answers to questions where your library applies

### How to Disclose
> "I'm the author of @deessejs/fp, and here's my take on..."
> "I maintain this library, and..."

### Why It Matters
- Transparency builds trust
- Failure to disclose is astroturfing/spam
- The community will find out eventually anyway

---

## Success Metrics

**Do not focus on upvotes.** Focus on qualitative signals:

| Signal | What It Means |
|--------|---------------|
| Genuine questions in comments | People are interested |
| Someone asks for the link without prompting | You've demonstrated value |
| Positive mentions in other threads | You've created genuine interest |
| People citing your post in discussions | You've contributed meaningfully |
| Invitations to do AMAs or talks | You've established credibility |

**Real goal**: Build reputation and genuine discussion, not viral hits

---

*Guidelines for effective Reddit marketing*
*Last updated: 2026-04-10*
