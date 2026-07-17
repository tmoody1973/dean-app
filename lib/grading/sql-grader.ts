import sqlite3 from "sqlite3";
import { z } from "zod";

import {
  ComparisonModeSchema,
  compareOutputs,
  finalizeGrade,
  type GradeError,
  type GradeResult,
} from "#grading/result";

const MAX_SETUP_BYTES = 24_000;
const MAX_SUBMISSION_BYTES = 12_000;
const MAX_EXPECTED_OUTPUT_BYTES = 32_768;
const MAX_ACTUAL_OUTPUT_BYTES = 32_768;
const MAX_ROWS = 1_000;
const SQL_TIMEOUT_MS = 750;

export const SqlGradeRequestSchema = z
  .object({
    setupScript: z.string().max(MAX_SETUP_BYTES).optional(),
    submission: z.string().min(1).max(MAX_SUBMISSION_BYTES),
    mode: ComparisonModeSchema,
    expectedOutput: z.string().max(MAX_EXPECTED_OUTPUT_BYTES),
  })
  .strict();

export type SqlGradeRequest = z.infer<typeof SqlGradeRequestSchema>;

type SqlExecution =
  | { readonly ok: true; readonly actualOutput: string }
  | { readonly ok: false; readonly error: GradeError };

type SqliteError = Error & { readonly code?: string; readonly errno?: number };

const LEARNER_FORBIDDEN_TOKENS = new Set([
  "ALTER",
  "ANALYZE",
  "ATTACH",
  "CREATE",
  "DELETE",
  "DETACH",
  "DROP",
  "INSERT",
  "LOAD_EXTENSION",
  "PRAGMA",
  "REINDEX",
  "REPLACE",
  "UPDATE",
  "VACUUM",
]);

const SETUP_FORBIDDEN_TOKENS = new Set([
  "ATTACH",
  "DETACH",
  "LOAD_EXTENSION",
  "PRAGMA",
  "RECURSIVE",
  "SELECT",
  "TRIGGER",
  "VACUUM",
  "VIEW",
  "VIRTUAL",
  "WITH",
]);

export async function gradeSqlExercise(input: unknown): Promise<GradeResult> {
  const parsed = SqlGradeRequestSchema.safeParse(input);

  if (!parsed.success || !requestFitsByteLimits(parsed.data)) {
    return failedGrade("", {
      code: "INVALID_REQUEST",
      message:
        "The SQL grading request was invalid or too large. Please try again.",
      retryable: true,
    });
  }

  const safetyError = validateSqlSafety(parsed.data);
  if (safetyError !== null) {
    return failedGrade(parsed.data.expectedOutput, safetyError);
  }

  const execution = await executeSql(parsed.data);
  if (!execution.ok) {
    return failedGrade(parsed.data.expectedOutput, execution.error);
  }

  const comparison = compareOutputs(
    parsed.data.mode,
    execution.actualOutput,
    parsed.data.expectedOutput,
  );

  return finalizeGrade({
    grader: "sql",
    satisfied: comparison.satisfied,
    actualOutput: execution.actualOutput,
    expectedOutput: parsed.data.expectedOutput,
    error: comparison.error,
  });
}

function executeSql(request: SqlGradeRequest): Promise<SqlExecution> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let terminalError: GradeError | null = null;
    const database = new sqlite3.Database(
      ":memory:",
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX,
      (openError) => {
        if (openError) {
          finish({
            ok: false,
            error: safeSqlError(),
          });
          return;
        }

        configureDatabase(database);
        timer = setTimeout(() => {
          terminalError ??= {
            code: "TIMEOUT",
            message: "The SQL query took too long. Simplify it and try again.",
            retryable: true,
          };
          database.interrupt();
        }, SQL_TIMEOUT_MS);

        const runSubmission = () => {
          const chunks = ["["];
          let capturedBytes = 1;
          let rowCount = 0;

          database.each<Record<string, unknown>>(
            request.submission,
            (rowError, row) => {
              if (terminalError !== null) return;
              if (rowError) {
                terminalError = safeSqlError();
                database.interrupt();
                return;
              }

              rowCount += 1;
              if (rowCount > MAX_ROWS) {
                terminalError = {
                  code: "OUTPUT_LIMIT",
                  message:
                    "The query returned too many rows. Narrow it and try again.",
                  retryable: true,
                };
                database.interrupt();
                return;
              }

              const serialized = JSON.stringify(
                Object.values(row).map(normalizeSqlValue),
              );
              const chunk = `${rowCount === 1 ? "" : ","}${serialized}`;
              capturedBytes += Buffer.byteLength(chunk, "utf8");

              if (capturedBytes + 1 > MAX_ACTUAL_OUTPUT_BYTES) {
                terminalError = {
                  code: "OUTPUT_LIMIT",
                  message:
                    "The query result was too large. Return fewer rows or columns and try again.",
                  retryable: true,
                };
                database.interrupt();
                return;
              }

              chunks.push(chunk);
            },
            (queryError) => {
              if (terminalError !== null) {
                finish({ ok: false, error: terminalError });
                return;
              }

              if (queryError) {
                finish({ ok: false, error: classifySqlError(queryError) });
                return;
              }

              chunks.push("]");
              finish({ ok: true, actualOutput: chunks.join("") });
            },
          );
        };

        if (request.setupScript === undefined || request.setupScript.trim() === "") {
          runSubmission();
          return;
        }

        database.exec(request.setupScript, (setupError) => {
          if (terminalError !== null) {
            finish({ ok: false, error: terminalError });
            return;
          }

          if (setupError) {
            finish({
              ok: false,
              error: {
                code: "SQL_ERROR",
                message: "The exercise data could not be prepared. Please try again.",
                retryable: true,
              },
            });
            return;
          }

          runSubmission();
        });
      },
    );

    function finish(result: SqlExecution): void {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);

      database.close(() => resolve(result));
    }
  });
}

