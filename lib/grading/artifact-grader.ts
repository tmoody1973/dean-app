import type { SandboxProcess, SandboxSession } from "eve/sandbox";
import { z } from "zod";

import {
  finalizeGrade,
  type GradeError,
  type GradeResult,
} from "#grading/result";

export const ArtifactGradeInputSchema = z
  .object({
    profileId: z.literal("codex-node-tool-v1"),
  })
  .strict();

export type ArtifactGradeInput = z.infer<typeof ArtifactGradeInputSchema>;

const safeRelativePathSchema = z
  .string()
  .min(1)
  .max(180)
  .refine(
    (path) =>
      !path.startsWith("/") &&
      !path.includes("\\") &&
      !path.includes("\0") &&
      path.split("/").every((segment) => segment !== ".." && segment !== "."),
    "Artifact paths must stay inside the fixed workspace directory.",
  );

const fileCriterionSchema = z
  .object({
    type: z.literal("file-marker"),
    id: z.string().min(1),
    path: safeRelativePathSchema,
    marker: z.string().min(1).max(120),
    maxBytes: z.number().int().positive().max(64 * 1024),
  })
  .strict();

const commandCriterionSchema = z
  .object({
    type: z.literal("command"),
    id: z.string().min(1),
    operation: z.enum(["build", "test"]),
    command: z.enum([
      "node --check src/index.mjs",
      "node --test tests/index.test.mjs",
    ]),
    workingDirectory: safeRelativePathSchema,
    timeoutMs: z.number().int().positive().max(10_000),
    maxOutputBytes: z.number().int().positive().max(64 * 1024),
    expectedExitCode: z.literal(0),
  })
  .strict();

const artifactProfileSchema = z
  .object({
    id: z.literal("codex-node-tool-v1"),
    criteria: z
      .tuple([
        fileCriterionSchema,
        commandCriterionSchema,
        commandCriterionSchema,
      ])
      .readonly(),
  })
  .strict();

type ArtifactProfile = z.infer<typeof artifactProfileSchema>;
type ArtifactCriterion = ArtifactProfile["criteria"][number];

const CODEX_NODE_TOOL_PROFILE: ArtifactProfile = artifactProfileSchema.parse({
  id: "codex-node-tool-v1",
  criteria: [
    {
      type: "file-marker",
      id: "artifact-marker",
      path: "artifacts/codex-node-tool-v1/README.md",
      marker: "dean-artifact-profile: codex-node-tool-v1",
      maxBytes: 32 * 1024,
    },
    {
      type: "command",
      id: "syntax-build",
      operation: "build",
      command: "node --check src/index.mjs",
      workingDirectory: "artifacts/codex-node-tool-v1",
      timeoutMs: 5_000,
      maxOutputBytes: 16 * 1024,
      expectedExitCode: 0,
    },
    {
      type: "command",
      id: "node-test",
      operation: "test",
      command: "node --test tests/index.test.mjs",
      workingDirectory: "artifacts/codex-node-tool-v1",
      timeoutMs: 5_000,
      maxOutputBytes: 16 * 1024,
      expectedExitCode: 0,
    },
  ],
});

type CriterionEvidence = Readonly<Record<string, boolean | number | string | null>>;

type CriterionResult = {
  readonly id: string;
  readonly type: ArtifactCriterion["type"];
  readonly satisfied: boolean;
  readonly evidence: CriterionEvidence;
  readonly error: GradeError | null;
};

type ReadResult =
  | { readonly status: "missing" }
  | { readonly status: "limit"; readonly capturedBytes: number }
  | { readonly status: "ok"; readonly bytes: Uint8Array };

type StopReason = "output-limit" | "timeout";

type CommandObservation = {
  readonly exitCode: number | null;
  readonly capturedBytes: number;
  readonly stopReason: StopReason | null;
};

