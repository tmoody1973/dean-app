import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { CURRICULUM_GENERATION_LIMIT, GENERATION_WINDOW_MS, MODULE_GENERATION_LIMIT, consumeGenerationAllowance, type GenerationUsage } from "../agent/lib/session-limits.ts";

const initialUsage: GenerationUsage = {
  curriculumGenerations: 0,
  generationWindowStartedAt: null,
  moduleGenerations: 0,
};

test("curriculum builds stop at the session-hour limit with a learner-facing message", () => {
  let usage: GenerationUsage = initialUsage;

  for (let attempt = 0; attempt < CURRICULUM_GENERATION_LIMIT; attempt += 1) {
    const result = consumeGenerationAllowance(usage, "curriculum", 1_000);
    assert.equal(result.allowed, true);
    usage = result.usage;
  }

  const rejected = consumeGenerationAllowance(usage, "curriculum", 1_000);
  assert.equal(rejected.allowed, false);
  assert.match(rejected.message ?? "", /three curriculum builds/i);
});

test("module renders stop independently at the hourly limit", () => {
  let usage: GenerationUsage = initialUsage;

  for (let attempt = 0; attempt < MODULE_GENERATION_LIMIT; attempt += 1) {
    const result = consumeGenerationAllowance(usage, "module", 1_000);
    assert.equal(result.allowed, true);
    usage = result.usage;
  }

  const rejected = consumeGenerationAllowance(usage, "module", 1_000);
  assert.equal(rejected.allowed, false);
  assert.match(rejected.message ?? "", /30-module hourly limit/i);
});

test("an expired session window starts a new allowance", () => {
  const exhausted = {
    curriculumGenerations: CURRICULUM_GENERATION_LIMIT,
    generationWindowStartedAt: 1_000,
    moduleGenerations: MODULE_GENERATION_LIMIT,
  };

  const reset = consumeGenerationAllowance(
    exhausted,
    "module",
    1_000 + GENERATION_WINDOW_MS,
  );

  assert.equal(reset.allowed, true);
  assert.equal(reset.usage.curriculumGenerations, 0);
  assert.equal(reset.usage.moduleGenerations, 1);
});
