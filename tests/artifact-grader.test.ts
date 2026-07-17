import assert from "node:assert/strict";
import { spawn as spawnChild } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";

import type { SandboxProcess, SandboxSession } from "eve/sandbox";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { ArtifactGradeInputSchema, CODEX_NODE_TOOL_TEST_SOURCE, gradeArtifact } from "../lib/grading/artifact-grader.ts";

const encoder = new TextEncoder();
const PROFILE_ROOT = "artifacts/codex-node-tool-v1";
const MARKER_PATH = `${PROFILE_ROOT}/README.md`;
const TEST_PATH = `${PROFILE_ROOT}/tests/index.test.mjs`;
const BUILD_COMMAND = "node --check src/index.mjs";
const TEST_COMMAND = "node --test tests/index.test.mjs";

type ProcessPlan = {
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exitCode?: number;
  readonly hangUntilKilled?: boolean;
};

function streamText(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      if (value.length > 0) controller.enqueue(encoder.encode(value));
      controller.close();
    },
  });
}

function createProcess(plan: ProcessPlan): SandboxProcess & { readonly killed: () => boolean } {
  let killed = false;
  let resolveWait: ((result: { exitCode: number }) => void) | null = null;
  const wait = plan.hangUntilKilled
    ? new Promise<{ exitCode: number }>((resolve) => {
        resolveWait = resolve;
      })
    : Promise.resolve({ exitCode: plan.exitCode ?? 0 });

  return {
    stdout: streamText(plan.stdout ?? ""),
    stderr: streamText(plan.stderr ?? ""),
    wait: () => wait,
    async kill() {
      if (killed) return;
      killed = true;
      resolveWait?.({ exitCode: 137 });
    },
    killed: () => killed,
  };
}

function createSandbox(options?: {
  readonly marker?: string | null;
  readonly testSource?: string | null;
  readonly build?: ProcessPlan;
  readonly test?: ProcessPlan;
}) {
  const commands: Array<{
    command: string;
    workingDirectory?: string;
    process: ReturnType<typeof createProcess>;
  }> = [];
  const marker: string | null =
    options?.marker === undefined
      ? "# Tiny tool\n\ndean-artifact-profile: codex-node-tool-v1\n"
      : options.marker;
  const testSource =
    options?.testSource === undefined
      ? CODEX_NODE_TOOL_TEST_SOURCE
      : options.testSource;

  const sandbox = {
    async readFile({ path }: { path: string }) {
      if (path === MARKER_PATH && marker !== null) return streamText(marker);
      if (path === TEST_PATH && testSource !== null) return streamText(testSource);
      return null;
    },
    async spawn({
      command,
      workingDirectory,
    }: {
      command: string;
      workingDirectory?: string;
      abortSignal?: AbortSignal;
    }) {
      const plan = command === BUILD_COMMAND ? options?.build : options?.test;
      const process = createProcess(plan ?? {});
      commands.push({ command, workingDirectory, process });
      return process;
    },
  } as Pick<SandboxSession, "readFile" | "spawn"> as SandboxSession;

  return { sandbox, commands };
}

test("the fixed Codex artifact profile passes all four bounded checks", async () => {
  const { sandbox, commands } = createSandbox();

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, true);
  assert.equal(result.error, null);
  assert.deepEqual(
    commands.map(({ command, workingDirectory }) => ({ command, workingDirectory })),
    [
      { command: BUILD_COMMAND, workingDirectory: PROFILE_ROOT },
      { command: TEST_COMMAND, workingDirectory: PROFILE_ROOT },
    ],
  );
});

test("a weakened behavioral test file fails closed without executing it", async () => {
  const weakenedSource = [
    'import test from "node:test";',
    'test("always passes", () => {});',
    "",
  ].join("\n");
  const { sandbox, commands } = createSandbox({ testSource: weakenedSource });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "CRITERIA_MISMATCH");
  assert.equal(commands.length, 0);
  assert.doesNotMatch(result.actualOutput, /always passes/);
  assert.doesNotMatch(result.actualOutput, /import test/);
});

test("a missing marker file fails closed without exposing file contents", async () => {
  const { sandbox } = createSandbox({ marker: null });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "MISSING_FILE");
  assert.match(result.actualOutput, /\"exists\":false/);
});

test("a marker mismatch produces a deterministic failing profile", async () => {
  const { sandbox } = createSandbox({ marker: "# Unapproved project\n" });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "CRITERIA_MISMATCH");
  assert.doesNotMatch(result.actualOutput, /Unapproved project/);
});

test("the marker file stream is capped before its content is materialized", async () => {
  const { sandbox, commands } = createSandbox({ marker: "x".repeat(33 * 1024) });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "OUTPUT_LIMIT");
  assert.equal(commands.length, 0);
  assert.ok(result.actualOutput.length < 2_000);
});

test("a nonzero fixed command exit fails the artifact", async () => {
  const { sandbox } = createSandbox({ build: { exitCode: 1, stderr: "syntax error" } });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "NONZERO_EXIT");
  assert.doesNotMatch(result.actualOutput, /syntax error/);
});

