---
title: Sweep Linear issue references to R and C keys
release_note: "Rewrote old A-key Linear issue references across docs, workflows, scripts, tests and changelog entries to the new R and C keys."
created_at: "2026-10-13T21:28:00Z"
merged_at:
branch: r-2694-npm-package-template-sweep-issue-references
pr:
commit:
author: "rob@rheged.studio"
co_authors: []
category: chore
breaking: false
issues:
  - R-2694
stats:
  files_changed:
  loc_added:
  loc_removed:
---

## Changed

- Rewrite 379 Linear issue references in 66 files through the committed `linear-migrate` mapping, so `A-n` IDs now read as their `R-n` (or `C-n`) equivalents.
- Leave the vendored skills, changelog file names and `branch:` lines verbatim.
