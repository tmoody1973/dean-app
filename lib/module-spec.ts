/**
 * MODULE SPEC — the contract between GPT-5.6 and your screen.
 *
 * PLAIN ENGLISH: Think of this file as a Lego kit with 7 brick shapes.
 * The model is allowed to pick which bricks to use, what order to snap
 * them together, and what words/code/data go inside each brick.
 * The model is NOT allowed to invent new brick shapes.
 *
 * Why this matters: this schema does double duty.
 *   (1) It is the inputSchema of the agent's `render_module` tool — so the
 *       eve framework itself rejects invalid modules AT THE TOOL BOUNDARY,
 *       before they ever exist. The model literally cannot deliver a
 *       malformed lesson.
 *   (2) The frontend re-validates with parseModule() as defense-in-depth,
 *       and safeFallback() guarantees the learner sees a plain explanation
 *       instead of an error if anything ever slips through. Nothing
 *       white-screens.
 *
 * This file is framework-agnostic. It works identically whether the
 * frontend is AI SDK, CopilotKit, or anything else.
 */

import { z } from "zod";

/* ─────────────────────────────────────────────────────────────
 * SHARED VOCABULARY
 * Small enums the whole system agrees on.
 * ──────────────────────────────────────────────────────────── */

// How hard is this module pitched? The Dean sets this from calibration;
// the tutor moves it up/down as the learner succeeds or struggles.
export const Difficulty = z.enum(["intro", "core", "stretch"]);

// The "flavor" of teaching. This is the magic lever for adaptivity:
// when a learner fails, the tutor regenerates the SAME concept in a
// DIFFERENT modality (e.g., abstract diagram → hands-on drill).
export const Modality = z.enum([
  "hands-on",   // learn by typing real code in the sandbox
  "visual",     // learn by seeing/manipulating a diagram
  "interactive",// learn by dragging, sliding, matching
  "narrative",  // learn by reading a short, plain explanation
]);

/* ─────────────────────────────────────────────────────────────
 * THE 7 BRICKS (block types)
 * Every block has a `type` field — that's how the renderer knows
 * which React component to mount. The `type` string IS the routing.
 * ──────────────────────────────────────────────────────────── */

/**
 * BRICK 1: EXPLAIN
 * A short piece of teaching text. Markdown allowed.
 * PLAIN ENGLISH: the "teacher talks for 20 seconds" brick.
 * Also the universal FALLBACK — if any other block fails validation,
 * the renderer downgrades it to one of these so something always shows.
 */
export const ExplainBlock = z.object({
  type: z.literal("explain"),
  markdown: z.string().min(1).max(1200), // cap it — no lectures
});

/**
 * BRICK 2: CODE EXERCISE
 * The learner writes real code; the grading tool EXECUTES it and grading is
 * DETERMINISTIC — we compare actual output to expected output.
 * (v1: execution runs in-process via a sqlite library inside the grading
 * tool — reliable and still real. The eve sandbox version is the P1
 * upgrade for the "learner's real computer" narrative.)
 * PLAIN ENGLISH: "here's a half-built query, finish it, and the
 * computer — not the AI's opinion — decides if you got it right."
 * This is the leash: GPT-5.6 writes the exercise, but a string/row
 * comparison does the grading. The model cannot grade generously.
 */
export const CodeExerciseBlock = z.object({
  type: z.literal("codeExercise"),
  prompt: z.string(),                    // what we're asking the learner to do
  language: z.enum(["sql", "python", "bash", "typescript"]),
  starterCode: z.string(),               // pre-filled editor contents
  setupScript: z.string().optional(),    // runs first (e.g., CREATE TABLE + seed rows)
  grading: z.object({
    // The sandbox runs the learner's code, captures output, and compares.
    // Exactly one comparison mode:
    mode: z.enum(["exactOutput", "rowsMatch", "containsAll"]),
    expected: z.string(),                // expected stdout, or JSON of expected rows
  }),
  hints: z.array(z.string()).max(3),     // revealed one at a time on failure
});

/**
 * BRICK 3: CONCEPT DIAGRAM
 * A node-and-arrow picture (e.g., two tables joined on a key).
 * PLAIN ENGLISH: "boxes and arrows the learner can look at."
 * Nodes/edges are DATA — your one pre-built diagram component draws
 * them. The model never emits SVG or JSX, just the graph.
 */