function configureDatabase(database: sqlite3.Database): void {
  database.configure("busyTimeout", 0);
  database.configure("limit", sqlite3.LIMIT_LENGTH, 256 * 1024);
  database.configure("limit", sqlite3.LIMIT_SQL_LENGTH, MAX_SETUP_BYTES);
  database.configure("limit", sqlite3.LIMIT_COLUMN, 128);
  database.configure("limit", sqlite3.LIMIT_EXPR_DEPTH, 100);
  database.configure("limit", sqlite3.LIMIT_COMPOUND_SELECT, 20);
  database.configure("limit", sqlite3.LIMIT_VDBE_OP, 100_000);
  database.configure("limit", sqlite3.LIMIT_FUNCTION_ARG, 32);
  database.configure("limit", sqlite3.LIMIT_ATTACHED, 0);
  database.configure("limit", sqlite3.LIMIT_LIKE_PATTERN_LENGTH, 4_096);
  database.configure("limit", sqlite3.LIMIT_VARIABLE_NUMBER, 128);
  database.configure("limit", sqlite3.LIMIT_TRIGGER_DEPTH, 0);
}

function validateSqlSafety(request: SqlGradeRequest): GradeError | null {
  if (request.setupScript !== undefined) {
    const setupStatements = tokenizeStatements(request.setupScript);

    if (
      setupStatements === null ||
      !setupStatements.every(isAllowedSetupStatement)
    ) {
      return {
        code: "UNSAFE_SQL",
        message:
          "Exercise setup is limited to table or index creation and direct inserts.",
        retryable: true,
      };
    }
  }

  const learnerStatements = tokenizeStatements(request.submission);
  if (learnerStatements === null || learnerStatements.length !== 1) {
    return {
      code: "UNSAFE_SQL",
      message: "Submit exactly one read-only SQL query.",
      retryable: true,
    };
  }

  const tokens = learnerStatements[0];
  if (tokens.some((token) => LEARNER_FORBIDDEN_TOKENS.has(token))) {
    return {
      code: "UNSAFE_SQL",
      message: "Only one read-only SELECT query is permitted.",
      retryable: true,
    };
  }

  if (tokens[0] !== "SELECT" && tokens[0] !== "WITH") {
    return safeSqlError();
  }

  return null;
}

function isAllowedSetupStatement(tokens: readonly string[]): boolean {
  if (tokens.some((token) => SETUP_FORBIDDEN_TOKENS.has(token))) return false;

  return (
    (tokens[0] === "CREATE" &&
      (tokens[1] === "TABLE" || tokens[1] === "INDEX")) ||
    (tokens[0] === "INSERT" && tokens[1] === "INTO")
  );
}

function tokenizeStatements(sql: string): readonly (readonly string[])[] | null {
  const masked = maskQuotedAndCommentedSql(sql);
  if (masked === null) return null;

  return masked
    .split(";")
    .map((statement) => statement.match(/[A-Za-z_][A-Za-z0-9_]*/gu) ?? [])
    .filter((tokens) => tokens.length > 0)
    .map((tokens) => tokens.map((token) => token.toUpperCase()));
}

function maskQuotedAndCommentedSql(sql: string): string | null {
  const output = [...sql];
  let index = 0;

  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];

    if (current === "-" && next === "-") {
      output[index] = output[index + 1] = " ";
      index += 2;
      while (index < sql.length && sql[index] !== "\n") output[index++] = " ";
      continue;
    }

    if (current === "/" && next === "*") {
      output[index] = output[index + 1] = " ";
      index += 2;
      while (
        index < sql.length &&
        !(sql[index] === "*" && sql[index + 1] === "/")
      ) {
        output[index++] = " ";
      }
      if (index >= sql.length) return null;
      output[index] = output[index + 1] = " ";
      index += 2;
      continue;
    }

    const closing =
      current === "["
        ? "]"
        : current === "'" || current === '"' || current === "`"
          ? current
          : null;

    if (closing !== null) {
      output[index++] = " ";
      let closed = false;

      while (index < sql.length) {
        if (sql[index] === closing) {
          output[index++] = " ";
          if (closing !== "]" && sql[index] === closing) {
            output[index++] = " ";
            continue;
          }
          closed = true;
          break;
        }
        output[index++] = " ";
      }

      if (!closed) return null;
      continue;
    }

    index += 1;
  }

  return output.join("");
}

function requestFitsByteLimits(request: SqlGradeRequest): boolean {
  return (
    byteLength(request.setupScript ?? "") <= MAX_SETUP_BYTES &&
    byteLength(request.submission) <= MAX_SUBMISSION_BYTES &&
    byteLength(request.expectedOutput) <= MAX_EXPECTED_OUTPUT_BYTES
  );
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function normalizeSqlValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) return `base64:${value.toString("base64")}`;
  if (typeof value === "bigint") return value.toString(10);
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    return String(value);
  }
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  return value;
}

function classifySqlError(error: SqliteError): GradeError {
  if (error.code === "SQLITE_INTERRUPT") {
    return {
      code: "TIMEOUT",
      message: "The SQL query was interrupted. Simplify it and try again.",
      retryable: true,
    };
  }

  return safeSqlError();
}

function safeSqlError(): GradeError {
  return {
    code: "SQL_ERROR",
    message: "The SQL query could not be executed. Check the syntax and try again.",
    retryable: true,
  };
}

function failedGrade(expectedOutput: string, error: GradeError): GradeResult {
  return finalizeGrade({
    grader: "sql",
    satisfied: false,
    actualOutput: "",
    expectedOutput,
    error,
  });
}
