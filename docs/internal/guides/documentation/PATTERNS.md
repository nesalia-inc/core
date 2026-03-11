# Documentation Writing Patterns

This guide captures the patterns learned from analyzing Next.js, React, and Rust documentation. It establishes why bad documentation fails and how good documentation succeeds.

## The Anti-Pattern: Title + One Sentence + Code

**Never do this:**

```markdown
## map

Transforms the value contained in the Result.

```typescript
const result = ok(10).map(x => x * 2);
```
```

**Why this fails:**
- The reader has no context about when to use this
- No explanation of what problem it solves
- No connection to other concepts
- No understanding of tradeoffs
- Just syntax, no semantics

This is "spitting information" - dumping facts without understanding. The reader can't internalize or apply this knowledge.

---

## The Golden Rule: Paragraphs Before Examples

Good documentation follows a **progressive disclosure** pattern:

1. **Concept First** - Explain the what and why
2. **Context** - When and when not to use it
3. **Code** - Concrete examples that illustrate
4. **Deep Dive** - Edge cases, gotchas, alternatives

**The structure should flow like this:**

```
## [Method/Concept Name]

[Paragraph explaining WHAT this is - the core idea in 1-2 sentences]

[Paragraph explaining WHY you would use this - the problem it solves]

[Paragraph with a real-world SCENARIO that makes it concrete]

[Code example showing the scenario in action]

[Paragraph explaining WHAT HAPPENS with the code - walk through it]

[Optional: Caveats, gotchas, or "but what about X?"]
```

---

## Pattern 1: The "Problem First" Opening

Start by naming the pain point. Before showing `map`, explain what problem it solves.

**Bad:**
```markdown
## map

The map function transforms the value inside a container.
```

**Good:**
```markdown
## Transforming Values Without Losing Context

When you're working with a Result, you often need to transform the value it contains—but you can't just call a regular function on it. If you do, you'll lose the error context.

For example, say you have a division function that returns a Result...
```

**Why it works:**
- Names the specific pain
- Creates urgency to learn
- Connects to reader's existing knowledge
- Frames the solution as a relief

---

## Pattern 2: The Scenario Anchor

Every method should be introduced with a concrete scenario that the reader can visualize themselves in.

**Template:**
```
Imagine you're building [specific use case]. You have [data type], and you need to [action]. But here's the problem: [pain point].
```

**Example:**
```
Imagine you're validating a form with multiple fields. Each field can fail for different reasons, and you want to collect all the errors together before showing them to the user.
```

This is infinitely more engaging than "collect lets you aggregate errors."

---

## Pattern 3: The Before/After Comparison

Show the ugly way first, then reveal the elegant way.

**Structure:**
1. Show traditional approach (the "wrong" way)
2. Highlight its flaws explicitly
3. Show the library approach
4. Point out benefits

**Example:**
```
Traditional approach:

```typescript
try {
  const data = JSON.parse(userInput);
  // use data...
} catch (e) {
  console.error("Parse failed:", e);
  // But what if we need to handle this in the type system?
}
```

The problem: exceptions can escape, types don't reflect potential failure, nested try-catch code.

With Try:

```typescript
const result = attempt(() => JSON.parse(userInput));
// Now the potential for failure is explicit in the type!
```

Now the error handling is composable...
```

---

## Pattern 4: The Walkthrough Paragraph

Never show code without explaining it. After every significant code block:

1. What does this return?
2. What happens in the success case?
3. What happens in the failure case?

**Example:**
```typescript
const result = ok(10)
  .map(x => x * 2)
  .getOrElse(0);

// Let's trace through this:
// 1. ok(10) creates Ok(10)
// 2. .map(x => x * 2) transforms to Ok(20)
// 3. .getOrElse(0) extracts 20 because it's a success
// If any step had been an error, getOrElse would return 0 instead
```

---

## Pattern 5: The "Why is This Powerful?" Insight

After showing something useful, explain WHY it's powerful. This is the "aha moment" that makes documentation memorable.

**Example:**
```typescript
const message = match(
  result,
  (value) => `Success: ${value}`,
  (error) => `Error: ${error}`
);
```

<Callout type="success">
**Why is this powerful?** TypeScript will warn you if you add new error types but forget to handle them. The compiler becomes your pair programmer.
</Callout>

