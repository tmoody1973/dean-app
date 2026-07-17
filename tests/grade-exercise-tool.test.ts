import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { GradeExerciseInputSchema } from "../agent/tools/grade_exercise.ts";

const identity = {
  attemptId: "11111111-1111-4111-8111-111111111111",
  moduleId: "sql-basics",
  blockIndex: 0,
};

test("the grading tool accepts only supported deterministic request shapes", () => {
  assert.equal(
    GradeExerciseInputSchema.safeParse({
      kind: "sql",
      ...identity,
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
    }).success,
    true,
  );
  assert.equal(
    GradeExerciseInputSchema.safeParse({
      kind: "artifact",
      ...identity,
      profileId: "codex-node-tool-v1",
    }).success,
    true,
  );

  for (const input of [
    {
      kind: "sql",
      ...identity,
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
      passed: true,
    },
    {
      kind: "artifact",
      ...identity,
      profileId: "codex-node-tool-v1",
      command: "bash anything.sh",
    },
    { kind: "artifact", ...identity, profileId: "other-profile" },
    { kind: "python", ...identity, submission: "print(1)" },
    {
      kind: "sql",
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
    },
    {
      kind: "sql",
      ...identity,
      attemptId: "not-a-uuid",
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
    },
  ]) {
    assert.equal(GradeExerciseInputSchema.safeParse(input).success, false);
  }
});
