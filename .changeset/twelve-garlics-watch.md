---
"@deessejs/core": major
---

fix: remove synchronous retry() function to prevent event loop blocking

Removed the synchronous `retry()` function that used a busy-wait loop
with `while (Date.now() - start < delayMs)` which completely blocks
the JavaScript event loop. This was a security issue as it could freeze
the application during retry delays.

Use `retryAsync()` instead for non-blocking retry behavior.

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