---

## Pattern 6: The "When NOT to Use" Section

Good documentation is honest about limitations.

**Example:**
```
## When NOT to use flatMap

Don't use flatMap when:
- Your transformation doesn't actually fail (use map instead)
- You're just doing side effects (use tap instead)
- You need parallel execution (use something else)
```

---

## Pattern 7: The Connection Paragraph

Link concepts to each other. Readers need to understand the relationship between ideas.

**Example:**
```
Now that you understand map, let's look at flatMap. The difference is subtle but important: map is for transformations, flatMap is for when your transformation itself returns a Result.
```

**Or at the end of a section:**
```
Looking back at what we've covered:
- map transforms values
- flatMap chains operations that might fail
- getOrElse extracts the final value

These three are the bread and butter of working with Result.
```

---

## Pattern 8: The Troubleshooting Anchor

For every non-trivial method, anticipate confusion points.

**Structure:**
```
### Common Mistakes

**Mistake: Forgetting to return in flatMap**

Wrong:
```typescript
result.flatMap(x => ok(x * 2))  // Returns Result<Result<number>, E>
```

Correct:
```typescript
result.flatMap(x => ok(x * 2))  // Wait, this IS correct!
```

Actually the common mistake is:
```typescript
result.flatMap(x => {
  ok(x * 2)  // Missing return!
})
```

Always return the Result from your callback.
```

---

## Pattern 9: The Decision Tree

Help readers choose between options.

```
Not sure which method to use? Here's a quick guide:

1. Do you need to transform the value?
   → Use map

2. Does your transformation might fail?
   → Use flatMap

3. Do you just want to do something with the value without changing it?
   → Use tap

4. Do you need a default if it's an error?
   → Use getOrElse

5. Do you need to handle both cases explicitly?
   → Use match
```

---

## Pattern 10: The Deep Dive Sections

For reference documentation, use progressive disclosure:

```
## Reference

(Quick summary table for experienced users)

## Detailed Explanation

(In-depth coverage for learners)

## Common Patterns

(Real-world combinations)

## Troubleshooting

(Pitfalls and how to avoid them)
```

---

## The Complete Template

Here's a template for documenting a method like `map`:

```markdown
## Transforming Values

[Paragraph 1: The problem]
When you have a Result, you often want to transform the value inside it. But regular functions won't work—they'd lose the error context.

[Paragraph 2: The solution]
This is what map does. It lets you transform the value while preserving the Result wrapper.

[Scenario: Concrete example]
Imagine you're processing user input:

[Code block]
```typescript
const processAge = (input: string): Result<number, string> => {
  const age = Number(input);
  if (isNaN(age)) return err("Invalid number");
  return ok(age);
};

const result = processAge("25")
  .map(age => age * 2);  // Transform to 50
```

[Walkthrough]
Here's what happens:
1. processAge("25") returns Ok(25)
2. .map(age => age * 2) transforms to Ok(50)
3. The error case would skip the transformation

[Why it's powerful]
This is powerful because you can chain transformations:

[Code]
```typescript
const final = processAge("25")
  .map(age => age * 2)
  .map(age => age + 1)
  .map(age => `Age is ${age}`);
```

[Gotcha/Caveat]
Note: if it's an error, the transformations are skipped entirely. The error passes through unchanged.

[Connection to next topic]
Now that you understand map, let's look at flatMap for when your transformation might itself fail...
```

---

## Quality Checklist

Before publishing any documentation page, verify:

- [ ] Does the opening paragraph explain WHY this exists?
- [ ] Is there a concrete scenario the reader can visualize?
- [ ] Does every code block have a walkthrough paragraph?
- [ ] Is there a "why is this powerful" insight?
- [ ] Are common mistakes/traps addressed?
- [ ] Is it connected to related concepts?
- [ ] Is there a decision guide if there are alternatives?
- [ ] Is the tone helpful, not just informational?

---

## Summary

Good documentation is not a reference manual—it's a teaching tool. Every section should answer:

1. **What** is this? (concept)
2. **Why** would I use it? (motivation)
3. **How** do I use it? (example)
4. **What if** I have questions? (troubleshooting)

Never just show code. Tell a story.
