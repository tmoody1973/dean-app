import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { gradeSqlExercise, SqlGradeRequestSchema } from "../lib/grading/sql-grader.ts";

const setupScript = `
  CREATE TABLE items (id INTEGER PRIMARY KEY, label TEXT NOT NULL);
  INSERT INTO items (id, label) VALUES (1, 'alpha'), (2, 'beta'), (3, 'beta');
`;

test("exactOutput passes and fails by exact serialized output", async () => {
  const passing = await gradeSqlExercise({
    submission: "SELECT 7",
    mode: "exactOutput",
    expectedOutput: "[[7]]",
  });
  const failing = await gradeSqlExercise({
    submission: "SELECT 7",
    mode: "exactOutput",
    expectedOutput: "[[8]]",
  });

  assert.equal(passing.passed, true);
  assert.equal(passing.actualOutput, "[[7]]");
  assert.equal(passing.error, null);
  assert.equal(failing.passed, false);
  assert.equal(failing.error, null);
});

test("rowsMatch passes regardless of row order and fails on a mismatch", async () => {
  const request = {
    setupScript,
    submission: "SELECT id, label FROM items",
    mode: "rowsMatch" as const,
  };
  const passing = await gradeSqlExercise({
    ...request,
    expectedOutput: '[[3,"beta"],[1,"alpha"],[2,"beta"]]',
  });
  const failing = await gradeSqlExercise({
    ...request,
    expectedOutput: '[[1,"alpha"],[2,"beta"],[3,"gamma"]]',
  });

  assert.equal(passing.passed, true);
  assert.equal(failing.passed, false);
});

test("containsAll passes for a subset and fails when a row is absent", async () => {
  const request = {
    setupScript,
    submission: "SELECT label FROM items",
    mode: "containsAll" as const,
  };
  const passing = await gradeSqlExercise({
    ...request,
    expectedOutput: '[["alpha"],["beta"]]',
  });
  const failing = await gradeSqlExercise({
    ...request,
    expectedOutput: '[["alpha"],["gamma"]]',
  });

  assert.equal(passing.passed, true);
  assert.equal(failing.passed, false);
});

test("row comparisons preserve duplicate-row multiset semantics", async () => {
  const request = {
    setupScript,
    submission: "SELECT label FROM items",
    mode: "containsAll" as const,
  };
  const exactMultiplicity = await gradeSqlExercise({
    ...request,
    expectedOutput: '[["beta"],["beta"]]',
  });
  const tooManyDuplicates = await gradeSqlExercise({
    ...request,
    expectedOutput: '[["beta"],["beta"],["beta"]]',
  });

  assert.equal(exactMultiplicity.passed, true);
  assert.equal(tooManyDuplicates.passed, false);
});

test("syntax errors return safe retryable details", async () => {
  const result = await gradeSqlExercise({
    submission: "SELEC definitely_not_sql",
    mode: "exactOutput",
    expectedOutput: "[]",
  });

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "SQL_ERROR");
  assert.equal(result.error?.retryable, true);
  assert.doesNotMatch(result.error?.message ?? "", /sqlite|\/Users|at /i);
});

test("write statements and multiple learner statements are rejected", async () => {
  const unsafe = await gradeSqlExercise({
    setupScript,
    submission: "DELETE FROM items",
    mode: "exactOutput",
    expectedOutput: "[]",
  });
  const multiple = await gradeSqlExercise({
    submission: "SELECT 1; SELECT 2",
    mode: "exactOutput",
    expectedOutput: "[[1]]",
  });

  assert.equal(unsafe.error?.code, "UNSAFE_SQL");
  assert.equal(multiple.error?.code, "UNSAFE_SQL");
});

test("exercise setup rejects filesystem and computed-data operations", async () => {
  const attached = await gradeSqlExercise({
    setupScript: "ATTACH DATABASE '/tmp/other.db' AS other",
    submission: "SELECT 1",
    mode: "exactOutput",
    expectedOutput: "[[1]]",
  });
  const computed = await gradeSqlExercise({
    setupScript: "CREATE TABLE generated AS SELECT 1 AS value",
    submission: "SELECT value FROM generated",
    mode: "exactOutput",
    expectedOutput: "[[1]]",
  });

  assert.equal(attached.error?.code, "UNSAFE_SQL");
  assert.equal(computed.error?.code, "UNSAFE_SQL");
});

test("recursive queries are terminated by the parent timeout", async () => {
  const result = await gradeSqlExercise({
    submission:
      "WITH RECURSIVE forever(n) AS (VALUES(1) UNION ALL SELECT n + 1 FROM forever) SELECT sum(n) FROM forever",
    mode: "exactOutput",
    expectedOutput: "[]",
  });

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "TIMEOUT");
  assert.equal(result.error?.retryable, true);
});

test("query output is capped while rows are collected", async () => {
  const result = await gradeSqlExercise({
    submission: "SELECT hex(zeroblob(40000))",
    mode: "exactOutput",
    expectedOutput: "[]",
  });

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "OUTPUT_LIMIT");
});

test("invalid expected row JSON returns a retryable grading error", async () => {
  const result = await gradeSqlExercise({
    submission: "SELECT 1",
    mode: "rowsMatch",
    expectedOutput: "not-json",
  });

  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "INVALID_EXPECTED_OUTPUT");
  assert.equal(result.error?.retryable, true);
});

test("strict requests reject a model-supplied passed field", async () => {
  const request = {
    submission: "SELECT 1",
    mode: "exactOutput",
    expectedOutput: "[[1]]",
    passed: true,
  };

  assert.equal(SqlGradeRequestSchema.safeParse(request).success, false);

  const result = await gradeSqlExercise(request);
  assert.equal(result.passed, false);
  assert.equal(result.error?.code, "INVALID_REQUEST");
});

test("large integer and blob cells are converted to JSON-safe values", async () => {
  const result = await gradeSqlExercise({
    submission: "SELECT 9223372036854775807, x'00ff'",
    mode: "exactOutput",
    expectedOutput: '[["9223372036854776000","base64:AP8="]]'
  });

  assert.equal(result.passed, true);
  assert.deepEqual(JSON.parse(result.actualOutput), [
    ["9223372036854776000", "base64:AP8="],
  ]);
});