export async function gradeArtifact(
  input: unknown,
  sandbox: SandboxSession,
  abortSignal?: AbortSignal,
): Promise<GradeResult> {
  const parsed = ArtifactGradeInputSchema.safeParse(input);

  if (!parsed.success) {
    return finalizeGrade({
      grader: "artifact",
      satisfied: false,
      actualOutput: "The artifact check request did not match an approved profile.",
      expectedOutput: "A server-owned artifact profile identifier.",
      error: {
        code: "INVALID_REQUEST",
        message: "Choose an approved artifact verification profile.",
        retryable: true,
      },
    });
  }

  const profile = CODEX_NODE_TOOL_PROFILE;
  const results: CriterionResult[] = [];

  try {
    for (const criterion of profile.criteria) {
      const result =
        criterion.type === "file-marker"
          ? await evaluateFileCriterion(sandbox, criterion, abortSignal)
          : await evaluateCommandCriterion(sandbox, criterion, abortSignal);

      results.push(result);

      if (result.error?.code === "TIMEOUT" || result.error?.code === "OUTPUT_LIMIT") {
        break;
      }
    }
  } catch (error) {
    const runtimeUnavailable = isUnsupportedRuntimeError(error);
    results.push({
      id: "artifact-runtime",
      type: "command",
      satisfied: false,
      evidence: { observed: "runtime-error" },
      error: {
        code: runtimeUnavailable ? "UNSUPPORTED_RUNTIME" : "INTERNAL_ERROR",
        message: runtimeUnavailable
          ? "The approved artifact runtime is unavailable in this sandbox."
          : "The artifact could not be checked safely. Please retry.",
        retryable: true,
      },
    });
  }

  const error = results.find((result) => result.error !== null)?.error ?? null;
  const satisfied =
    results.length === profile.criteria.length &&
    results.every((result) => result.satisfied);

  return finalizeGrade({
    grader: "artifact",
    satisfied,
    actualOutput: JSON.stringify({
      profileId: profile.id,
      checks: results.map(({ error: checkError, evidence, id, satisfied: met, type }) => ({
        id,
        type,
        satisfied: met,
        evidence,
        errorCode: checkError?.code ?? null,
      })),
    }),
    expectedOutput: JSON.stringify({
      profileId: profile.id,
      criteria: [
        "README contains the fixed Dean artifact marker",
        "src/index.mjs passes the fixed Node syntax check",
        "tests/index.test.mjs passes the fixed Node test command",
      ],
    }),
    error,
  });
}

async function evaluateFileCriterion(
  sandbox: SandboxSession,
  criterion: Extract<ArtifactCriterion, { type: "file-marker" }>,
  abortSignal?: AbortSignal,
): Promise<CriterionResult> {
  const read = await readFileWithinLimit(
    sandbox,
    criterion.path,
    criterion.maxBytes,
    abortSignal,
  );

  if (read.status === "missing") {
    return {
      id: criterion.id,
      type: criterion.type,
      satisfied: false,
      evidence: { path: criterion.path, exists: false },
      error: {
        code: "MISSING_FILE",
        message: "The required artifact marker file is missing.",
        retryable: true,
      },
    };
  }

  if (read.status === "limit") {
    return {
      id: criterion.id,
      type: criterion.type,
      satisfied: false,
      evidence: {
        path: criterion.path,
        exists: true,
        capturedBytes: read.capturedBytes,
        limitBytes: criterion.maxBytes,
      },
      error: {
        code: "OUTPUT_LIMIT",
        message: "The artifact marker file exceeded the verification limit.",
        retryable: true,
      },
    };
  }

  let content: string;

  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(read.bytes);
  } catch {
    return {
      id: criterion.id,
      type: criterion.type,
      satisfied: false,
      evidence: { path: criterion.path, exists: true, validUtf8: false },
      error: {
        code: "CRITERIA_MISMATCH",
        message: "The artifact marker file must be valid UTF-8 text.",
        retryable: true,
      },
    };
  }

  const markerFound = content.includes(criterion.marker);

  return {
    id: criterion.id,
    type: criterion.type,
    satisfied: markerFound,
    evidence: {
      path: criterion.path,
      exists: true,
      bytes: read.bytes.byteLength,
      markerFound,
    },
    error: markerFound
      ? null
      : {
          code: "CRITERIA_MISMATCH",
          message: "The artifact marker file does not identify the approved project.",
          retryable: true,
        },
  };
}

