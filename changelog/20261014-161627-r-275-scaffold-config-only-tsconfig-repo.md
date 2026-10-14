---
title: Scaffold the config-only @rheged-studio/tsconfig repo
release_note:
created_at: "2026-10-14T16:16:27Z"
merged_at: "2026-10-14T16:40:14Z"
branch: r-275-scaffold-rheged-studiotsconfig-from-npm-package-template
pr: 1
commit: b54f564
author: rob@rheged.studio
co_authors: []
category: chore
breaking: false
issues:
  - R-275
affected_packages: []
stats:
  files_changed: 194
  loc_added: 844
  loc_removed: 2197
  commits:
---

## Added

- Initialised the repo from npm-package-template: package identity for `@rheged-studio/tsconfig`, a reset `changelog/`, the pulled shared agent skills and their generated configs (Linear key `R`), and `GLOSSARY.md` terms for presets, layers and combinations.

## Changed

- Stripped the template's build leg to make the package config-only: no `src/`, no `tsc` build, `build: false` in `ci.yml` and `pkg-release.yml`, and a typecheck lane over `tsconfig.tools.json`.
- `files` and `exports` ship only `README.md` and `./package.json` until the presets land ([R-276](https://linear.app/rheged-studio/issue/R-276)).
- Documented the dormant release state in `CLAUDE.md` and `README.md`: the `v0.0.0` baseline tag and Clacks `release: null` keep `Release` from publishing until the first publish ([R-277](https://linear.app/rheged-studio/issue/R-277)), while `changelog-enrich` still runs.
