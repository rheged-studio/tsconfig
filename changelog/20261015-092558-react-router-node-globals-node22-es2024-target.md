---
title: Drop Node globals from react-router, target es2024 on node22, guard pre-1.0 bumps
release_note: The react-router layer no longer adds Node types, node22 presets target ES2024, and library builds exclude every kind of test and benchmark file.
created_at: "2026-10-15T09:25:58Z"
merged_at: "2026-10-15T10:48:36Z"
branch: r-2816-fix-react-router-types-node22-target-and-library-excludes
pr: 5
commit: f433faa
author: rob@rheged.studio
co_authors: []
category: fix
breaking: true
issues:
  - R-2816
affected_packages: []
stats:
  files_changed: 16
  loc_added: 131
  loc_removed: 22
  commits: 7
version: 0.2.0
---

## Breaking

- **`react-router` layer:** `types` is now `["vite/client"]`, not `["node", "vite/client"]`. A custom `extends` array that uses the layer for a Node-hosted React Router app must add `"types": ["node", "vite/client"]` to its own `compilerOptions`. `react-router-workers` is unaffected, because it already set its own `types`.
- **`node22` layer (and so `node-library` and `node-tooling`):** `target` is now `es2024`, up from `es2022`. Libraries built with `node-library` emit ES2024 syntax, which Node 22 runs natively. Code that targets an older runtime should override `target` locally.

## Fixed

- `react-router` no longer types browser route code against Node: `setTimeout` returns `number` and `process` doesn't resolve. Runtime layers own ambient types ([R-274](https://linear.app/rheged-studio/issue/R-274) D11).
- `node22` accepts syntax Node 22 supports, such as the regex `v` flag. Under `es2022`, TypeScript rejected it with TS1501.
- `library` excludes `*.test.*`, `*.spec.*`, `*.test-d.ts`, `__tests__/` and `*.bench.*` from the build. Before, only `*.test.ts` and `*.spec.ts` were excluded.

## Changed

- release-please uses `bump-minor-pre-major`, so a breaking change on 0.x bumps the minor version. 1.0.0 still needs `Release-As: 1.0.0` ([R-2793](https://linear.app/rheged-studio/issue/R-2793)).
- Dependabot no longer proposes `typescript` or `@types/node` majors. A grouped bump to TS 7 would otherwise make the "TS 6" test leg run TS 7.
- The `dom` comment explains why `lib` stops at `es2023`: bundlers downlevel syntax, not library APIs.
- New fixtures: a Node-hosted React Router app, the react-router layer without Node globals (TS2591), a `v`-flag regex under `node-library`, and excluded test files that carry deliberate type errors.