async function readFileWithinLimit(
  sandbox: SandboxSession,
  path: string,
  maxBytes: number,
  abortSignal?: AbortSignal,
): Promise<ReadResult> {
  const stream = await sandbox.readFile({ path, abortSignal });

  if (stream === null) return { status: "missing" };

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let capturedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (capturedBytes + value.byteLength > maxBytes) {
        capturedBytes = maxBytes;
        await reader.cancel("artifact file limit reached").catch(() => undefined);
        return { status: "limit", capturedBytes };
      }

      chunks.push(value);
      capturedBytes += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(capturedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { status: "ok", bytes };
}

async function evaluateCommandCriterion(
  sandbox: SandboxSession,
  criterion: Extract<ArtifactCriterion, { type: "command" }>,
  abortSignal?: AbortSignal,
): Promise<CriterionResult> {
  const observation = await runBoundedCommand(sandbox, criterion, abortSignal);
  const evidence: CriterionEvidence = {
    operation: criterion.operation,
    exitCode: observation.exitCode,
    capturedBytes: observation.capturedBytes,
    outputLimited: observation.stopReason === "output-limit",
    timedOut: observation.stopReason === "timeout",
  };

  if (observation.stopReason === "output-limit") {
    return {
      id: criterion.id,
      type: criterion.type,
      satisfied: false,
      evidence,
      error: {
        code: "OUTPUT_LIMIT",
        message: `The artifact ${criterion.operation} exceeded the output limit.`,
        retryable: true,
      },
    };
  }

  if (observation.stopReason === "timeout") {
    return {
      id: criterion.id,
      type: criterion.type,
      satisfied: false,
      evidence,
      error: {
        code: "TIMEOUT",
        message: `The artifact ${criterion.operation} exceeded the time limit.`,
        retryable: true,
      },
    };
  }

  const satisfied = observation.exitCode === criterion.expectedExitCode;

  return {
    id: criterion.id,
    type: criterion.type,
    satisfied,
    evidence,
    error: satisfied
      ? null
      : {
          code: "NONZERO_EXIT",
          message: `The artifact ${criterion.operation} command did not pass.`,
          retryable: true,
        },
  };
}

async function runBoundedCommand(
  sandbox: SandboxSession,
  criterion: Extract<ArtifactCriterion, { type: "command" }>,
  externalAbort?: AbortSignal,
): Promise<CommandObservation> {
  const controller = new AbortController();
  let process: SandboxProcess | null = null;
  let stopReason: StopReason | null = null;
  let killPromise: Promise<void> | null = null;

  const killOnce = (): Promise<void> => {
    if (process === null) return Promise.resolve();
    if (killPromise === null) {
      killPromise = Promise.resolve(process.kill()).catch(() => undefined);
    }
    return killPromise;
  };

  const stop = (reason: StopReason): void => {
    if (stopReason !== null) return;
    stopReason = reason;
    controller.abort(reason);
    void killOnce();
  };

  const onExternalAbort = (): void => stop("timeout");
  externalAbort?.addEventListener("abort", onExternalAbort, { once: true });
  if (externalAbort?.aborted) onExternalAbort();

  const timer = setTimeout(() => stop("timeout"), criterion.timeoutMs);

  try {
    try {
      process = await sandbox.spawn({
        command: criterion.command,
        workingDirectory: criterion.workingDirectory,
        abortSignal: controller.signal,
      });
    } catch (error) {
      if (stopReason !== null) {
        return { exitCode: null, capturedBytes: 0, stopReason };
      }
      throw error;
    }

    if (controller.signal.aborted) await killOnce();

    let capturedBytes = 0;

    const consume = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
      const reader = stream.getReader();
      try {
        while (stopReason === null) {
          const { done, value } = await reader.read();
          if (done) break;

          const remaining = criterion.maxOutputBytes - capturedBytes;
          if (value.byteLength > remaining) {
            capturedBytes = criterion.maxOutputBytes;
            stop("output-limit");
            await reader.cancel("artifact command output limit reached").catch(
              () => undefined,
            );
            break;
          }

          capturedBytes += value.byteLength;
        }
      } catch (error) {
        if (stopReason === null) throw error;
      } finally {
        reader.releaseLock();
      }
    };

    const waitForExit = Promise.resolve(process.wait()).catch((error) => {
      if (stopReason !== null) return { exitCode: null };
      throw error;
    });

    const [exit] = await Promise.all([
      waitForExit,
      consume(process.stdout),
      consume(process.stderr),
    ]);

    if (stopReason !== null) await killOnce();

    return {
      exitCode: exit.exitCode,
      capturedBytes,
      stopReason,
    };
  } finally {
    clearTimeout(timer);
    externalAbort?.removeEventListener("abort", onExternalAbort);
  }
}

function isUnsupportedRuntimeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /(?:ENOENT|not found|unsupported|no such file)/i.test(error.message);
}
