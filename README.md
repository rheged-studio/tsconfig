# @rheged-studio/tsconfig

Shared, layered TypeScript configuration presets for the Rheged Studio estate. Consumers will
`extends` a preset instead of maintaining their own `tsconfig` from scratch.

> **Status: pre-release.** No presets ship yet and the package is not on npm. The v1 shape (layers,
> preset names, the `exports` pattern, compiler choices) is being settled in the **tsconfig** Linear
> project (R-274); the presets land in R-276 and the first publish in R-277.

## Requirements

- TypeScript 6 or 7 (R-274, D1).
- Node 22 and pnpm (pinned via `packageManager`) to work on this repo.

## Development

```bash
pnpm install
pnpm tsc            # type-check the repo's own tooling
pnpm lint           # eslint (infrastructure/tests)
pnpm test           # vitest
pnpm lint:md        # markdownlint
```

Ship changes with `/send-it`. See [`CLAUDE.md`](CLAUDE.md) for the full command list, the CI gate and
the release shell.

## Setup

This repo was spawned from **npm-package-template** and initialised with `/initialise-package-repo`
(R-275). The subsections below are inherited from the template and describe what the release shell
expects; they are kept as the reference for the npm bootstrap in R-277.

Done in R-275:

- [x] Package identity, changelog reset, skill pull and skill configs.
- [x] Config-only strip: no `src/` or build; `build: false` in CI and `pkg-release.yml`.
- [x] `Require GO/NO GO gate` and `Trunk` rulesets, both with the road-runner-bot bypass.
- [x] `main`-only `npm-release` environment; `Release` workflow enabled.
- [x] `v0.0.0` baseline tag, so `Release` no-ops the publish while `changelog-enrich` runs.
- [x] Registered in Clacks `fleet.json` with `release: null` (changelog only, no release PRs).
- [x] Claude review prerequisites inherited org-wide.

Left for R-277:

