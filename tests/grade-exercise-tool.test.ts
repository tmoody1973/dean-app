import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { GradeExerciseInputSchema } from "../agent/tools/grade_exercise.ts";

test("the grading tool accepts only supported deterministic request shapes", () => {
  assert.equal(
    GradeExerciseInputSchema.safeParse({
      kind: "sql",
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
    }).success,
    true,
  );
  assert.equal(
    GradeExerciseInputSchema.safeParse({
      kind: "artifact",
      profileId: "codex-node-tool-v1",
    }).success,
    true,
  );

  for (const input of [
    {
      kind: "sql",
      submission: "SELECT 1",
      mode: "exactOutput",
      expectedOutput: "[[1]]",
      passed: true,
    },
    {
      kind: "artifact",
      profileId: "codex-node-tool-v1",
      command: "bash anything.sh",
    },
    { kind: "artifact", profileId: "other-profile" },
    { kind: "python", submission: "print(1)" },
  ]) {
    assert.equal(GradeExerciseInputSchema.safeParse(input).success, false);
  }
});
