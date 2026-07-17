import type { HandleMessageStreamEvent } from "eve/client";

import {
  GradeExerciseInputSchema,
  type GradeExerciseInput,
} from "#grading/contracts";
import { GradeResultSchema, type GradeResult } from "#grading/result";

const GRADE_TOOL_NAME = "grade_exercise";

export type GradeAttemptStatus = "pending" | "completed" | "error";

export type GradeAttemptProtocolError = {
  readonly code: "GRADE_PROTOCOL_ERROR";
  readonly message: string;
  readonly retryable: true;
};

export type GradeAttempt = {
  readonly callId: string;
  readonly input: GradeExerciseInput;
  readonly status: GradeAttemptStatus;
  readonly result: GradeResult | null;
  readonly protocolError: GradeAttemptProtocolError | null;
};

export type GradeAttemptProjection = {
  readonly attempts: readonly GradeAttempt[];
};

/**
 * Project authoritative grading attempts from Eve's durable raw event stream.
 * Calls are correlated exclusively by call ID; rendered assistant text is not
 * part of the grading protocol.
 */
export function projectGradeAttempts(
  events: readonly HandleMessageStreamEvent[],
): GradeAttemptProjection {
  const attemptsByCallId = new Map<string, GradeAttempt>();

  for (const event of events) {
    if (event.type === "actions.requested") {
      for (const action of event.data.actions) {
        if (action.kind !== "tool-call" || action.toolName !== GRADE_TOOL_NAME) {
          continue;
        }

        const parsedInput = GradeExerciseInputSchema.safeParse(action.input);
        if (!parsedInput.success) continue;

        const existing = attemptsByCallId.get(action.callId);
        if (existing === undefined) {
          attemptsByCallId.set(action.callId, {
            callId: action.callId,
            input: parsedInput.data,
            status: "pending",
            result: null,
            protocolError: null,
          });
          continue;
        }

        if (!gradeExerciseInputsEqual(existing.input, parsedInput.data)) {
          attemptsByCallId.set(
            action.callId,
            protocolFailure(existing, "The grading request changed during replay."),
          );
        }
      }

      continue;
    }

    if (event.type !== "action.result") continue;

    const actionResult = event.data.result;
    const existing = attemptsByCallId.get(actionResult.callId);
    if (existing === undefined || existing.status === "error") continue;

    if (
      event.data.status !== "completed" ||
      event.data.error !== undefined ||
      actionResult.kind !== "tool-result" ||
      actionResult.toolName !== GRADE_TOOL_NAME ||
      actionResult.isError === true
    ) {
      attemptsByCallId.set(
        actionResult.callId,
        protocolFailure(
          existing,
          "The grading tool failed before returning a verified result.",
        ),
      );
      continue;
    }

    const parsedResult = GradeResultSchema.safeParse(actionResult.output);
    if (
      !parsedResult.success ||
      parsedResult.data.grader !== existing.input.kind
    ) {
      attemptsByCallId.set(
        actionResult.callId,
        protocolFailure(existing, "The grading tool returned an invalid result."),
      );
      continue;
    }

    if (existing.status === "completed") {
      if (!gradeResultsEqual(existing.result, parsedResult.data)) {
        attemptsByCallId.set(
          actionResult.callId,
          protocolFailure(
            existing,
            "The grading result changed during replay.",
          ),
        );
      }
      continue;
    }

    attemptsByCallId.set(actionResult.callId, {
      ...existing,
      status: "completed",
      result: parsedResult.data,
      protocolError: null,
    });
  }

  return { attempts: [...attemptsByCallId.values()] };
}

export function gradeExerciseInputsEqual(
  left: GradeExerciseInput,
  right: GradeExerciseInput,
): boolean {
  if (
    left.kind !== right.kind ||
    left.attemptId !== right.attemptId ||
    left.moduleId !== right.moduleId ||
    left.blockIndex !== right.blockIndex
  ) {
    return false;
  }

  if (left.kind === "artifact" && right.kind === "artifact") {
    return left.profileId === right.profileId;
  }

  if (left.kind === "sql" && right.kind === "sql") {
    return (
      left.setupScript === right.setupScript &&
      left.submission === right.submission &&
      left.mode === right.mode &&
      left.expectedOutput === right.expectedOutput
    );
  }

  return false;
}

/** Returns the latest attempt whose validated input exactly matches `input`. */
export function findExactGradeAttempt(
  projection: GradeAttemptProjection,
  input: GradeExerciseInput,
): GradeAttempt | undefined {
  return projection.attempts.findLast((attempt) =>
    gradeExerciseInputsEqual(attempt.input, input),
  );
}

/** Count every authoritative failed result retained for one exercise block. */
export function countFailedGradeAttempts(
  projection: GradeAttemptProjection,
  moduleId: string,
  blockIndex: number,
): number {
  return projection.attempts.filter(
    (attempt) =>
      attempt.input.moduleId === moduleId &&
      attempt.input.blockIndex === blockIndex &&
      attempt.status === "completed" &&
      attempt.result?.passed === false &&
      attempt.result.error === null,
  ).length;
}

function protocolFailure(
  attempt: GradeAttempt,
  message: string,
): GradeAttempt {
  return {
    ...attempt,
    status: "error",
    result: null,
    protocolError: {
      code: "GRADE_PROTOCOL_ERROR",
      message,
      retryable: true,
    },
  };
}

function gradeResultsEqual(
  left: GradeResult | null,
  right: GradeResult,
): boolean {
  return (
    left !== null &&
    left.grader === right.grader &&
    left.passed === right.passed &&
    left.actualOutput === right.actualOutput &&
    left.expectedOutput === right.expectedOutput &&
    left.error?.code === right.error?.code &&
    left.error?.message === right.error?.message &&
    left.error?.retryable === right.error?.retryable
  );
}
