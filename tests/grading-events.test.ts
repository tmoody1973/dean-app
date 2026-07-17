import assert from "node:assert/strict";
import test from "node:test";

import type { HandleMessageStreamEvent } from "eve/client";

// Node's type-stripping runtime requires the .ts extension.
import type { GradeExerciseInput } from "../lib/grading/contracts.ts";
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { countFailedGradeAttempts, findExactGradeAttempt, projectGradeAttempts } from "../lib/grading/grading-events.ts";

const sqlInput: GradeExerciseInput = {
  kind: "sql",
  attemptId: "11111111-1111-4111-8111-111111111111",
  moduleId: "sql-basics",
  blockIndex: 0,
  submission: "SELECT 1",
  mode: "exactOutput",
  expectedOutput: "[[1]]",
};

const passedResult = {
  grader: "sql",
  passed: true,
  actualOutput: "[[1]]",
  expectedOutput: "[[1]]",
  error: null,
};

test("projects pending, passing, and deterministic failing attempts", () => {
  const pending = projectGradeAttempts([requested("pending", sqlInput)]);
  assert.equal(pending.attempts[0]?.status, "pending");

  const passed = projectGradeAttempts([
    requested("pass", sqlInput),
    completed("pass", passedResult),
  ]);
  assert.equal(passed.attempts[0]?.status, "completed");
  assert.equal(passed.attempts[0]?.result?.passed, true);

  const failedInput = { ...sqlInput, attemptId: "22222222-2222-4222-8222-222222222222" };
  const failed = projectGradeAttempts([
    requested("fail", failedInput),
    completed("fail", { ...passedResult, passed: false, actualOutput: "[[2]]" }),
  ]);
  assert.equal(failed.attempts[0]?.result?.passed, false);
  assert.equal(countFailedGradeAttempts(failed, "sql-basics", 0), 1);
});

test("preserves a nested retryable grade error as an authoritative result", () => {
  const projection = projectGradeAttempts([
    requested("retryable", sqlInput),
    completed("retryable", {
      ...passedResult,
      passed: false,
      actualOutput: "",
      error: { code: "TIMEOUT", message: "Try again.", retryable: true },
    }),
  ]);

  assert.equal(projection.attempts[0]?.status, "completed");
  assert.equal(projection.attempts[0]?.result?.error?.retryable, true);
  assert.equal(projection.attempts[0]?.protocolError, null);
  assert.equal(countFailedGradeAttempts(projection, "sql-basics", 0), 0);
});

test("fails closed on a tool or protocol failure", () => {
  const failed = projectGradeAttempts([
    requested("failed", sqlInput),
    completed("failed", passedResult, { status: "failed", isError: true }),
  ]);

  assert.equal(failed.attempts[0]?.status, "error");
  assert.equal(failed.attempts[0]?.result, null);
  assert.equal(failed.attempts[0]?.protocolError?.retryable, true);
});

test("does not attach a result with a mismatched call ID or input", () => {
  const mismatchedCall = projectGradeAttempts([
    requested("expected", sqlInput),
    completed("other", passedResult),
  ]);
  assert.equal(mismatchedCall.attempts[0]?.status, "pending");

  const changedInput = projectGradeAttempts([
    requested("same", sqlInput),
    requested("same", { ...sqlInput, submission: "SELECT 2" }),
  ]);
  assert.equal(changedInput.attempts[0]?.status, "error");
  assert.equal(
    findExactGradeAttempt(changedInput, { ...sqlInput, submission: "SELECT 2" }),
    undefined,
  );
});

test("rejects invalid grading output", () => {
  const projection = projectGradeAttempts([
    requested("invalid", sqlInput),
    completed("invalid", { ...passedResult, passed: "yes" }),
  ]);
  assert.equal(projection.attempts[0]?.status, "error");
  assert.equal(projection.attempts[0]?.result, null);
});

test("ignores unrelated tools", () => {
  const projection = projectGradeAttempts([
    requested("other", sqlInput, "search_docs"),
    completed("other", passedResult, { toolName: "search_docs" }),
  ]);
  assert.deepEqual(projection.attempts, []);
});

test("replay is idempotent and retains all distinct attempts", () => {
  const secondInput = {
    ...sqlInput,
    attemptId: "33333333-3333-4333-8333-333333333333",
  };
  const request = requested("first", sqlInput);
  const result = completed("first", passedResult);
  const projection = projectGradeAttempts([
    request,
    result,
    request,
    result,
    requested("second", secondInput),
  ]);

  assert.equal(projection.attempts.length, 2);
  assert.equal(projection.attempts[0]?.status, "completed");
  assert.equal(projection.attempts[1]?.status, "pending");
});

test("action-only sequences work without assistant narration events", () => {
  const projection = projectGradeAttempts([
    requested("silent", sqlInput),
    completed("silent", passedResult),
  ]);
  assert.equal(projection.attempts[0]?.result?.passed, true);
});

function requested(
  callId: string,
  input: GradeExerciseInput,
  toolName = "grade_exercise",
): HandleMessageStreamEvent {
  return {
    type: "actions.requested",
    data: {
      actions: [{ kind: "tool-call", callId, toolName, input }],
      sequence: 1,
      stepIndex: 0,
      turnId: "turn-1",
    },
  } as HandleMessageStreamEvent;
}

function completed(
  callId: string,
  output: unknown,
  options: {
    status?: "completed" | "failed" | "rejected";
    isError?: boolean;
    toolName?: string;
  } = {},
): HandleMessageStreamEvent {
  return {
    type: "action.result",
    data: {
      result: {
        kind: "tool-result",
        callId,
        toolName: options.toolName ?? "grade_exercise",
        output,
        isError: options.isError,
      },
      sequence: 2,
      stepIndex: 0,
      status: options.status ?? "completed",
      turnId: "turn-1",
    },
  } as HandleMessageStreamEvent;
}
