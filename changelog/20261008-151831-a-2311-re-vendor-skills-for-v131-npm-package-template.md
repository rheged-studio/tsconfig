---
title: Re-vendor estate skills for mattpocock 1.3.1
release_note: ""
version:
created_at: "2026-10-08T15:18:31Z"
merged_at:
branch: a-2311-re-vendor-skills-for-v131-npm-package-template
pr:
commit:
author: "rob@rheged.studio"
co_authors: []
category: chore
breaking: false
issues:
  - R-2311
stats:
  files_changed:
  loc_added:
  loc_removed:
---

## Changed

- Re-vendored the Rheged ship set and Matt Pocock engineering/productivity packs via the estate catalogue (implement-spec, retro, Rheged `pr`; removed upstream `resolving-merge-conflicts`).
- Renamed domain-modeling `CONTEXT-FORMAT.md` to `GLOSSARY-FORMAT.md` per mattpocock/skills 1.3.0.
- Set `triage-pr` to unattended Phase B (`humanEnvelope: false`) with `followUpLabel: follow-up`; left repo-local `initialise-package-repo` untouched.
