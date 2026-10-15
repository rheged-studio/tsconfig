/**
 * Preset smoke tests (R-276, fixture matrix per R-274 D22).
 *
 * The suite packs the package once and installs the tarball into a
 * gitignored `.fixtures/` directory inside the repo, so every fixture resolves
 * `@rheged-studio/tsconfig/<preset>` through the published `exports` and
 * `files`, while `types` entries (`node`, `vite/client`) still resolve from
 * the repo's own devDependencies. Every compiler test runs under TS 6 and
 * TS 7.
 *
 * Fixtures run without `--noEmit`: every role except `library` sets `noEmit`
 * itself, and `library` must really emit, because `isolatedDeclarations`
 * errors only appear during declaration emit. Each compiler gets its own copy
 * of the fixtures under `.fixtures/<compiler>/`, so the two never write the
 * same `dist/` while the tests run concurrently.
 *
 * - `fixtures/<name>/` without `expected-errors.json` must type-check cleanly.
 * - `fixtures/<name>/` with `expected-errors.json` must fail with exactly those
 *   error codes, one entry per error (a code repeats when it fires twice),
 *   proving the layer really rejects what it should. The file holds one list,
 *   or `{ "TS 6": [...], "TS 7": [...] }` where the compilers disagree on a
 *   code.
 * - Every preset resolves under both spellings (`pkg/x` and `pkg/x.json`) and
 *   prints the same `--showConfig`.
 * - Every preset's resolved `compilerOptions` match between TS 6 and TS 7 and
 *   match the committed snapshot, so any change to what a preset resolves to
 *   shows up in review.
 * - `library` emits JavaScript, declarations and declaration maps, and no
 *   test files.
 */
import { execFile, execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const presetsDirectory = join(repoRoot, "presets");
const fixturesDirectory = join(repoRoot, "fixtures");
const workDirectory = join(repoRoot, ".fixtures");
const packageName = "@rheged-studio/tsconfig";

const compilers = [
  ["TS 6", join(repoRoot, "node_modules/typescript/bin/tsc"), "ts6"],
  ["TS 7", join(repoRoot, "node_modules/typescript7/bin/tsc"), "ts7"],
] as const;

/**
 * Options TypeScript 6 already defaults, which presets must not restate (D10).
 */
const ts6Defaults = [
  "allowSyntheticDefaultImports",
  "esModuleInterop",
  "forceConsistentCasingInFileNames",
  "libReplacement",
  "useDefineForClassFields",
];

/**
 * Lib entries TypeScript 6 folds into another lib, leaving an empty stub.
 */
const ts6StubLibs = ["dom.iterable", "dom.asynciterable"];

const presetNames = readdirSync(presetsDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.slice(0, -".json".length))
  .toSorted();

const fixtureNames = readdirSync(fixturesDirectory).toSorted();
function isNegative(name: string): boolean {
  return existsSync(join(fixturesDirectory, name, "expected-errors.json"));
}

const positiveFixtures = fixtureNames.filter((name) => !isNegative(name));
const negativeFixtures = fixtureNames.filter((name) => isNegative(name));

type TscResult = {
  output: string;
  status: null | number;
};

const execFileAsync = promisify(execFile);

/**
 * Runs tsc without blocking, so `it.concurrent` tests really overlap.
 */
async function runTsc(
  tsc: string,
  cwd: string,
  args: string[],
): Promise<TscResult> {
  try {
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      [tsc, ...args],
      { cwd, encoding: "utf8" },
    );
    return { output: stdout + stderr, status: 0 };
  } catch (error) {
    const { code, stderr, stdout } = error as {
      code?: unknown;
      stderr?: string;
      stdout?: string;
    };
    if (typeof code !== "number") {
      throw error;
    }

    return { output: (stdout ?? "") + (stderr ?? ""), status: code };
  }
}

/**
 * Every reported error code, sorted, with repeats kept: a fixture expecting
 * two TS2550 errors fails if only one still fires.
 */
function errorCodes(output: string): string[] {
  return [...output.matchAll(/error (TS\d+)/g)]
    .flatMap((match) => match[1] ?? [])
    .toSorted();
}

/**
 * The `compilerOptions` that `tsc --showConfig` printed, with sorted keys:
 * TS 6 and TS 7 print the same options in a different order.
 */