export const ConceptDiagramBlock = z.object({
  type: z.literal("conceptDiagram"),
  caption: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    detail: z.string().optional(),       // shown on hover/tap
  })).min(2).max(10),
  edges: z.array(z.object({
    from: z.string(),                    // must reference a node id
    to: z.string(),
    label: z.string().optional(),        // e.g., "customer_id"
  })).max(15),
});

/**
 * BRICK 4: PARAMETER SLIDER
 * A live playground: learner drags a slider, a value changes inside a
 * code template, the code re-runs (same execution path as grading),
 * results update on screen.
 * PLAIN ENGLISH: "what happens to the result if I change THIS number?"
 * The `{{value}}` token in the template is replaced by the slider.
 */
export const ParameterSliderBlock = z.object({
  type: z.literal("parameterSlider"),
  prompt: z.string(),
  language: z.enum(["sql", "python"]),
  codeTemplate: z.string().includes("{{value}}"), // must contain the token
  setupScript: z.string().optional(),
  slider: z.object({
    label: z.string(),                   // e.g., "LIMIT"
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    initial: z.number(),
  }),
});

/**
 * BRICK 5: DRAG MATCH
 * Match items in column A to column B (term → definition,
 * SQL clause → what it does, etc.).
 * PLAIN ENGLISH: "flashcards, but you drag instead of flip."
 * Grading is deterministic: the pairs are the answer key.
 */
export const DragMatchBlock = z.object({
  type: z.literal("dragMatch"),
  prompt: z.string(),
  pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).min(3).max(6),                     // 3–6 pairs; more is noise
});

/**
 * BRICK 6: QUIZ
 * One multiple-choice question with an explanation of the right answer.
 * PLAIN ENGLISH: the classic. Kept because it's the cheapest way to
 * check understanding between hands-on blocks.
 */
export const QuizBlock = z.object({
  type: z.literal("quiz"),
  question: z.string(),
  choices: z.array(z.string()).min(2).max(4),
  answerIndex: z.number().int().min(0),  // renderer verifies < choices.length
  explanation: z.string(),               // shown AFTER answering, right or wrong
});

/**
 * BRICK 7: REVEAL SEQUENCE
 * A concept broken into steps the learner clicks through one at a time
 * (e.g., how a JOIN executes: scan → match → combine → filter).
 * PLAIN ENGLISH: "a slideshow of 3–6 tiny steps, learner controls pace."
 */
export const RevealSequenceBlock = z.object({
  type: z.literal("revealSequence"),
  title: z.string(),
  steps: z.array(z.object({
    heading: z.string(),
    body: z.string().max(500),
    code: z.string().optional(),         // optional code snippet per step
  })).min(2).max(6),
});

/* ─────────────────────────────────────────────────────────────
 * THE BLOCK UNION
 * "A block is exactly one of the 7 bricks — nothing else exists."
 * The `type` field is the discriminator: one field tells the
 * renderer everything about which component to mount.
 * ──────────────────────────────────────────────────────────── */
export const Block = z.discriminatedUnion("type", [
  ExplainBlock,
  CodeExerciseBlock,
  ConceptDiagramBlock,
  ParameterSliderBlock,
  DragMatchBlock,
  QuizBlock,
  RevealSequenceBlock,
]);

/* ─────────────────────────────────────────────────────────────
 * THE MODULE — one screen of learning
 * PLAIN ENGLISH: a module = one concept, taught as an ordered stack
 * of 2–6 bricks, plus instructions for what to do if the learner
 * fails. The tutor emits ONE of these per lesson beat.
 * ──────────────────────────────────────────────────────────── */
export const LearningModule = z.object({
  id: z.string(),                        // stable id, e.g., "sql-inner-join-01"
  concept: z.string(),                   // the ONE thing this teaches
  title: z.string(),
  difficulty: Difficulty,
  modality: Modality,                    // the current teaching flavor

  // The actual content: an ordered stack of bricks.
  // min(1), not min(2): the emergency safeFallback() module is a single
  // explain block, and the fallback must satisfy its own schema.
  // (Bug found by Codex during the Day 1 spike, 7/16.)
  blocks: z.array(Block).min(1).max(6),

  // Pass/fail rule for the whole module.
  // PLAIN ENGLISH: "how many of the gradeable bricks (codeExercise,
  // dragMatch, quiz) must the learner get right to move on?"
  mastery: z.object({
    required: z.number().int().min(1),   // e.g., 2
    outOf: z.number().int().min(1),      // e.g., 3 gradeable blocks
  }),

  // THE ADAPTIVITY CONTRACT — the demo's second beat lives here.
  // PLAIN ENGLISH: "if the learner fails, don't repeat yourself louder.
  // Rebuild this concept in a different flavor." The tutor reads this,
  // regenerates the module in `switchToModality`, and MUST fold the
  // learner's actual mistake into the new version (e.g., their failed
  // query becomes the starter code of the retry exercise).
  onFailure: z.object({
    switchToModality: Modality,          // must differ from `modality` above
    carryForwardMistake: z.boolean(),    // true = embed their wrong answer
    note: z.string().optional(),         // tutor's private reasoning, logged
  }),
});

