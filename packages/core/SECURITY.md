# Security Policy

**Version:** 1.0
**Date:** April 2026

---

## Supported Versions

| Version | Status | Notes |
|---------|--------|-------|
| 3.x | :white_check_mark: Supported | Current stable release |
| < 3.0 | :x: Unsupported | Upgrade to 3.x recommended |

Security updates are provided for the latest major version. We recommend staying up to date.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

**Email:** security@nesalia.com

**Response time:** We aim to respond within 48 hours.

**Please do NOT report security vulnerabilities via GitHub issues.** Public issues make it easier for attackers to exploit vulnerabilities before a fix is available.

---

## What to Include in Your Report

When reporting, please include:

1. **Description** - A clear description of the vulnerability
2. **Steps to Reproduce** - How to demonstrate the issue
3. **Impact** - How this vulnerability could be exploited
4. **Affected Version(s)** - Which versions are affected
5. **Optional: Suggested Fix** - If you have ideas for fixes

---

## Disclosure Policy

We follow a responsible disclosure model:

1. Researcher reports vulnerability via email
2. We confirm receipt within 48 hours
3. We investigate and determine severity
4. We develop and test a fix
5. We coordinate release with researcher
6. Public disclosure with credit to researcher

---

## Security Best Practices for Users

### Sensitive Data Redaction

@deessejs/fp automatically redacts sensitive fields in error messages:

```typescript
// These fields are automatically redacted:
const SENSITIVE_FIELDS = [
  'password', 'passwd', 'secret', 'token', 'accesstoken',
  'refreshtoken', 'apikey', 'privatekey', 'credential', 'auth',
  'authorization', 'cookie', 'session', 'ssn', 'creditcard'
];
```

**Recommendation:** Do not log error objects directly. Use the built-in redaction:

```typescript
import { error } from '@deessejs/fp';

const result = await fetchUser(id);
result.match({
  onSuccess: (user) => console.log(user),
  onError: (err) => logger.error(err.message) // Redacted automatically
});
```

### Input Validation

Always validate external input with Zod before creating errors:

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

const ApiError = error({
  name: 'ApiError',
  schema: z.object({
    code: z.string(),
    details: z.record(z.unknown()).optional()
  }),
  message: (args) => `API error: ${args.code}`
});
```

---

## Security-Related Updates

For critical security updates, we will:

- Publish a security advisory on GitHub
- Release a patch version (e.g., 3.0.1)
- Announce via Twitter/X (@deessejs)
- Email registered security watchers (coming soon)

---

## Scope

This security policy applies to:

- `@deessejs/fp` npm package
- GitHub repository: nesalia-inc/fp
- Documentation site: fp.deessejs.com

Third-party libraries (Zod, etc.) have their own security policies.

---

## Credit

We believe in recognizing responsible disclosure. If you report a vulnerability that we act on, we will credit you (unless you prefer to remain anonymous) in our security advisory.

---

## Contact

**Security issues only:** security@nesalia.com

**General questions:** Use GitHub Discussions

**Bug reports:** Open an issue (non-security bugs only)
