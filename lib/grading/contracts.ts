import { z } from "zod";

import { ComparisonModeSchema } from "#grading/result";

export const MAX_SQL_SETUP_LENGTH = 24_000;
export const MAX_SQL_SUBMISSION_LENGTH = 12_000;
export const MAX_SQL_EXPECTED_OUTPUT_LENGTH = 32_768;

export const SqlGradeRequestSchema = z
  .object({
    setupScript: z.string().max(MAX_SQL_SETUP_LENGTH).optional(),
    submission: z.string().min(1).max(MAX_SQL_SUBMISSION_LENGTH),
    mode: ComparisonModeSchema,
    expectedOutput: z.string().max(MAX_SQL_EXPECTED_OUTPUT_LENGTH),
  })
  .strict();

export type SqlGradeRequest = z.infer<typeof SqlGradeRequestSchema>;

export const ArtifactGradeInputSchema = z
  .object({
    profileId: z.literal("codex-node-tool-v1"),
  })
  .strict();

export type ArtifactGradeInput = z.infer<typeof ArtifactGradeInputSchema>;

export const GradeAttemptIdentitySchema = z
  .object({
    attemptId: z.uuid(),
    moduleId: z.string().min(1).max(160),
    blockIndex: z.number().int().nonnegative().max(99),
  })
  .strict();

export type GradeAttemptIdentity = z.infer<typeof GradeAttemptIdentitySchema>;

const identityShape = GradeAttemptIdentitySchema.shape;

export const SqlGradeExerciseInputSchema = SqlGradeRequestSchema.extend({
  kind: z.literal("sql"),
  ...identityShape,
}).strict();

export const ArtifactGradeExerciseInputSchema = ArtifactGradeInputSchema.extend({
  kind: z.literal("artifact"),
  ...identityShape,
}).strict();

export const GradeExerciseInputSchema = z.discriminatedUnion("kind", [
  SqlGradeExerciseInputSchema,
  ArtifactGradeExerciseInputSchema,
]);

export type SqlGradeExerciseInput = z.infer<
  typeof SqlGradeExerciseInputSchema
>;
export type ArtifactGradeExerciseInput = z.infer<
  typeof ArtifactGradeExerciseInputSchema
>;
export type GradeExerciseInput = z.infer<typeof GradeExerciseInputSchema>;
