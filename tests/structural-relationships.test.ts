import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { checkDeclaredRelationships } from "../lib/grading/structural-relationships.ts";

test("all declared relationships must be matched correctly", () => {
  assert.deepEqual(checkDeclaredRelationships([0, 1, 2], 3), {
    complete: true,
    correctCount: 3,
    requiredCount: 3,
    satisfied: true,
  });

  assert.deepEqual(checkDeclaredRelationships([1, 0, 2], 3), {
    complete: true,
    correctCount: 1,
    requiredCount: 3,
    satisfied: false,
  });
});

test("incomplete or malformed assignments fail closed", () => {
  for (const assignments of [[0, null, 2], [0, 1], [0, 1, 3], [0, 1, 2, 3]]) {
    const result = checkDeclaredRelationships(assignments, 3);

    assert.equal(result.complete, false);
    assert.equal(result.satisfied, false);
  }
});
