# DEP Index

This is the master index of all DeesseJS Enhancement Proposals (DEPs).

---

## Active DEPs

| DEP | Title | Stage | Area |
|-----|-------|-------|------|
| DEP-0001 | Result: Unified Result Type with Generator Composition | draft | area/core |
| DEP-0002 | Error: Unified Error System with Tagged Errors | draft | area/core |
| DEP-0003 | Maybe: Option Type for Nullable Values | draft | area/core |
| DEP-0004 | Try: Wrapping Throwing Functions | draft | area/core |
| DEP-0005 | Composition: pipe, flow, tap, and Observation Utilities | draft | area/core |
| DEP-0006 | Retry: Resilient Operations with Backoff and Jitter | draft | area/core |
| DEP-0007 | Sleep: Delayed Execution Utilities | draft | area/core |
| DEP-0008 | Serialization: Converting Types to/from Plain Data | draft | area/core |
| DEP-0009 | Timeout: Time-Bound Operations | draft | area/core |
| DEP-0010 | Repeat: Repeated Operation Execution | draft | area/core |

---

## Completed DEPs

| DEP | Title | Year |
|-----|-------|------|
| — | — | — |

---

## Deferred / Rejected

| DEP | Title | Reason |
|-----|-------|--------|
| — | — | — |

---

## How to Add a DEP

1. Create your DEP file: `docs/deps/DEP-XXXX-<slug>.md`
2. Add it to the **Active DEPs** table above with `draft` stage
3. Submit a pull request

DEPs follow the naming convention: `DEP-XXXX-<short-slug>.md` where `XXXX` is a sequential number (typically 4 digits, padded with zeros).

---

## DEP Numbers

DEP numbers are assigned when a DEP is **approved** (merged to main). Before approval, use `XXXX` as a placeholder in the filename.

Current allocation:

| Range | Purpose |
|-------|---------|
| 0001–0100 | Core API (Result, Maybe, Error) |
| 0101–0200 | Async patterns |
| 0201–0300 | Tooling and DevX |
| 0301–0400 | Ecosystem packages |

---

## Quick Links

- [DEP Process README](./README.md)
- [docs/internal/external/](../internal/external/) — DX specifications and analyses
