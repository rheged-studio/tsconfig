import { base, typescript } from "@rheged-studio/eslint-config";
import { defineConfig } from "eslint/config";

/**
 * Self-lint config for @rheged-studio/tsconfig, dogfooding the published
 * @rheged-studio/eslint-config preset: the `base` stack plus the
 * TypeScript-file overrides.
 *
 * Authored in TypeScript (loaded by jiti) and wrapped in `defineConfig` so the
 * whole config array — including the local override blocks below — is
 * type-checked against the preset's shipped types, rather than only failing
 * when ESLint runs. Opt-in presets (`testing`, `frameworkRouting`, `astro`,
 * `sanity`, `storybook`, `tableComponents`) are re-exported from
 * `@rheged-studio/eslint-config` if this repo ever needs them.
 */
export default defineConfig([
  // The vendored agent-skill bundles are mirrored into `.claude/skills/` (already
  // ignored by the preset) and `.agents/skills/` (for Cursor). Neither mirror is
  // part of this repo's lint surface — the bundles are external, zero-dep `.mjs`
  // that own their linting upstream, and CI's directory-scoped lint never touches
  // them. Ignore `.agents/**` too, so the two mirrors are treated symmetrically and
  // a newly-added bundle's Node globals don't trip the change-gated preflight.
  //
  // The preset fixtures are tiny projects type-checked against the presets, and
  // the negative ones contain deliberate errors; `eslint --fix` (lint-staged)
  // must never rewrite them. `.fixtures/` is the tests' scratch install.
  { ignores: [".agents/**", "fixtures/**", ".fixtures/**"] },
  ...base,
  typescript,
  // infrastructure/ holds the workflow/release shell's CLI tooling (not
  // published code): it legitimately imports devDependencies, so
  // import/no-extraneous-dependencies allows them. Complexity is off for the
  // branchy ensure-*/publish reference scripts. Scoped narrowly to this
  // directory.
  {
    files: ["infrastructure/**/*.{ts,mjs}"],
    rules: {
      complexity: "off",
      "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  // The base preset enables type-aware linting (parserOptions.project: true),
  // which resolves each file to the nearest tsconfig.json. This package is
  // config-only (no src/ or dist/ build, R-275), so pin the explicit lint
  // project that spans the infrastructure/ tooling.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
