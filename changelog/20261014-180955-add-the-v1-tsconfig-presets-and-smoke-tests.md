---
title: Add the v1 tsconfig presets and preset smoke tests
release_note: First set of shared TypeScript presets — layers (base, node22, node24, dom, workers, library, app, tooling, react, react-router, strictest) and ready-made combinations (node-library, node-tooling, vite-react-app, react-router-workers, workers-app, astro), tested under TypeScript 6 and 7.
created_at: "2026-10-14T18:09:55Z"
merged_at: "2026-10-14T18:33:27Z"
branch: r-276-author-v1-presets-and-preset-smoke-tests
pr: 2
commit: 0cfb41a
author: rob@rheged.studio
co_authors: []
category: feature
breaking: false
issues:
  - R-276
  - R-274
  - R-2795
affected_packages: []
stats:
  files_changed: 73
  loc_added: 3159
  loc_removed: 95
  commits:
---

## Added

- The v1 presets in `presets/`, as decided on [R-274](https://linear.app/rheged-studio/issue/R-274) (D1–D24): the `base`, runtime (`node22`, `node24`, `dom`, `workers`), role (`library`, `app`, `tooling`), framework (`react`, `react-router`) and `strictest` layers, plus the `node-library`, `node-tooling`, `vite-react-app`, `react-router-workers`, `workers-app` and `astro` combinations. Each is commented JSONC with `$schema`, and every path uses `${configDir}`.
- [R-2795](https://linear.app/rheged-studio/issue/R-2795)'s options that add no new errors: `allowArbitraryExtensions` (app), `noEmitOnError` (library), and `esnext.disposable` + `esnext.error` (node24).
- Preset smoke tests: the package is packed and installed, then every fixture is type-checked under TS 6.0.3 and TS 7.0.2. Negative fixtures must produce exactly their expected error codes. The tests also cover both preset spellings, the published file list, the ban on restating TS 6 defaults, and drift against `astro/tsconfigs/base`.

## Changed

- `package.json` exposes the presets through the pattern-pair `exports`, ships only `presets/*.json` and the README, declares `typescript` (`>=6`) as an optional peer, and is now `"type": "module"`.
- The repo's own `tsconfig.json` now extends the `node-tooling` preset.
- `CLAUDE.md` and `send-it`'s `shippablePaths` describe the presets.
