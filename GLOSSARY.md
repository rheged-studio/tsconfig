# tsconfig

Shared, layered TypeScript configuration presets for the Rheged Studio estate.

## Language

### Presets

**Preset**:
One shipped `tsconfig` JSON file that a consumer pulls in with `extends`. Preset names and the `exports` shape are settled in R-274.
_Avoid_: Config, profile, template

**Layer**:
A level in the preset stack: `base`, then a runtime (such as `node` or `dom`), then a role (such as `library` or `tooling`) or a framework. Each layer extends the one below it.
_Avoid_: Tier (in code and docs), level

**Combination**:
A ready-made preset that extends a fixed set of layers (for example `node-library`), so most consumers extend one file instead of composing layers themselves.
_Avoid_: Bundle, recipe

### Release shell

**Version-of-record**:
The `version` in `package.json`, mirrored in `.release-please-manifest.json`, which is the repo's only statement of what release it is on. It is bumped by release-please and nothing else.
_Avoid_: Package version, build version

**Release PR**:
The `chore(main): release <version>` pull request that release-please opens on the `release-please--branches--main` branch. Merging it moves the version-of-record and sets up the publish.
_Avoid_: Version PR, bump PR

**Clacks**:
The estate's release orchestrator (`rheged-studio/clacks`). It opens and squash-merges the release PR once GO/NO GO is green; the merge then re-fires `pkg-release.yml`, which publishes. This repo is registered with `release: null` until the bootstrap publish (R-277), so Clacks opens no release PRs yet.
_Avoid_: Orchestrator, release bot

**road-runner-bot**:
The org-wide GitHub App identity that Clacks and the changelog write-back act as. It is the only actor allowed to bypass the required-check and trunk rulesets.
_Avoid_: The bot, Roadrunner

**GO/NO GO**:
The single aggregator check-run that ends `ci.yml` and is the required check on `main`. It passes only when every real CI job succeeded or was skipped, and Clacks waits on it before merging a release PR.
_Avoid_: Build & Lint, CI gate, status check

### Publishing

**Publish surface**:
What the package exposes to consumers: the entry point at `src/index.ts`, built into `dist/`. Everything else in the repo is shell and is not published.
_Avoid_: Public API, exports map

**Trusted Publishing**:
npm's OIDC-based publish authentication, bound to this repo and the `pkg-release.yml` workflow filename, so CI publishes without any `NPM_TOKEN` secret.
_Avoid_: OIDC publish, token publish

**`npm-release` environment**:
The `main`-restricted GitHub environment that both privileged publish jobs run under, so only a ref on `main` can mint a publish credential.
_Avoid_: Release environment, publish environment

**Bootstrap publish**:
The manual first publish of a new package, done with a passkey, followed by the `v<initial>` tag and GitHub release. npm cannot configure Trusted Publishing until the package exists, so CI only takes over from publish number two.
_Avoid_: First release, initial publish

**Baseline tag**:
The `v0.0.0` tag pushed when the repo was created. It matches the seeded version-of-record, so `pkg-release.yml` sees the tag, skips publishing and still runs the changelog job until the bootstrap publish.
_Avoid_: Dummy tag, placeholder release

### Changelog

**Dated changelog**:
The `changelog/` directory, the repo's only changelog, holding one dated Markdown file per PR. There is no root `CHANGELOG.md`.
_Avoid_: CHANGELOG.md, release notes

**Changelog entry**:
One file in the dated changelog, named `<YYYYMMDD-HHMMSS>-<slug>.md`, written at PR time by `/send-it`. A non-release entry simply stays version-less.
_Avoid_: Changeset, release note

**Finalise**:
The post-merge step, run by `pkg-release.yml`'s `changelog-enrich` job in `mode: finalise`, that fills a changelog entry's `merged_at`, `commit`, `pr` and `stats` and stamps `version` once release-please has cut a release.
_Avoid_: Enrich, stamp
