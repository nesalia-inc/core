---
name: whats-missing
description: Analyze an RFC document to find missing concepts, forgotten requirements, or gaps before the RFC is approved. Ensures RFCs reach Senior/Principal level completeness. Example: "/whats-missing docs/rfc/RFC-001.md"
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Grep
---

# What's Missing Guide

Audits an RFC document to find missing concepts, forgotten requirements, or gaps **before approval**. Ensures RFCs reach Senior/Principal level completeness.

## Purpose

An RFC is a **contract** that, once approved, defines how a system works. An incomplete RFC leads to:
- Implementation decisions made incorrectly
- Features forgotten until it's too expensive to fix
- Inconsistencies between what was designed and what was built

**This skill finds gaps in RFCs before they become implementation problems.**

## Purpose

A Senior/Principal level document is **complete**. It doesn't leave the reader guessing, doesn't assume knowledge that isn't provided, and doesn't forget important details that cause bugs in production.

**This skill finds what you've forgotten in RFCs.**

## When to Use

**Use this skill before approving any RFC.** An RFC should not be approved if it has gaps.

- During RFC review, before approval
- When an RFC feels incomplete but you can't identify why
- Before investing significant implementation effort
- When multiple RFCs interact and you need to verify consistency

**This skill analyzes ONE document in isolation.** It does NOT:
- Compare with other documents in the same system
- Suggest topics that belong to a different document
- Reference content that should be in another file

```
❌ OUT OF SCOPE:
"This document covers the server but doesn't mention the client (that's separate)"

✅ IN SCOPE:
"In the server document, you explain authentication but don't mention token refresh, expiration handling, or how to handle expired tokens in concurrent requests"
```

## What to Look For

### 1. Micro-Features (Often Forgotten)

These are features that are **implied by the main feature** but often forgotten:

| If you mention... | You should also mention... |
|-------------------|---------------------------|
| Authentication | Token refresh, expiration, logout |
| Database queries | Connection handling, retry logic, N+1 problems |
| File uploads | Size limits, file type validation, storage cleanup |
| API endpoints | Rate limiting, pagination, caching, versioning |
| Error handling | Error codes, retry strategies, dead letter queues |
| Serialization | Date formats, timezone handling, schema evolution |
| User input | Validation, sanitization, injection prevention |

### 2. Edge Cases (Often Ignored)

| Topic | Edge cases to consider |
|-------|------------------------|
| Data handling | Empty data, null values, very large datasets |
| Concurrency | Race conditions, deadlocks, thread safety |
| Time | Timezones, clock skew, leap years |
| Boundaries | Size limits, length limits, number ranges |
| Errors | Partial failures, network timeouts, corrupt data |

### 3. Operational Concerns (Often Missing)

| Category | What to check |
|----------|---------------|
| Observability | Logging, metrics, tracing, debugging |
| Configuration | Environment variables, secrets management |
| Security | Input validation, injection, authentication |
| Performance | Caching, pagination, query optimization |

### 4. Common Forgotten Concepts

These are **frequently forgotten** in technical documentation:

- **Date/time handling**: Timezones, ISO 8601, Unix timestamps vs ISO strings
- **Error response format**: Consistent structure, error codes, user-facing vs internal
- **Versioning**: How the API/system evolves, breaking changes
- **Retry logic**: When to retry, how many times, exponential backoff
- **Idempotency**: Making operations safe to retry
- **Partial failure**: What happens when some steps fail
- **Cleanup**: What happens on error, resource cleanup
- **Defaults**: What happens when optional parameters are missing
- **Order of operations**: Sequence matters, transactions

## Process

### Step 1: Read the Document

```bash
cat document.md
```

### Step 2: Identify the Document's Purpose

What is this document about? What problem does it solve?

### Step 3: List ALL Features Mentioned

Extract every feature, function, concept that is mentioned:

```
Features found in document:
1. User authentication
2. Token generation
3. User profile management
4. Role-based access control
```

### Step 4: For Each Feature, Ask "What Else?"

```bash
# For each feature, search for related micro-features
grep -i "authentication" document.md
grep -i "token" document.md
grep -i "session" document.md
```

Ask:
- What happens if [feature] fails?
- What are the limits of [feature]?
- What are the edge cases of [feature]?
- How does [feature] interact with [other feature]?

### Step 5: Check Common Forgotten Areas

```bash
# Search for common forgotten concepts
grep -i "timezone\|date\|timestamp" document.md
grep -i "error\|fail\|exception" document.md
grep -i "retry\|timeout\|limit" document.md
grep -i "cache\|performance" document.md
grep -i "security\|validation\|sanitize" document.md
```

## Example Analysis

### RFC: "Transport System v2"

