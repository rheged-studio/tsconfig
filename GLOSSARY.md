<!-- init:context -->

# npm-package-template

A GitHub template for publishable npm packages: a TypeScript package skeleton plus the full release-please, OIDC publish and dated-changelog shell. It exists so a new package starts with the estate's build, release and publish machinery already wired.

<!-- /init:context -->

## Language

### Release shell

**Version-of-record**:
The `version` in `package.json`, mirrored in `.release-please-manifest.json`, which is the repo's only statement of what release it is on. It is bumped by release-please and nothing else.
_Avoid_: Package version, build version

**Release PR**:
The `chore(main): release <version>` pull request that release-please opens on the `release-please--branches--main` branch. Merging it moves the version-of-record and sets up the publish.
_Avoid_: Version PR, bump PR

**Clacks**:
The estate's release orchestrator (`rheged-studio/clacks`). It opens and squash-merges the release PR once GO/NO GO is green; the merge then re-fires `pkg-release.yml`, which publishes.
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

<!-- init:template-only -->

### Template

**Spawn**:
To create a new repo from this template with GitHub's "Use this template". A spawn copies the file tree but not rulesets, environments, repo settings or org wiring.
_Avoid_: Fork, clone, generate

**Spawned repo**:
A repo created by spawning this template, before and after it has been initialised.
_Avoid_: Child repo, derived repo

**initialise-package-repo**:
The repo-local, one-shot skill that takes a spawned repo to a release-ready state: file resets, skills pull, skill configs and GitHub settings. It is dry-run first and a second run is a no-op.
_Avoid_: Scaffolder, setup script, init script

**Placeholder identity**:
The template's own name, `@rheged-studio/npm-package-template`, as it appears in `package.json` and repo config, together with the placeholder `src/` API. While it is present the repo counts as not yet renamed.
_Avoid_: Default name, template name

**Bootstrap skill bundle**:
A shared skill copied into the template tree only so `initialise-package-repo` can run straight after a spawn. The spawned repo replaces it with a pull from `agent-skills`.
_Avoid_: Vendored skills, frozen skills

**Changelog poisoning**:
The failure where the template's own dated entries survive into a spawned repo and finalise sweeps them into its first release notes. Resetting `changelog/` to its README prevents it.
_Avoid_: Stale changelog, changelog leakage

**Disabled Release workflow**:
The template repo's own `Release` workflow, switched off because its placeholder `src/` is never published. The spawned repo re-enables it once its `npm-release` environment exists.
_Avoid_: Paused release, broken release

<!-- /init:template-only -->
