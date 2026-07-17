import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  ArtifactGradeInputSchema,
  gradeArtifact,
} from "#grading/artifact-grader";
import { GradeResultSchema } from "#grading/result";
import {
  gradeSqlExercise,
  SqlGradeRequestSchema,
} from "#grading/sql-grader";

export const GradeExerciseInputSchema = z.discriminatedUnion("kind", [
  SqlGradeRequestSchema.extend({ kind: z.literal("sql") }),
  ArtifactGradeInputSchema.extend({ kind: z.literal("artifact") }),
]);

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