function resolvedOptions(showConfig: string): Record<string, unknown> {
  const options = compilerOptionsOf(
    JSON.parse(showConfig) as Record<string, unknown>,
  );
  return Object.fromEntries(
    Object.entries(options).toSorted(([a], [b]) => a.localeCompare(b)),
  );
}

function readJsonc(path: string): Record<string, unknown> {
  const { config, error } = ts.parseConfigFileTextToJson(
    path,
    readFileSync(path, "utf8"),
  );
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  }

  return config as Record<string, unknown>;
}

function compilerOptionsOf(
  config: Record<string, unknown>,
): Record<string, unknown> {
  return (config["compilerOptions"] ?? {}) as Record<string, unknown>;
}

/**
 * Packs the package and installs the tarball under `.fixtures/node_modules`.
 */
function installPackedTarball(): string[] {
  rmSync(workDirectory, { force: true, recursive: true });
  mkdirSync(workDirectory, { recursive: true });
  execFileSync("pnpm", ["pack", "--pack-destination", workDirectory], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  const tarball = readdirSync(workDirectory).find((file) =>
    file.endsWith(".tgz"),
  );
  if (!tarball) {
    throw new Error("pnpm pack produced no tarball");
  }

  const installDirectory = join(workDirectory, "node_modules", packageName);
  mkdirSync(installDirectory, { recursive: true });
  execFileSync("tar", [
    "-xzf",
    join(workDirectory, tarball),
    "-C",
    installDirectory,
    "--strip-components=1",
  ]);
  return execFileSync("tar", ["-tzf", join(workDirectory, tarball)], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .map((entry) => entry.replace(/^package\//, ""))
    .toSorted();
}

let packedFiles: string[] = [];

beforeAll(() => {
  packedFiles = installPackedTarball();
  for (const [, , directory] of compilers) {
    for (const name of fixtureNames) {
      cpSync(
        join(fixturesDirectory, name),
        join(workDirectory, directory, name),
        { recursive: true },
      );
    }

    cpSync(
      join(fixturesDirectory, "node-library"),
      join(workDirectory, directory, "library-emit"),
      { recursive: true },
    );
  }

  // One project per preset and spelling for the --showConfig checks. Each
  // holds the files every preset's `include`/`types` might need.
  for (const name of presetNames) {
    for (const [suffix, specifier] of [
      ["bare", `${packageName}/${name}`],
      ["json", `${packageName}/${name}.json`],
    ] as const) {
      const directory = join(workDirectory, "show-config", name, suffix);
      mkdirSync(join(directory, "src"), { recursive: true });
      writeFileSync(join(directory, "src/index.ts"), "export {};\n");
      writeFileSync(
        join(directory, "worker-configuration.d.ts"),
        "interface Env {}\n",
      );
      writeFileSync(
        join(directory, "tsconfig.json"),
        JSON.stringify({ extends: specifier }),
      );
    }
  }
}, 60_000);

describe("published package", () => {
  it("ships exactly the presets, README, LICENSE and package.json", () => {
    expect(packedFiles).toEqual(
      [
        "LICENSE",
        "README.md",
        "package.json",
        ...presetNames.map((name) => `presets/${name}.json`),
      ].toSorted(),
    );
  });
});

describe("preset source", () => {
  it.each(presetNames)("%s declares $schema and explains itself", (name) => {
    const path = join(presetsDirectory, `${name}.json`);
    expect(readJsonc(path)["$schema"]).toBe(
      "https://json.schemastore.org/tsconfig",
    );
    expect(readFileSync(path, "utf8")).toMatch(/^\s*\/\//m);
  });

  it.each(presetNames)("%s restates no TypeScript 6 default", (name) => {
    const options = compilerOptionsOf(
      readJsonc(join(presetsDirectory, `${name}.json`)),
    );
    expect(
      Object.keys(options).filter((key) => ts6Defaults.includes(key)),
    ).toEqual([]);
    const library = (options["lib"] ?? []) as string[];
    expect(
      library.filter((entry) => ts6StubLibs.includes(entry.toLowerCase())),
    ).toEqual([]);
  });

  it("astro matches astro/tsconfigs/base apart from deliberate differences", () => {
    // Astro's file sets these; our layers own them instead (D13, D15, D10).
    const deliberate: Record<string, string> = {
      esModuleInterop: "TypeScript 6 default",
      forceConsistentCasingInFileNames: "TypeScript 6 default",
      target: "owned by the dom runtime layer",
    };
    const astroPath = join(repoRoot, "node_modules/astro/tsconfigs/base.json");
    const astroRaw = readJsonc(astroPath);
    const astroOptions = ts.convertCompilerOptionsFromJson(
      compilerOptionsOf(astroRaw),
      repoRoot,
    ).options;
    const oursPath = join(presetsDirectory, "astro.json");
    const ours = ts.parseJsonConfigFileContent(
      readJsonc(oursPath),
      ts.sys,
      presetsDirectory,
      undefined,
      oursPath,
    );
    for (const [key, value] of Object.entries(astroOptions)) {
      if (key in deliberate || key === "configFilePath") {
        continue;
      }

      expect({ [key]: ours.options[key] }).toEqual({ [key]: value });
    }

    const oursRaw = readJsonc(oursPath);
    expect(oursRaw["include"]).toEqual(astroRaw["include"]);
    expect(oursRaw["exclude"]).toEqual(astroRaw["exclude"]);
  });
});

// Concurrent tests assert through their own context `expect` (named `check`
// here), so a failure is reported against the right test.
describe.each(compilers)("%s", (label, tsc, directory) => {
  it.concurrent.for(positiveFixtures)(
    "fixture %s type-checks",
    async (name, { expect: check }) => {
      const { output, status } = await runTsc(
        tsc,
        join(workDirectory, directory, name),
        ["-p", "."],
      );
      check(output).toBe("");
      check(status).toBe(0);
    },
  );

  it.concurrent.for(negativeFixtures)(
    "fixture %s fails with exactly its expected errors",
    async (name, { expect: check }) => {
      // Either one list for both compilers, or one list per compiler where
      // TS 6 and TS 7 report the same problem under different codes.
      const spec = JSON.parse(
        readFileSync(
          join(fixturesDirectory, name, "expected-errors.json"),
          "utf8",
        ),
      ) as Record<string, string[]> | string[];
      const expected = Array.isArray(spec) ? spec : (spec[label] ?? []);
      const { output, status } = await runTsc(
        tsc,
        join(workDirectory, directory, name),
        ["-p", ".", "--pretty", "false"],
      );
      check(errorCodes(output)).toEqual(expected.toSorted());
      check(status).not.toBe(0);
    },
  );

  it.concurrent(
    "library emits JavaScript, declarations and maps, but no tests",
    async ({ expect: check }) => {
      const project = join(workDirectory, directory, "library-emit");
      const { output, status } = await runTsc(tsc, project, ["-p", "."]);
      check(output).toBe("");
      check(status).toBe(0);
      check(
        readdirSync(join(project, "dist"), { recursive: true })
          .map(String)
          .toSorted(),
      ).toEqual([
        "greet.d.ts",
        "greet.d.ts.map",
        "greet.js",
        "index.d.ts",
        "index.d.ts.map",
        "index.js",
      ]);
    },
  );

  it.concurrent.for(presetNames)(
    "%s resolves under both spellings with the same config",
    async (name, { expect: check }) => {
      const [bare, json] = await Promise.all(
        ["bare", "json"].map((suffix) =>
          runTsc(tsc, join(workDirectory, "show-config", name, suffix), [
            "-p",
            ".",
            "--showConfig",
          ]),
        ),
      );
      check(bare?.status).toBe(0);
      check(json?.status).toBe(0);
      check(bare?.output.replaceAll("/bare/", "/x/")).toBe(
        json?.output.replaceAll("/json/", "/x/"),
      );
    },
  );
});

describe("resolved options", () => {
  it.concurrent.for(presetNames)(
    "%s resolves to the same options under TS 6 and TS 7, as snapshotted",
    async (name, { expect: check }) => {
      const [ts6, ts7] = await Promise.all(
        compilers.map(async ([, tsc]) => {
          const { output, status } = await runTsc(
            tsc,
            join(workDirectory, "show-config", name, "bare"),
            ["-p", ".", "--showConfig"],
          );
          check(status).toBe(0);
          return resolvedOptions(output);
        }),
      );
      check(ts7).toEqual(ts6);
      check(ts6).toMatchSnapshot();
    },
  );
});
