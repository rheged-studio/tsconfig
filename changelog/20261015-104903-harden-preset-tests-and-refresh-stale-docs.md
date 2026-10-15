---
title: Harden the preset tests and refresh stale docs
release_note:
created_at: "2026-10-15T10:49:03Z"
merged_at:
branch: r-2817-harden-preset-tests-and-refresh-stale-docs
pr:
commit:
author: rob@rheged.studio
co_authors: []
category: docs
breaking: false
issues:
  - R-2817
affected_packages: []
stats:
  files_changed:
  loc_added:
  loc_removed:
  commits:
---

## Changed

- Negative fixtures must fail with exactly their listed error codes, repeats included, and must exit non-zero. Before, repeated codes were collapsed, so `negative-node22` stayed green even if one of its two TS2550 errors stopped firing.
- Every preset's resolved `compilerOptions` must agree between TS 6 and TS 7 and match a committed snapshot (`infrastructure/tests/__snapshots__/`). Update a deliberate change with `pnpm test -u`.
- `library` must emit `.js`, `.d.ts` and `.d.ts.map` files and no test files. `dom.asynciterable` is banned alongside `dom.iterable`.
- The tests run tsc asynchronously, so concurrent tests really overlap. Each compiler type-checks its own copy of the fixtures.
- New fixtures cover `verbatimModuleSyntax` (TS1484), `allowArbitraryExtensions` (a `.yaml` import that fails with TS6263 without the flag), and the README's node-tooling + node24 + strictest array.
- README: release state after the 0.1.0 publish; TS 7's unstable API and the `tsc`/`tsc6` binaries; why `base` keeps options that only default under some layers; `jsxImportSource`; and a Vitest globals example that works for `node-library`.
- `CLAUDE.md` describes the new checks. `pkg-release.yml` no longer calls the workflow disabled or dormant.
