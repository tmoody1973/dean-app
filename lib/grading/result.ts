import { z } from "zod";

export const GraderKindSchema = z.enum(["sql", "artifact"]);
export const ComparisonModeSchema = z.enum([
  "exactOutput",
  "rowsMatch",
  "containsAll",
]);

export const GradeErrorSchema = z.object({
  code: z.enum([
    "INVALID_REQUEST",
    "INVALID_EXPECTED_OUTPUT",
    "UNSUPPORTED_RUNTIME",
    "SQL_ERROR",
    "UNSAFE_SQL",
    "TIMEOUT",
    "OUTPUT_LIMIT",
    "MISSING_FILE",
    "CRITERIA_MISMATCH",
    "NONZERO_EXIT",
    "INTERNAL_ERROR",
  ]),
  message: z.string().max(240),
  retryable: z.boolean(),
});

export const GradeResultSchema = z.object({
  grader: GraderKindSchema,
  passed: z.boolean(),
  actualOutput: z.string(),
  expectedOutput: z.string(),
  error: GradeErrorSchema.nullable(),
});

export type GraderKind = z.infer<typeof GraderKindSchema>;
export type ComparisonMode = z.infer<typeof ComparisonModeSchema>;
export type GradeError = z.infer<typeof GradeErrorSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;

type FinalizeGradeInput = {
  readonly grader: GraderKind;
  readonly satisfied: boolean;
  readonly actualOutput: string;
  readonly expectedOutput: string;
  readonly error?: GradeError | null;
};

/** The only production assignment of the authoritative `passed` field. */
export function finalizeGrade({
  grader,
  satisfied,
  actualOutput,
  expectedOutput,
  error = null,
}: FinalizeGradeInput): GradeResult {
  return {
    grader,
    passed: error === null && satisfied,
    actualOutput,
    expectedOutput,
    error,
  };
}

export function compareOutputs(
  mode: ComparisonMode,
  actualOutput: string,
  expectedOutput: string,
): { readonly satisfied: boolean; readonly error: GradeError | null } {
  if (mode === "exactOutput") {
    return { satisfied: actualOutput === expectedOutput, error: null };
  }

  const actualRows = parseRows(actualOutput);
  const expectedRows = parseRows(expectedOutput);

  if (actualRows === null || expectedRows === null) {
    return {
      satisfied: false,
      error: {
        code: "INVALID_EXPECTED_OUTPUT",
        message: "Row comparisons require JSON arrays of row arrays.",
        retryable: true,
      },
    };
  }

  const actualCounts = countRows(actualRows);
  const expectedCounts = countRows(expectedRows);

  if (mode === "rowsMatch" && actualRows.length !== expectedRows.length) {
    return { satisfied: false, error: null };
  }

  for (const [row, expectedCount] of expectedCounts) {
    if ((actualCounts.get(row) ?? 0) < expectedCount) {
      return { satisfied: false, error: null };
    }
  }

  return { satisfied: true, error: null };
}

function parseRows(value: string): readonly (readonly unknown[])[] | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed) || !parsed.every(Array.isArray)) return null;

    return parsed;
  } catch {
    return null;
  }
}

function countRows(rows: readonly (readonly unknown[])[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = stableStringify(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
