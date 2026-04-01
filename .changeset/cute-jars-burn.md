---
"@deessejs/core": patch
---

fix: redact sensitive fields in error messages to prevent credential leakage

When creating errors without a custom message function, sensitive fields
like password, token, secret, api_key, etc. are now automatically redacted
with `[REDACTED]` in the error message to prevent accidental credential
exposure in logs.

The original `args` object remains unchanged - only the message is affected.

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
