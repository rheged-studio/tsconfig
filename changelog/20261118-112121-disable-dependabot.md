---
title: Remove Dependabot configuration
release_note:
created_at: "2026-11-18T11:21:21Z"
merged_at:
branch: disable-dependabot
pr:
commit:
author: rob@rheged.studio
co_authors: []
category: chore
breaking: false
issues: []
stats:
version:
---

## Changed

- Deleted `.github/dependabot.yml`. Dependabot is being switched off across the estate, so this repo no longer gets automated dependency-update PRs.
- Corrected the `CLAUDE.md` note on the shared reusable CI callers: they float on the shared-workflows `@v1` tag rather than a SHA pin that Dependabot bumps.
