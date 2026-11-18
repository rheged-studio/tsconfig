---
title: Remove Dependabot configuration
release_note:
created_at: "2026-11-18T11:21:21Z"
merged_at: "2026-11-18T11:53:11Z"
branch: disable-dependabot
pr: 9
commit: 7d79836
author: rob@rheged.studio
co_authors: []
category: chore
breaking: false
issues: []
stats:
  loc_added: 22
  loc_removed: 47
  files_changed: 3
version:
---

## Changed

- Deleted `.github/dependabot.yml`. Dependabot is being switched off across the estate, so this repo no longer gets automated dependency-update PRs.
- Corrected the `CLAUDE.md` note on the shared reusable CI callers: they float on the shared-workflows `@v1` tag rather than a SHA pin that Dependabot bumps.
