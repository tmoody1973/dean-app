import { defineTool } from "eve/tools";

import { gradeArtifact } from "#grading/artifact-grader";
import { GradeExerciseInputSchema } from "#grading/contracts";
import { GradeResultSchema } from "#grading/result";
import { gradeSqlExercise } from "#grading/sql-grader";

export { GradeExerciseInputSchema } from "#grading/contracts";

export default defineTool({
  description:
    "Deterministically grade a supported SQL exercise or approved Codex artifact. The computed result is authoritative and cannot be overridden.",
  inputSchema: GradeExerciseInputSchema,
  outputSchema: GradeResultSchema,
  async execute(input, ctx) {
    if (input.kind === "sql") {
      return gradeSqlExercise({
        setupScript: input.setupScript,
        submission: input.submission,
        mode: input.mode,
        expectedOutput: input.expectedOutput,
      });
    }

    const sandbox = await ctx.getSandbox();
    return gradeArtifact(
      { profileId: input.profileId },
      sandbox,
      ctx.abortSignal,
    );
  },
});