test("combined command output is capped and the process is killed", async () => {
  const { sandbox, commands } = createSandbox({
    build: { stdout: "x".repeat(17 * 1024), hangUntilKilled: true },
  });

  const result = await gradeArtifact({ profileId: "codex-node-tool-v1" }, sandbox);

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "OUTPUT_LIMIT");
  assert.equal(commands[0]?.process.killed(), true);
  assert.ok(result.actualOutput.length < 2_000);
});

test("an aborted command is classified as a retryable timeout and killed", async () => {
  const { sandbox, commands } = createSandbox({ build: { hangUntilKilled: true } });
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5);

  const result = await gradeArtifact(
    { profileId: "codex-node-tool-v1" },
    sandbox,
    controller.signal,
  );

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "TIMEOUT");
  assert.equal(result.error?.retryable, true);
  assert.equal(commands[0]?.process.killed(), true);
});

test("the public input accepts only the server-owned profile id", () => {
  assert.equal(
    ArtifactGradeInputSchema.safeParse({ profileId: "codex-node-tool-v1" }).success,
    true,
  );

  for (const input of [
    { profileId: "codex-node-tool-v1", passed: true },
    { profileId: "codex-node-tool-v1", path: "/workspace/other" },
    { profileId: "codex-node-tool-v1", command: "bash anything.sh" },
    { profileId: "other-profile" },
    {},
  ]) {
    assert.equal(ArtifactGradeInputSchema.safeParse(input).success, false);
  }
});

test("the fixed profile passes and fails against a real bounded Node artifact", async () => {
  const root = await mkdtemp(join(tmpdir(), "dean-artifact-grade-"));
  const artifactRoot = join(root, PROFILE_ROOT);
  const failingRoot = await mkdtemp(join(tmpdir(), "dean-artifact-grade-failing-"));
  const failingArtifactRoot = join(failingRoot, PROFILE_ROOT);

  try {
    await mkdir(join(artifactRoot, "src"), { recursive: true });
    await mkdir(join(artifactRoot, "tests"), { recursive: true });
    await writeFile(
      join(artifactRoot, "README.md"),
      "dean-artifact-profile: codex-node-tool-v1\n",
    );
    await writeFile(
      join(artifactRoot, "src/index.mjs"),
      [
        "export function formatStatus(items) {",
        '  const completed = items.filter(({ status }) => status === "done").length;',
        "  const blocked = items",
        '    .filter(({ status }) => status === "blocked")',
        "    .map(({ task }) => task);",
        '  return `Completed: ${completed}/${items.length}\\nBlocked: ${blocked.length > 0 ? blocked.join(", ") : "none"}`;',
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(artifactRoot, "tests/index.test.mjs"),
      CODEX_NODE_TOOL_TEST_SOURCE,
    );

    const sandbox = createLocalFixtureSandbox(root);
    const passing = await gradeArtifact(
      { profileId: "codex-node-tool-v1" },
      sandbox,
    );

    assert.equal(passing.passed, true);
    assert.equal(passing.error, null);

    await mkdir(join(failingArtifactRoot, "src"), { recursive: true });
    await mkdir(join(failingArtifactRoot, "tests"), { recursive: true });
    await writeFile(
      join(failingArtifactRoot, "README.md"),
      "dean-artifact-profile: codex-node-tool-v1\n",
    );
    await writeFile(
      join(failingArtifactRoot, "src/index.mjs"),
      [
        "export function formatStatus(items) {",
        '  return `Completed: 0/${items.length}\\nBlocked: none`;',
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(failingArtifactRoot, "tests/index.test.mjs"),
      CODEX_NODE_TOOL_TEST_SOURCE,
    );
    const failing = await gradeArtifact(
      { profileId: "codex-node-tool-v1" },
      createLocalFixtureSandbox(failingRoot),
    );

    assert.equal(failing.passed, false, failing.actualOutput);
    assert.equal(failing.error?.code, "NONZERO_EXIT");
  } finally {
    await Promise.all([
      rm(root, { recursive: true, force: true }),
      rm(failingRoot, { recursive: true, force: true }),
    ]);
  }
});

function createLocalFixtureSandbox(root: string): SandboxSession {
  return {
    async readFile({ path }) {
      try {
        const bytes = await readFile(join(root, path));
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        });
      } catch (error) {
        if (isMissingFileError(error)) return null;
        throw error;
      }
    },
    async spawn({ command, workingDirectory, abortSignal }) {
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT;
      const args =
        command === BUILD_COMMAND
          ? ["--check", "src/index.mjs"]
          : command === TEST_COMMAND
            ? ["--test", "tests/index.test.mjs"]
            : null;

      if (args === null) throw new Error("Unsupported fixture command");

      const child = spawnChild(process.execPath, args, {
        cwd: join(root, workingDirectory ?? ""),
        env,
        signal: abortSignal,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const wait = new Promise<{ exitCode: number }>((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code) => resolve({ exitCode: code ?? 1 }));
      });

      return {
        stdout: Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
        stderr: Readable.toWeb(child.stderr) as ReadableStream<Uint8Array>,
        wait: () => wait,
        async kill() {
          child.kill("SIGKILL");
        },
      };
    },
  } as Pick<SandboxSession, "readFile" | "spawn"> as SandboxSession;
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: string }).code === "ENOENT"
  );
}
