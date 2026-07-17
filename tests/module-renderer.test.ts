import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { EXAMPLE_MODULE, LearningModule, parseModule, safeFallback } from "../lib/module-spec.ts";

test("valid module input passes frontend defense-in-depth validation", () => {
  const parsed = parseModule(EXAMPLE_MODULE);

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.ok ? parsed.module : null, EXAMPLE_MODULE);
});

test("invalid module input becomes a schema-valid explain fallback", () => {
  const parsed = parseModule({ title: "Missing the contract" });
  const fallback = parsed.ok
    ? parsed.module
    : safeFallback(
        "A simpler explanation",
        "Review the current concept in plain language, then continue when you are ready.",
      );

  assert.equal(LearningModule.safeParse(fallback).success, true);
  assert.equal(fallback.concept, "A simpler explanation");
  assert.deepEqual(fallback.blocks, [
    {
      type: "explain",
      markdown:
        "Review the current concept in plain language, then continue when you are ready.",
    },
  ]);
});

test("model-authored HTML remains inert text data", () => {
  const payload = structuredClone(EXAMPLE_MODULE);
  const hostileText = '<img src=x onerror="globalThis.compromised=true">';
  payload.blocks = [{ type: "explain", markdown: hostileText }];
  payload.mastery = { required: 1, outOf: 1 };

  const parsed = parseModule(payload);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.ok ? parsed.module.blocks[0].type : null, "explain");
  assert.equal(
    parsed.ok && parsed.module.blocks[0].type === "explain"
      ? parsed.module.blocks[0].markdown
      : null,
    hostileText,
  );
});

test("the two renderer fixtures cover all seven validated block types", () => {
  const interactionFixture = {
    id: "renderer-interactions-01",
    concept: "Interactive component coverage",
    title: "Try the remaining interaction types",
    difficulty: "intro",
    modality: "interactive",
    blocks: [
      {
        type: "parameterSlider",
        prompt: "Change the number of rows.",
        language: "sql",
        codeTemplate: "SELECT * FROM orders LIMIT {{value}}",
        slider: { label: "Rows", min: 1, max: 10, step: 1, initial: 3 },
      },
      {
        type: "dragMatch",
        prompt: "Match each clause to its job.",
        pairs: [
          { left: "SELECT", right: "chooses columns" },
          { left: "FROM", right: "chooses a table" },
          { left: "WHERE", right: "filters rows" },
        ],
      },
      {
        type: "quiz",
        question: "Which clause filters rows?",
        choices: ["SELECT", "FROM", "WHERE"],
        answerIndex: 2,
        explanation: "WHERE keeps only rows that meet a condition.",
      },
      {
        type: "revealSequence",
        title: "A query in two steps",
        steps: [
          { heading: "Choose", body: "SELECT identifies the columns." },
          { heading: "Filter", body: "WHERE narrows the rows." },
        ],
      },
    ],
    mastery: { required: 2, outOf: 2 },
    onFailure: {
      switchToModality: "visual",
      carryForwardMistake: true,
    },
  };

  const parsed = LearningModule.safeParse(interactionFixture);

  assert.equal(parsed.success, true);
  assert.deepEqual(
    new Set([
      ...EXAMPLE_MODULE.blocks.map((block) => block.type),
      ...(parsed.success ? parsed.data.blocks.map((block) => block.type) : []),
    ]),
    new Set([
      "explain",
      "codeExercise",
      "conceptDiagram",
      "parameterSlider",
      "dragMatch",
      "quiz",
      "revealSequence",
    ]),
  );
});
