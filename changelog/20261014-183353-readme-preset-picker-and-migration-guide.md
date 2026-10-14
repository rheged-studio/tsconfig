---
title: Add the preset picker, layering guide and migration guide to the README
release_note:
created_at: "2026-10-14T18:33:53Z"
merged_at:
branch: r-281-readme-preset-picker-and-migration-guide
pr:
commit:
author: rob@rheged.studio
co_authors: []
category: docs
breaking: false
issues:
  - R-281
affected_packages: []
stats:
  files_changed:
  loc_added:
  loc_removed:
  commits:
---

## Changed

- Rewrote the README for adopters. It now has a preset picker, an explanation of how the layers combine, an `extends` example for each preset (including the Node 24 append and a custom array), and a preset reference table.
- Documented what stays local: `paths`, `rootDirs`, `nodejs_compat` and the Nx `tsconfig.base.json` pattern. Added Vitest globals and the cases that need a custom config.
- Added a migration guide for each config family in [R-273](https://linear.app/rheged-studio/issue/R-273): the npm-package-template trio, `@tempest/tsconfig`, protomolecule's `@robeasthope/tsconfig`, comms' `tsconfig.base.json`, `astro/tsconfigs/strict`, removing `baseUrl`, and setting `types` explicitly.