export type LearningModuleT = z.infer<typeof LearningModule>;

/* ─────────────────────────────────────────────────────────────
 * VALIDATION + FALLBACK — the "nothing breaks on camera" rule
 * PLAIN ENGLISH:
 *   Primary enforcement is the eve tool boundary: this schema is the
 *   render_module tool's inputSchema, so invalid modules are rejected
 *   before they exist and the model self-corrects.
 *   These two helpers are the FRONTEND's belt-and-suspenders:
 *   1. Event arrives → parseModule(payload) re-checks it
 *   2. Somehow invalid anyway → render safeFallback() so the screen
 *      always shows a plain explanation instead of an error.
 * ──────────────────────────────────────────────────────────── */
export function parseModule(raw: unknown):
  | { ok: true; module: LearningModuleT }
  | { ok: false; error: string } {
  const result = LearningModule.safeParse(raw);
  return result.success
    ? { ok: true, module: result.data }
    : { ok: false, error: result.error.message };
}

export function safeFallback(concept: string, markdown: string): LearningModuleT {
  return {
    id: `fallback-${Date.now()}`,
    concept,
    title: concept,
    difficulty: "intro",
    modality: "narrative",
    blocks: [{ type: "explain", markdown }],
    mastery: { required: 1, outOf: 1 },
    onFailure: { switchToModality: "hands-on", carryForwardMistake: false },
  };
}

/* ─────────────────────────────────────────────────────────────
 * EXAMPLE — what GPT-5.6 actually emits (SQL INNER JOIN, hands-on)
 * Use this exact object as the hardcoded payload for the Day 1
 * streaming spike, so the pipe test uses a REAL module.
 * ──────────────────────────────────────────────────────────── */
export const EXAMPLE_MODULE: LearningModuleT = {
  id: "sql-inner-join-01",
  concept: "INNER JOIN",
  title: "Connecting two tables with INNER JOIN",
  difficulty: "core",
  modality: "hands-on",
  blocks: [
    {
      type: "explain",
      markdown:
        "You have **customers** in one table and **orders** in another. " +
        "`INNER JOIN` stitches them together using a shared column — " +
        "here, `customer_id`. Only rows that match in BOTH tables survive.",
    },
    {
      type: "conceptDiagram",
      caption: "orders.customer_id points at customers.id",
      nodes: [
        { id: "customers", label: "customers", detail: "id, name, city" },
        { id: "orders", label: "orders", detail: "id, customer_id, total" },
      ],
      edges: [{ from: "orders", to: "customers", label: "customer_id → id" }],
    },
    {
      type: "codeExercise",
      prompt:
        "Finish the query: list each customer's name next to their order total.",
      language: "sql",
      starterCode:
        "SELECT customers.name, orders.total\nFROM orders\n-- your JOIN here",
      setupScript:
        "CREATE TABLE customers (id INT, name TEXT, city TEXT);" +
        "CREATE TABLE orders (id INT, customer_id INT, total INT);" +
        "INSERT INTO customers VALUES (1,'Ada','Milwaukee'),(2,'Sun','Chicago');" +
        "INSERT INTO orders VALUES (10,1,50),(11,2,75),(12,1,20);",
      grading: {
        mode: "rowsMatch",
        expected: '[["Ada",50],["Sun",75],["Ada",20]]',
      },
      hints: [
        "The pattern is: INNER JOIN <table> ON <left col> = <right col>",
        "Which column in orders points at customers?",
        "INNER JOIN customers ON orders.customer_id = customers.id",
      ],
    },
  ],
  mastery: { required: 1, outOf: 1 },
  onFailure: {
    switchToModality: "interactive", // fail → rebuild as a dragMatch drill
    carryForwardMistake: true,       // their broken JOIN becomes the example
  },
};
