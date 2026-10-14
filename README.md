# @rheged-studio/tsconfig

Shared, layered TypeScript configuration presets for the Rheged Studio estate. Point your
`tsconfig.json` at a preset with `extends` instead of maintaining the same compiler options in every
repo.

```jsonc
// tsconfig.json
{
  "extends": "@rheged-studio/tsconfig/node-library",
}
```

> **Status: 0.x.** The v1 presets (decided on R-274) are in `presets/`; the first npm publish is
> R-277. The package stays on 0.x until it has proved itself in real repos (R-2793). See
> [Versioning](#versioning).

- [Install](#install)
- [Pick a preset](#pick-a-preset)
- [How the layers work](#how-the-layers-work)
- [Examples](#examples)
- [Preset reference](#preset-reference)
- [What stays local](#what-stays-local)
- [Vitest globals](#vitest-globals)
- [Migration guide](#migration-guide)
- [Cases that need a custom config](#cases-that-need-a-custom-config)
- [Versioning](#versioning)
- [Development](#development) and [Setup](#setup) (for maintainers of this repo)

## Install

```bash
pnpm add -D @rheged-studio/tsconfig
```

TypeScript is an **optional peer dependency**, `>=6`, with no upper cap (R-274 D1). Every preset is
tested under TypeScript **6.0.3** and **7.0.2**. TypeScript 5.x is not supported: the presets rely on
TS 6 defaults and on options and libs (such as `es2025`) that 5.x rejects, so upgrade to 6 first.

Each preset resolves with or without the `.json` suffix, so `@rheged-studio/tsconfig/node-library`
and `@rheged-studio/tsconfig/node-library.json` are the same file.

### Using TypeScript 7

TypeScript 7.0 (the native compiler) has no programmatic API yet; one is due in 7.1. Tools that load
TypeScript as a library, including **`typescript-eslint`** and **Astro's tooling**, still need
TypeScript 6. The recommended setup installs TS 6 under the `typescript` name and TS 7 alongside it:

```json
{
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.2",
    "@typescript/native": "npm:typescript@^7.0.2"
  }
}
```

Type-check with TS 7; `typescript-eslint` and Astro keep resolving `typescript` to TS 6. The presets
behave the same under both. (`@typescript/typescript6` is published at 6.0.2, one patch behind
6.0.3.)

## Pick a preset

Start from the combination that matches the project. Each one is a tested `extends` array of the
[layers](#how-the-layers-work) below.

| Project                                                                  | Preset                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| npm package built with `tsc` and published unbundled                     | `node-library`                                 |
| Config files and scripts run by tsx or Node type stripping               | `node-tooling`                                 |
| Vite + React single-page app, Storybook                                  | `vite-react-app`                               |
| React Router framework mode deployed to Cloudflare Workers               | `react-router-workers`                         |
| Cloudflare Worker or Durable Object with no framework                    | `workers-app`                                  |
| Astro site                                                               | `astro`                                        |
| Any of the above, with the extra checks                                  | append `strictest`                             |
| A Node combination (`node-library`, `node-tooling`) running on Node 24   | append `node24`                                |
| Something else built from the same parts                                 | an `extends` array of layers (see below)       |
| Next.js, Sanity, CommonJS packages, Nx project-reference settings, Remix | not covered in v1 — see [custom config][cases] |

[cases]: #cases-that-need-a-custom-config

`node-tooling` is also the preset for the `*.config.ts` files and `infrastructure/` scripts in
every other kind of repo (R-274 D6).

## How the layers work

The presets are built from five layers. Each layer owns a distinct set of options, so they stack
without fighting over the same fields.

| Layer        | Presets                              | Owns                                                                        |
| ------------ | ------------------------------------ | --------------------------------------------------------------------------- |
| 1. base      | `base`                               | Strictness, module-syntax rules, and `target`/`types` defaults (overridden) |
| 2. runtime   | `node22`, `node24`, `dom`, `workers` | `lib`, `target` and `types`: what exists where the code runs                |
| 3. role      | `library`, `app`, `tooling`          | `module`, module resolution and emit: how the code is built                 |
| 4. framework | `react`, `react-router`              | JSX and the framework's ambient types (`react-router` extends `react`)      |
| 5. add-on    | `strictest`                          | Extra checking flags only; nothing that changes resolution or emit          |
| combinations | `node-library`, `node-tooling`, `…`  | A tested array of the layers above, plus any options that must be restated  |

Rules worth knowing:

- **`extends` takes an array.** Entries are applied in order, so list them base → runtime → role →
  framework → `strictest`. Your own `compilerOptions` are applied last of all.
- **Later entries win, field by field.** A later layer only overrides the options it sets; the rest
  carry through.
- **Arrays are replaced, never merged.** `types`, `lib` and `paths` from a later entry (or your own
  file) replace the earlier array whole. That is why `react-router-workers` restates both the
  Workers and the Vite types, and why adding one entry to `types` locally means restating the
  preset's entries too.
- **`include`, `exclude` and `files` override** in the same way; `references` are never inherited.
- **`${configDir}` resolves to your project.** A relative path in a preset would resolve from the
  preset's own file inside `node_modules`, so every preset path uses `${configDir}`, which TypeScript
  replaces with the directory of the `tsconfig.json` being compiled. `library` writes
  `${configDir}/src` → `${configDir}/dist`; `astro` includes `${configDir}/**/*`. Relative paths in
  your own file resolve from your file as usual. (`types` entries already resolve from the
  consuming project, so `workers` can name `./worker-configuration.d.ts` directly.)
- **`base` is a building block.** It sets no `module` or `lib`, so it is the first entry of a custom
  array rather than a preset to use on its own. The same goes for the runtime and role layers.

`base` deliberately leaves out options TypeScript 6 already defaults (`esModuleInterop`,
`allowSyntheticDefaultImports`, `forceConsistentCasingInFileNames`, `useDefineForClassFields`,
`DOM.Iterable`), and leaves `noUnusedLocals`/`noUnusedParameters` to ESLint (R-274 D4).

## Examples

### Combinations

```jsonc
// An npm package: src/ → dist/, Node 22
{ "extends": "@rheged-studio/tsconfig/node-library" }
```

```jsonc
// tsconfig.tools.json: config files and scripts
{
  "extends": "@rheged-studio/tsconfig/node-tooling",
  "include": ["*.config.ts", "infrastructure/**/*.ts"],
}
```

```jsonc
// A Vite + React app or Storybook
{
  "extends": "@rheged-studio/tsconfig/vite-react-app",
  "include": ["src"],
}
```

```jsonc
// React Router framework mode on Cloudflare Workers
{
  "extends": "@rheged-studio/tsconfig/react-router-workers",
  "include": [".react-router/types/**/*", "app/**/*", "workers/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"],
    "paths": { "~/*": ["./app/*"] },
  },
}
```

```jsonc
// A Worker or Durable Object with no framework
{
  "extends": "@rheged-studio/tsconfig/workers-app",
  "include": ["src"],
}
```

```jsonc
// An Astro site (the preset already includes ${configDir}/**/* and .astro/types.d.ts)
{
  "extends": "@rheged-studio/tsconfig/astro",
  "compilerOptions": { "jsxImportSource": "react" },
}
```

### Adding `strictest`

```jsonc
{
  "extends": [
    "@rheged-studio/tsconfig/vite-react-app",
    "@rheged-studio/tsconfig/strictest",
  ],
}
```

### Node 24

The Node combinations target Node 22. Append `node24` to move one to Node 24: it replaces `lib`,
`target` and `types`, and leaves everything else alone. Pair it with `@types/node` 24.

```jsonc
{
  "extends": [
    "@rheged-studio/tsconfig/node-library",
    "@rheged-studio/tsconfig/node24",
  ],
}
```

```jsonc
// Node 24 and strictest together: strictest goes last
{
  "extends": [
    "@rheged-studio/tsconfig/node-tooling",
    "@rheged-studio/tsconfig/node24",
    "@rheged-studio/tsconfig/strictest",
  ],
}
```

### A custom array of layers

When no combination fits, list the layers yourself. This is `vite-react-app` plus `strictest`
without Vite's ambient types, for a React app bundled by something other than Vite:

```jsonc
{
  "extends": [
    "@rheged-studio/tsconfig/base",
    "@rheged-studio/tsconfig/dom",
    "@rheged-studio/tsconfig/app",
    "@rheged-studio/tsconfig/react",
    "@rheged-studio/tsconfig/strictest",
  ],
  "include": ["src"],
}
```

A React Router app hosted on Node rather than Workers:

```jsonc
{
  "extends": [
    "@rheged-studio/tsconfig/base",
    "@rheged-studio/tsconfig/dom",
    "@rheged-studio/tsconfig/app",
    "@rheged-studio/tsconfig/react-router",
  ],
}
```

Check the result with `tsc --showConfig`, especially `types` and `lib`: a framework layer's `types`
replaces the runtime layer's, so a custom array may need them restated locally.

## Preset reference

| Preset                 | Layer       | Extends                          | Key options                                                                                                                                                                                                                                                      | Replaces                                                                |
| ---------------------- | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `base`                 | base        | —                                | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`, `isolatedModules`, `moduleDetection: force`, `skipLibCheck`, `resolveJsonModule`, target `es2022`, `types: []` | the shared core of every audited config                                 |
| `node22`               | runtime     | —                                | lib `es2024` + `es2025.collection` + `es2025.iterator` + `esnext.array`, target `es2022`, `types: ["node"]`                                                                                                                                                      | the template trio's `lib ES2022`/`types node`; `@tempest/tsconfig/node` |
| `node24`               | runtime     | —                                | lib `es2025` + `esnext.disposable` + `esnext.error`, target `es2025`, `types: ["node"]`                                                                                                                                                                          | —                                                                       |
| `dom`                  | runtime     | —                                | lib `es2023` + `dom`, target `es2022`                                                                                                                                                                                                                            | `DOM`/`DOM.Iterable` lib lines                                          |
| `workers`              | runtime     | —                                | lib and target `es2024`, no DOM, `types: ["./worker-configuration.d.ts"]`                                                                                                                                                                                        | per-app Workers `types` lines                                           |
| `library`              | role        | —                                | `module: nodenext`, `declaration`, `declarationMap`, `isolatedDeclarations`, `noEmitOnError`, `${configDir}/src` → `${configDir}/dist`, tests excluded                                                                                                           | the npm-package-template trio                                           |
| `app`                  | role        | —                                | `module: esnext`, `moduleResolution: bundler`, `noEmit`, `allowImportingTsExtensions`, `allowArbitraryExtensions`                                                                                                                                                | bundler blocks in comms, tempest and the React Router apps              |
| `tooling`              | role        | —                                | `module: nodenext`, `noEmit`, `erasableSyntaxOnly`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`                                                                                                                                              | tooling-only tsconfigs (`tsconfig.tools.json`)                          |
| `react`                | framework   | —                                | `jsx: react-jsx`                                                                                                                                                                                                                                                 | —                                                                       |
| `react-router`         | framework   | `react`                          | `types: ["node", "vite/client"]`                                                                                                                                                                                                                                 | `@tempest/tsconfig/react-router`                                        |
| `strictest`            | add-on      | —                                | `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `allowUnusedLabels: false`                                                                                                               | Astro's `strictest` (minus `noUnused*`)                                 |
| `node-library`         | combination | base, node22, library            | —                                                                                                                                                                                                                                                                | the npm-package-template trio                                           |
| `node-tooling`         | combination | base, node22, tooling            | —                                                                                                                                                                                                                                                                | none today (R-2792)                                                     |
| `vite-react-app`       | combination | base, dom, app, react            | `types: ["vite/client"]`                                                                                                                                                                                                                                         | octavo studio, Storybook, `@tempest/tsconfig/react-library`             |
| `react-router-workers` | combination | base, workers, app, react-router | lib `es2024` + `dom`, `types: ["./worker-configuration.d.ts", "vite/client"]`                                                                                                                                                                                    | the tempest, climbwell and waterleaf React Router apps                  |
| `workers-app`          | combination | base, workers, app               | —                                                                                                                                                                                                                                                                | framework-less Wrangler projects                                        |
| `astro`                | combination | base, dom, app                   | `jsx: preserve`, `allowJs`, `${configDir}` include (with `.astro/types.d.ts`) and exclude                                                                                                                                                                        | `astro/tsconfigs/base` and `strict`                                     |

Why some of these are where they are:

- `erasableSyntaxOnly` is in `tooling` only, because Node type stripping requires it (D17).
- `app` allows `.ts` import specifiers; `tooling` allows them and rewrites them on emit; `library`
  allows neither and keeps `.js` specifiers, as `nodenext` requires (D18).
- `astro` copies Astro's own base settings rather than extending `astro/tsconfigs/base`, so this
  package never has to resolve `astro`. A CI test diffs it against Astro's file (D13).

## What stays local

The presets hold what is the same across projects. These stay in your own `tsconfig.json`:

- **`paths`.** Aliases such as `~/*` are per project. Write them `./`-relative, with no `baseUrl`
  (see [removing `baseUrl`](#removing-baseurl-for-typescript-6)).
- **`rootDirs`**, such as React Router's `[".", "./.react-router/types"]`.
- **`include` beyond the presets.** Only `library` and `astro` set `include`. For `app`, `tooling` and
  the Workers combinations, list your source directories yourself (or rely on TypeScript's default
  of everything beside the config). React Router's `.react-router/types` and the `.server`/`.client`
  globs belong here too.
- **Framework type roots and extra ambient types**, such as `jsxImportSource`, `vitest/globals`, or
  `node` for Workers. Remember to restate the preset's own `types` entries when you add one.
- **`customConditions`**, `incremental` and `tsBuildInfoFile`: where build info goes is the repo's
  choice.
- **Nx's `composite` and `importHelpers`**: see below.

### Workers with `nodejs_compat`

`workers` names only the generated `worker-configuration.d.ts`. If the Worker enables
`nodejs_compat`, restate `types` with `node` added (and install `@types/node`):

```jsonc
// workers-app
{
  "extends": "@rheged-studio/tsconfig/workers-app",
  "compilerOptions": {
    "types": ["./worker-configuration.d.ts", "node"],
  },
}
```

```jsonc
// react-router-workers
{
  "extends": "@rheged-studio/tsconfig/react-router-workers",
  "compilerOptions": {
    "types": ["./worker-configuration.d.ts", "vite/client", "node"],
  },
}
```

Generate the file with `wrangler types`, and run `wrangler types --check` in CI.

### Nx workspaces

Nx reads parts of `tsconfig.base.json` as raw JSON and does not follow `extends` there: its TS
solution-setup detection checks `compilerOptions.composite` in that file itself, and
`customConditions` and `importHelpers` are read the same way. Nx generators also rewrite a project's
`extends` to point at `<offset>/tsconfig.base.json`. So in an Nx workspace:

- The **root `tsconfig.base.json` extends the presets**, and keeps `composite`, `customConditions`
  and `importHelpers` written out in the file itself.
- **Never add a preset at project level.** Projects keep extending the root base, and write their
  own differences (for example an Astro app's `jsx: preserve` and `allowJs`) inline.

```jsonc
// tsconfig.base.json at the workspace root
{
  "extends": [
    "@rheged-studio/tsconfig/base",
    "@rheged-studio/tsconfig/dom",
    "@rheged-studio/tsconfig/app",
  ],
  "compilerOptions": {
    // Written here, not inherited, because Nx reads this file raw.
    "composite": true,
    "customConditions": ["@my-workspace/source"],
    "importHelpers": true,
  },
}
```

```jsonc
// apps/site/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "preserve", "allowJs": true },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
}
```

Because preset paths use `${configDir}`, they still resolve against each project's own directory
when they are inherited through the root base. Nx's generated `emitDeclarationOnly` base clashes with
`app`'s `noEmit`, so a workspace that builds declarations through project references needs its own
emit settings: see [cases that need a custom config](#cases-that-need-a-custom-config).

## Vitest globals

There is no test preset. A standalone `test.json` cannot work, because `types` arrays replace each
other: whichever comes last wipes out the other's globals (R-278). If you use Vitest's `globals`,
add its types one of two ways.

A one-line local override in the config that covers the tests, restating the preset's `types`:

```jsonc
{
  "extends": "@rheged-studio/tsconfig/node-library",
  "compilerOptions": {
    "types": ["node", "vitest/globals"],
  },
}
```

(For `vite-react-app` that is `["vite/client", "vitest/globals"]`.)

Or a declaration file in the test directory, which works even though `base` sets `types: []`:

```ts
// test/vitest-globals.d.ts
/// <reference types="vitest/globals" />
```

**Recommended: leave `globals: false` (Vitest's default) and import from `vitest` explicitly.** No
estate repo relies on globals today, and explicit imports need no tsconfig change at all.

`library` excludes `*.test.ts` and `*.spec.ts` from the build. To type-check tests, give them their
own config that widens `include` and `rootDir`:

```jsonc
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true, "rootDir": "." },
  "include": ["src", "test"],
  "exclude": [],
}
```

## Migration guide

Every migration follows the same pattern: replace the options a preset already covers with an
`extends`, keep only the [local options](#what-stays-local), then fix the new errors the stricter
`base` reports. Expect some from:

- `noUncheckedIndexedAccess`: `arr[i]` and `record[key]` now include `undefined`.
- `noImplicitOverride`: overriding a base-class member needs `override`.
- `verbatimModuleSyntax`: type-only imports must use `import type`.

Repos still on TypeScript 5.x upgrade to 6 first (R-280).

### The npm-package-template trio

`tsconfig.json`, `tsconfig.eslint.json` and `tsconfig.tools.json` (ES2022, `ESNext`/`bundler`,
`strict`, `noUnused*`, `declaration`, `types: ["node"]`) map to `node-library` and `node-tooling`:

```jsonc
// tsconfig.json
{ "extends": "@rheged-studio/tsconfig/node-library" }
```

```jsonc
// tsconfig.tools.json
{
  "extends": "@rheged-studio/tsconfig/node-tooling",
  "include": ["*.config.ts", "infrastructure/**/*.ts"],
}
```

For `tsconfig.eslint.json`, extend `./tsconfig.json` with `noEmit`, `rootDir: "."` and an `include`
that covers everything ESLint lints, as in the [test config above](#vitest-globals).

What changes:

- **`module: nodenext` instead of `bundler`.** Published, unbundled libraries should resolve the way
  Node does (D3). Relative imports need **`.js` extensions** (`import { x } from "./x.js"`), and
  directory imports need the full `./dir/index.js`.
- **The package must be ESM** (`"type": "module"` in `package.json`). Under `nodenext` with
  `verbatimModuleSyntax`, a package without it is treated as CommonJS and every `export` errors.
- **`isolatedDeclarations` means explicit types on exports.** Exported functions need explicit
  return types, and exported constants need annotations wherever the type isn't obvious from the
  literal (D19).
- **Drop** `esModuleInterop`, `forceConsistentCasingInFileNames` and `useDefineForClassFields`
  (TypeScript 6 defaults), `noUnusedLocals`/`noUnusedParameters` (ESLint reports them),
  `outDir`/`declaration`/`declarationMap` (the preset sets them) and `lib`/`types`
  (`node22` sets them). Keep `incremental` locally if you want it.

### `@tempest/tsconfig`

| `@tempest/tsconfig`   | Use instead                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `base`                | `base` plus a runtime and a role, or simply the combination that fits                           |
| `node`                | `node-tooling` for scripts and config; `node-library` for a package built with `tsc`            |
| `react-library`       | `vite-react-app` (React libraries bundled by Vite, Storybook)                                   |
| `react-router`        | `react-router-workers` on Workers; `["base", "dom", "app", "react-router"]` for a Node host     |
| options copied inline | the matching combination (`packages/data`, `packages/security-headers` and Storybook copy them) |

Notes:

- `@tempest/tsconfig/base` sets `noUnused*` and `apps/website` turns them back off. Both go: ESLint
  owns unused-code checks.
- `react-library`'s ES2020 target and ES2021 lib become `dom`'s `es2022` target and `es2023` lib.
- tempest is on TypeScript 5.9 and is an Nx workspace: upgrade to 6 first, and follow the
  [Nx pattern](#nx-workspaces).

### protomolecule's `@robeasthope/tsconfig`

| `@robeasthope/tsconfig` | Use instead                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `base` (ES2020 + DOM)   | `["base", "dom", "app"]` for browser code; `vite-react-app` for React with Vite |
| `node` (CommonJS)       | nothing: it has no consumers, and CommonJS is out of v1                         |
| `react-library`         | `vite-react-app` (it has no consumers today)                                    |

protomolecule is on TypeScript 5.4 and must upgrade to 6 first. The ES2020 target moves to
`es2022`.

### comms' `tsconfig.base.json`

comms already has the strictest base in the estate (`noUncheckedIndexedAccess`,
`noImplicitOverride`, `strict`, bundler resolution), so most of the file becomes an `extends`:

- Keep `tsconfig.base.json` as the root base and make it extend
  `["@rheged-studio/tsconfig/base", "@rheged-studio/tsconfig/dom", "@rheged-studio/tsconfig/app"]`,
  plus `strictest` if you want it.
- Delete the options those layers now set: `strict`, the two strictness flags, `lib`, `target`,
  `module` and `moduleResolution`.
- Keep `composite` in the file itself, as the [Nx pattern](#nx-workspaces) requires.
- Remove `baseUrl` and `ignoreDeprecations: "6.0"` and rewrite `paths` as `./`-relative entries (see
  below).
- The Astro apps keep extending the root base and add `jsx: preserve`, `allowJs` and the
  `.astro/types.d.ts` include in their own `tsconfig.json`.

### `astro/tsconfigs/strict`

```jsonc
// Before
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "jsxImportSource": "react" },
}
```

```jsonc
// After
{
  "extends": "@rheged-studio/tsconfig/astro",
  "compilerOptions": { "jsxImportSource": "react" },
}
```

`astro` is already stricter than Astro's `strict` (it adds `noUncheckedIndexedAccess`,
`noImplicitOverride` and `noFallthroughCasesInSwitch`). If you were on `astro/tsconfigs/strictest`,
use `["@rheged-studio/tsconfig/astro", "@rheged-studio/tsconfig/strictest"]`. The one difference:
`strictest` leaves `noUnusedLocals`/`noUnusedParameters` to ESLint, so make sure ESLint reports
unused code. `jsxImportSource` stays local.

### Removing `baseUrl` for TypeScript 6

TypeScript 6 deprecates `baseUrl` and TypeScript 7 removes it. `paths` no longer needs it: write
each entry relative to the `tsconfig.json` that declares it, starting with `./`.

```jsonc
// Before
{
  "compilerOptions": {
    "baseUrl": ".",
    "ignoreDeprecations": "6.0",
    "paths": { "~/*": ["app/*"] },
  },
}
```

```jsonc
// After
{
  "compilerOptions": {
    "paths": { "~/*": ["./app/*"] },
  },
}
```

Drop `ignoreDeprecations: "6.0"` at the same time: TypeScript 7 accepts it but it does nothing.

### Setting `types` explicitly

TypeScript 6 defaults `types` to `[]`, so `@types/*` packages are no longer picked up
automatically. `base` sets `types: []`. The runtime layers name their own globals (`node`,
`./worker-configuration.d.ts`), and `react-router`, `vite-react-app` and `react-router-workers` add
`vite/client`. If code relied on another ambient package, list it
locally, and restate the preset's entries alongside it, because arrays replace rather than merge:

```jsonc
{
  "extends": "@rheged-studio/tsconfig/vite-react-app",
  "compilerOptions": {
    "types": ["vite/client", "google.maps"],
  },
}
```

## Cases that need a custom config

These are out of v1 (R-274 D21). Keep their configs local; they can still borrow `base` as the
first entry of an `extends` array where it fits.

- **Next.js.** Next rewrites required fields in `tsconfig.json` and expects its own plugin, `jsx`
  setting and `.next/types` includes.
- **Sanity Studio.** Sanity uses `module: preserve` and turns `noUncheckedSideEffectImports` off,
  which `base` turns on, so a Sanity config that borrows `base` sets
  `noUncheckedSideEffectImports: false` locally.
- **Remix (legacy).** Migrate to React Router first.
- **CommonJS packages**, such as protomolecule's legacy libraries. Every role assumes ESM.
- **Nx composite builds.** A workspace that builds declarations through project references
  (`composite`, `emitDeclarationOnly`) needs emit settings that clash with `app`'s `noEmit`. Keep
  those settings in the root base, per the [Nx pattern](#nx-workspaces).

## Versioning

- **0.x until 1.0.** The presets may still change as the first repos adopt them; 1.0.0 comes once
  they have proved themselves (R-2793). Read the changelog before upgrading.
- **From 1.0, a new error-producing flag is a major release.** Anything that can make a previously
  clean project fail to type-check is breaking, including moving a combination's runtime from
  `node22` to `node24` (D12).
- **Options that only relax checks are minor releases**, as are new presets and layers.
- Fixes that change no checking behaviour are patches.

## Development

Working on this repo needs Node 22 and pnpm (pinned via `packageManager`).

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
