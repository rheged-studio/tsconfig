---
title: Vendor send-it 0.9.1 and commit 0.2.0
release_note: ""
version:
created_at: "2026-09-30T15:17:18Z"
merged_at:
branch: a-2078-fan-out-72-char-commit-headers-npm-package-template
pr:
commit:
author: "rob@rheged.studio"
co_authors: []
category: chore
breaking: false
issues:
  - R-2078
affected_packages:
  - infrastructure
stats:
  files_changed:
  loc_added:
  loc_removed:
---

## Changed

**Surgical skills fan-out from agent-skills `main` ([R-2078](https://linear.app/rheged-studio/issue/R-2078))**

- Re-vendor `send-it` 0.9.1 and `commit` 0.2.0 on `.claude` and `.agents` mirrors via `skills add --copy`
- Restore per-skill `config.json` after copy ([R-706](https://linear.app/rheged-studio/issue/R-706)); leave `triage-pr` untouched
