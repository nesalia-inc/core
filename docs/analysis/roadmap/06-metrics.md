# How to Measure Success

*Specific metrics. Track weekly.*

---

## Primary Metrics (Track Weekly)

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|--------|----------------|----------------|----------------|
| npm weekly downloads | 10,000 | 30,000 | 100,000 |
| GitHub stars | 500 | 1,500 | 5,000 |
| Docs page views/week | 500 | 2,000 | 5,000 |
| GitHub issues closed | 10 | 30 | 60 |

---

## Secondary Metrics (Track Monthly)

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|--------|----------------|----------------|----------------|
| Blog post views (total) | 2,000 | 10,000 | 50,000 |
| Conference talks given | 0 | 1 | 3 |
| Integration proposals filed | 2 | 5 | 10 |
| Companies using in production | 1 | 5 | 20 |

---

## Quality Metrics (Track Quarterly)

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Issue response time | < 48 hrs | < 24 hrs | < 12 hrs |
| Unanswered issues > 7 days | 0 | 0 | 0 |
| NPS from user survey | N/A | > 40 | > 60 |

---

## How to Track

### Weekly: Check npm Downloads

```bash
npm view @deessejs/fp --json | grep -A5 '"time"'
```

Or use [npmtrends.com](https://npmtrends.com/@deessejs/fp) for a graph.

### Weekly: Check GitHub Stars

```bash
gh repo view nesalia-inc/fp --json stargazerCount
```

### Weekly: Check Docs Traffic

If using Vercel:
```bash
vercel logs --stats
```

Otherwise, add Google Analytics or Plausible to the docs site.

### Monthly: Review What Worked

Ask:
1. Which blog post drove the most traffic?
2. Which content was shared on HN/Reddit?
3. What questions are people asking in GitHub issues?
4. Which competitor are switchers coming from?

---

## Success Indicators by Stage

### Stage 1: Pre-Launch (Month 1)

| Indicator | What It Means |
|-----------|---------------|
| npm keyword fixes applied | Library is now searchable |
| Migration guides live | Switchers can evaluate |
| Ask HN post engagement | Initial awareness |
| First 100 GitHub stars | Early adopters found you |

### Stage 2: Traction (Months 2-3)

| Indicator | What It Means |
|-----------|---------------|
| 10K weekly downloads | Genuine interest |
| 500 GitHub stars | Community认可 |
| 100 docs views/week | Documentation is working |
| Blog post shared on HN | Content is resonating |

### Stage 3: Growth (Months 4-6)

| Indicator | What It Means |
|-----------|---------------|
| 30K weekly downloads | Established in market |
| Conference talk accepted | Industry认可 |
| tRPC integration filed | Ecosystem play starting |
| 5 companies in production | Real-world validation |

### Stage 4: Scale (Months 7-12)

| Indicator | What It Means |
|-----------|---------------|
| 100K weekly downloads | Mass adoption |
| 5K GitHub stars | Trusted by community |
| Conference talk accepted at major | Thought leadership |
| Named testimonial | Enterprise credibility |

---

## The One Metric That Matters Most

**npm weekly downloads trend.**

Everything else is vanity. If downloads are growing 20%+ month-over-month, the strategy is working.

If downloads are flat after month 3, something is broken.

---

## Quarterly Review Questions

At each quarterly review, ask:

1. Are downloads growing 20%+ MoM?
2. Where are switchers coming from (neverthrow, fp-ts, new)?
3. What content drove the most downloads?
4. Are there any red flags (negative sentiment, issues, complaints)?
5. Does the ONE critical assumption still hold?