- [ ] [Bootstrap publish](#npm-oidc-trusted-publishing) and the Trusted Publisher.
- [ ] Flip the Clacks `fleet.json` entry to `release: "npm"`.

### Repo-level settings

Set on this repo and on each spawned repo (rulesets and environments are not copied by "Use this
template"):

- [ ] **Template repository flag enabled** (Settings → General → "Template repository") — for a
      spawned _package_ this is optional; leave it off unless the new repo is itself a template.
- [ ] "Allow auto-merge" **on**; merge commits **and** squash merges allowed
      (feature PRs → merge commit; release-please + fan-out PRs → squash —
      R-1176 / R-1177).
- [ ] Secret scanning + push protection **on**.
- [ ] npm OIDC Trusted Publishing configured (no `NPM_TOKEN` in CI — see
      [npm OIDC](#npm-oidc-trusted-publishing)).
- [ ] `main` ruleset configured (see [the required-check ruleset](#the-required-check-ruleset)).
- [ ] `npm-release` environment configured (see [the npm-release environment](#the-npm-release-environment)).

#### The required-check ruleset

`ci.yml` ends with a single **`GO/NO GO`** aggregator job whose intrinsic **check-run** is the one
stable required gate. Require it on `main` via a ruleset:

- [ ] PR required before merging.
- [ ] **0 required approvals.** ⚠️ A non-zero count blocks the orchestrator's own release-PR merge.
- [ ] Required status check: **`GO/NO GO`** — **not** the retired `🔬 Build & Lint`. The caller
      swap (R-447) replaced it with `lint / Lint` + `build-test / Build & Test`, and `GO/NO GO`
      aggregates them all.
- [ ] Ruleset **pinned to the GitHub Actions integration** (`integration_id: 15368`), so nothing
      but this repo's Actions can satisfy it.
- [ ] **road-runner-bot listed as a bypass actor** (R-1019). `pkg-release.yml`'s `changelog-enrich`
      job pushes `changelog/**` **directly to `main`** as `road-runner-bot[bot]` after each merge.
      Without the bypass, the required-check ruleset rejects that direct push (`GH013`). Human PRs
      still have to satisfy `GO/NO GO` as normal — the bypass is scoped to the bot actor only.

The `Trunk` ruleset carries the **same** road-runner-bot bypass (integration `2195582`, an `always`
bypass actor) for the pull-request / deletion / non-fast-forward rules, so the enrich push clears
both rulesets (ADR 0004 / R-808). Org `Protect main trunk` stays no-bypass (deletion /
non-fast-forward only).

Footguns (R-418):

- The gate must be a **check-run, not a commit status** — a commit status is forgeable by any
  push-scoped token; a check-run can only be minted by a GitHub App (the repo's own Actions run).
- **Never path-filter** the gate — a path-filtered required check sits Pending forever and blocks
  merges. `ci.yml` keeps it on `always()`.

#### The npm-release environment

Configured server-side (not in YAML), gating both privileged release jobs:

```bash
gh api -X PUT repos/<owner>/<repo>/environments/npm-release \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/<owner>/<repo>/environments/npm-release/deployment-branch-policies \
  -f 'name=main'
```

- [ ] Deployment-branch policy permits deployments **only from `refs/heads/main`**.
- [ ] **No required reviewers** — releases stay hands-off; this is a structural ref gate, not a
      manual approval (R-326).

Without this environment the OIDC release jobs have nowhere to deploy from and the release fails.

### Release-orchestrator onboarding

Hands-off releases are driven by the **private** `rheged-studio/release-orchestrator` repo, which
holds the bot key, runs `release-please release-pr`, and merges the release PR. Post-merge changelog
enrichment runs in-repo via `pkg-release.yml`'s `changelog-enrich` job (`@rheged-studio/changelog-core`,
R-808). Without onboarding, the repo never gets its automatic release PRs.

The template already ships everything the orchestrator needs on the repo side — release-please
config + manifest, `@rheged-studio/changelog-core`, `.nvmrc`, a publish-only `pkg-release.yml`
(with the enricher caller), and `GO/NO GO` running on the `release-please--*` branch. And since
2026-07-13 road-runner-bot is installed **org-wide** on every Rheged Studio repo, with its
`ROADRUNNER_*` credentials provisioned at org level — the `ROADRUNNER_PRIVATE_KEY` secret granted
to the config-estate repos, the `ROADRUNNER_CLIENT_ID` a non-sensitive org variable (R-945) — so
the old per-repo "install the bot" and "grant `ROADRUNNER_*` selected access" (R-821) steps no
longer apply. Onboarding now reduces to a single step:

- [ ] **Add the repo to the orchestrator's `matrix.repo`** (R-648). Matrix registration is
      orchestrator config, not a bot install or permission grant, so it is the one step that
      remains per-repo.

The required check the orchestrator waits on is **`GO/NO GO`** (the `🔬 Build & Lint` → `GO/NO GO`
cutover completed via R-419 / R-596 / R-437), and the CI callers already run on `release-please--*`
(no skip), so the changelog lane validates entries before the release PR merges.

> The old R-309 "exclude `CHANGELOG.md` from markdown lint" step no longer applies: release-please
> runs with `skip-changelog`, so there is no root `CHANGELOG.md` — the dated `changelog/` directory
> is the only changelog.

### Claude review prerequisites

`claude.yml` / `claude-code-review.yml` need **two** things, and **neither is copied** by "Use this
template":

1. **`CLAUDE_CODE_OAUTH_TOKEN`** — Anthropic model auth for the review action.
2. **The Claude GitHub App installed on the repo** — `claude-code-action` exchanges an OIDC token
   for a short-lived GitHub token, and that exchange only yields a token if the App is granted.
   Missing it, the action's internal `git fetch origin --depth=20 <branch>` runs unauthenticated
   and fails with `could not read Username` — so the review never runs **even after the secret is
   added** (R-621 / R-636).

**Preferred: provision both org-wide, then just verify per repo.** Rather than repeat this on every
spawned repo:

- [ ] `CLAUDE_CODE_OAUTH_TOKEN` as an **org secret** — new repos inherit it automatically (both the
      shared `reusable-claude.yml` caller's `secrets: inherit` and this template's explicit pass
      pick up an org secret).
- [ ] The **Claude GitHub App installed on the org** across the config-estate repos — the OIDC →
      GitHub-token exchange then works in every current/future repo with **no** per-repo grant.

> **Caveat:** the org secret alone does _not_ solve the whole problem — it fixes only the
> Anthropic-auth half; the `git fetch` failure is the **GitHub App / OIDC** half, which still needs
> the App installed. Both org-wide together is the real "zero per-repo Claude setup" answer.

**Per-repo fallback** (until org-wide provisioning is in place):

- [ ] Add the `CLAUDE_CODE_OAUTH_TOKEN` **repo secret**.
- [ ] Grant the **Claude GitHub App** to the repo. (The caller permissions — `id-token: write`,
      `contents: read`, `pull-requests: write`, `issues: read` — are already correct in the
      template; the App grant is the missing piece, not the workflow wiring.)

> **Security note on the org secret.** `CLAUDE_CODE_OAUTH_TOKEN` is an Anthropic API token — blast
> radius is API usage / billing abuse, and it is rotatable. `ROADRUNNER_PRIVATE_KEY` is
> org-compromise-grade and is now granted to the config-estate repos (each repo's in-repo
> `changelog-enrich` job mints an App token from it via `secrets: inherit`, R-821) — so it is no
> longer scoped to `release-orchestrator` alone. For **both** secrets the discipline is the same: an
> "All repositories" org secret is readable by any workflow in any org repo, so **scope them to the
> config-estate repos** (or all-private) rather than truly all — never "public repositories" — and
> rotate on exposure. Fork-PR secret withholding + "require approval for external contributors"
> (already on) mitigate the `pull_request`-trigger exposure.

### npm OIDC Trusted Publishing

npm has no pending-Trusted-Publisher flow, so bootstrap is always: manual first publish →
create the `v<initial>` git tag + GitHub release → configure Trusted Publisher → CI takes over
from publish #2.

- [ ] Manual first publish from a laptop (passkey/WebAuthn approval in the browser). The full
      runbook is in [CLAUDE.md → "Bootstrap publish"](CLAUDE.md#bootstrap-publish--read-this-when-setting-up-a-new-package).
- [ ] Create the annotated `v<initial>` git tag and matching GitHub release for the version just
      published (required — without it release-please has no baseline and may re-release the
      initial feature set as a spurious bump; R-1019). Commands are in the Bootstrap publish runbook.
- [ ] Configure the Trusted Publisher at `https://www.npmjs.com/package/<name>/access` →
      GitHub Actions → org, repo, workflow filename `pkg-release.yml`, environment **blank**.
      (npm Trusted Publishing binds its OIDC subject to repository + workflow **filename**, so this
      must be `pkg-release.yml` — the thin caller migrated from `release.yml` under R-639. Blank
      accepts any environment in `pkg-release.yml`; the form also accepts `npm-release` to narrow the
      OIDC subject claim further. Blank is the verified default — see CLAUDE.md.)
- [ ] Confirm publish #2 onwards flows through `pkg-release.yml` (OIDC, no token, no OTP) + provenance.

### Enable the Release workflow

The Release workflow (`pkg-release.yml`) is **enabled** on this repo (R-275); the `v0.0.0` baseline
tag keeps it from publishing until R-277. Its workflow **name** is `Release`, so it is toggled by
name:

```bash
gh workflow enable Release
```

### Org-level one-time bootstrap

_Template maintainer only — set once for the `rheged-studio` organisation. These protect the
release identity across every repo; a spawned-package owner can skip this section._

- [ ] `ROADRUNNER_PRIVATE_KEY` (org **secret**) → **Selected repositories = the config-estate
      repos** (both `release-orchestrator` and every served package repo, since each repo's in-repo
      `changelog-enrich` mints an App token from it via `secrets: inherit`, R-821). Never "all" /
      "public repositories". The App private key never expires and is org-compromise-grade, so keep
      the selection to the private/config-estate set — it must never be readable from an arbitrary
      public repo's CI.
- [ ] `ROADRUNNER_CLIENT_ID` (org **variable**) → non-sensitive (the App's client id is public);
      share as needed. (This is the token-mint org variable — distinct from the numeric App id
      `2195582` hard-coded as the Trunk-bypass actor in `initialise-package-repo`.)
- [ ] road-runner-bot App installed **org-wide** across the config-estate repos (the org-installed
      App's repository selection) with `contents: write` **+** `pull-requests: write` — so a
      newly-generated repo inherits the install with no per-repo grant (R-945).
- [ ] `CLAUDE_CODE_OAUTH_TOKEN` provisioned org-wide and the Claude GitHub App installed across the
      config-estate repos (see [Claude review prerequisites](#claude-review-prerequisites)).
- [ ] Actions → "Allow GitHub Actions to create and approve pull requests" → **off**.
- [ ] Default workflow token permissions → **read**.
- [ ] "Require approval for all external contributors" (fork-PR workflows) → **on**.
- [ ] "Require actions to be pinned to a full-length commit SHA" (SHA-pin enforcement) → **on**.
- [ ] Remove the org `main`-ruleset bot `bypass: always` entry — auto-merge respects branch
      protection once the required check is green.
