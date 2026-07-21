import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// prettier-ignore
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { getLearningModeAction, LEARNING_MODE_ACTIONS, LEARNING_MODE_OPTIONS } from "../lib/learning-modes.ts";

test("the workspace exposes learn, explain, and practice as distinct modes", () => {
  assert.deepEqual(
    LEARNING_MODE_OPTIONS.map((mode) => mode.id),
    ["learn", "explain", "practice"],
  );
});

test("explain and practice actions are plain-English, turn-by-turn prompts", () => {
  for (const action of [
    ...LEARNING_MODE_ACTIONS.explain,
    ...LEARNING_MODE_ACTIONS.practice,
  ]) {
    assert.match(action.message, /active lesson|active learning path/i);
  }

  assert.match(
    getLearningModeAction("practice", "quick-check").message,
    /wait/i,
  );
  assert.match(
    getLearningModeAction("explain", "simpler").message,
    /plain English/i,
  );
});