```
/whats-missing docs/rfc/RFC-001-transport-system.md

RFC purpose: Define the transport layer for microservices communication

Features identified in RFC:
✓ Message format (Protobuf)
✓ Transport protocol (gRPC)
✓ Connection pooling
✓ Authentication (mTLS)

Scanning for gaps...

❌ MISSING - Related to Serialization:
- Date/time format (ISO 8601? Unix timestamps? No mention)
- Timezone handling (Services in different zones will have bugs)
- Schema versioning (How to evolve the Protobuf without breaking clients)

❌ MISSING - Operational Concerns:
- How to monitor transport health?
- What metrics to expose? (latency, error rate, queue depth)
- How to debug transport issues? (tracing, logging)
- What happens if the transport is slow? (backpressure)

❌ MISSING - Edge Cases:
- What if message is larger than buffer?
- What if service is temporarily unavailable? (circuit breaker?)
- What if network partition occurs?
- What about retry with idempotency?

❌ MISSING - Security:
- How to rotate certificates? (mTLS certs expire)
- What about mutual authentication? (already mentioned mTLS ✓)
- How to handle token distribution?

⚠️ MENTIONED but not specified:
- "Messages are validated" → What are the validation rules?
- "Connections are pooled" → What's the pool size? Configurable?
- "Timeout handling" → What's the default timeout?

RECOMMENDATIONS (BLOCK APPROVAL):
[CRITICAL] Add date/time serialization section
[CRITICAL] Add certificate rotation strategy
[HIGH] Add backpressure handling
[HIGH] Add operational monitoring section
[MEDIUM] Add circuit breaker pattern
```

### RFC: "Authentication Service"

```
/whats-missing docs/rfc/RFC-002-auth-service.md

RFC purpose: Define the authentication service for all internal services

Features identified:
✓ User authentication
✓ Token generation (JWT)
✓ Role-based access control

Scanning for gaps...

❌ MISSING - Token Lifecycle:
- Token refresh mechanism (How do clients get new tokens without re-authenticating?)
- Token expiration time (No default specified)
- Refresh token rotation (Security best practice not covered)

❌ MISSING - Security:
- Account lockout after failed attempts (Brute force vulnerability)
- Password requirements (No policy defined)
- How to handle compromised accounts? (Token revocation)

❌ MISSING - Edge Cases:
- What if auth service is down? (Fail open or closed?)
- What if database is slow? (Connection pool exhausted?)
- What if user is deleted mid-session? (Orphaned sessions)

RECOMMENDATIONS (BLOCK APPROVAL):
[CRITICAL] Add token refresh flow
[CRITICAL] Add account lockout policy
[HIGH] Add password requirements
[HIGH] Add operational logging
```

✅ FOUND but needs expansion:
- Error handling: Just says "returns error", needs specific error codes

RECOMMENDATIONS:
[HIGH] Add token refresh section
[HIGH] Add token expiration configuration
[HIGH] Add account lockout policy
[MEDIUM] Add password requirements
[MEDIUM] Add concurrent session management
[LOW] Add debugging section for auth issues
```

## Output Format

```
## What's Missing Analysis

**RFC:** [name]
**Purpose:** [what it solves]

### Critical Gaps (BLOCK APPROVAL - Will cause bugs or security issues)
| Concept | Why Critical | Found Where |
|---------|-------------|-------------|
| Token refresh | Users get locked out when tokens expire | Line 45 |
| Account lockout | Brute force vulnerability | - |

### Missing Requirements
| Requirement | Part of | Should Specify |
|---------|---------|--------------|
| Token refresh | Authentication | How to handle expired tokens |
| Certificate rotation | mTLS | How to rotate without downtime |

### Edge Cases Not Covered
- What if database is unavailable during operation
- What if concurrent requests conflict
- What if message exceeds size limit

### Operational Gaps
- No monitoring/metrics defined
- No logging specified
- No tracing strategy

### Recommendations (Priority Order)
1. [CRITICAL] Add token refresh mechanism (blocks approval)
2. [CRITICAL] Add certificate rotation strategy (blocks approval)
3. [HIGH] Add monitoring section
4. [MEDIUM] Add error handling details
```

## Scope Examples

### Senior/Principal Level Completeness ✅

These RFCs would pass the whats-missing check:

```
RFC: "Payment Processing"
✅ "Describes the payment flow, but doesn't mention: what happens if the payment provider is down (circuit breaker), what to do with partial charges, how to handle idempotency for retries"
✅ "Specifies data format, but doesn't mention: date/time timezone handling, schema versioning strategy, how to handle schema incompatibilities"

RFC: "File Upload Service"
✅ "Explains the upload flow, but doesn't mention: max file size, virus scanning, what to do if disk is full, how to clean up failed uploads"
```

### Out of Scope ❌

These are NOT gaps to report - they belong to other RFCs:

```
❌ "This RFC covers the server, the client is in a separate RFC"
❌ "This RFC covers the API, billing integration is a different RFC"
❌ "Comparing this approach to our old REST API (that's historical, not a gap)"
```

## Quality Bar

An RFC passes the "Senior/Principal" test and is ready for approval if:

- [ ] All features have their associated micro-features (not just "it works")
- [ ] All error cases are specified (not just "error handling exists")
- [ ] All limits and boundaries are defined (size, time, rate)
- [ ] All security concerns are addressed (not just "secure")
- [ ] Operational aspects are specified (monitoring, debugging, tracing)
- [ ] Date/time handling is explicit (timezone, serialization format)
- [ ] Edge cases for concurrency are covered
- [ ] Schema evolution strategy is defined (for data formats)
- [ ] Retry and idempotency strategy is defined
- [ ] Implementation would not require clarification questions

**If any critical gap is found, the RFC should NOT be approved until the gap is filled.**

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/update-doc` | Add missing content |
| `/improve-content` | Improve existing content |
| `/propose-refactoring` | Propose improvements to existing docs |