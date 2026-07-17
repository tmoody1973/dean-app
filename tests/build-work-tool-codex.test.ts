import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { CODEX_NODE_TOOL_TEST_SOURCE } from "../lib/grading/artifact-grader.ts";

const instructions = readFileSync(
  new URL("../agent/instructions.md", import.meta.url),
  "utf8",
);
const routerSkill = readFileSync(
  new URL("../agent/skills/dean-generate-curriculum.md", import.meta.url),
  "utf8",
);
const codexSkill = readFileSync(
  new URL("../agent/skills/build-work-tool-codex.md", import.meta.url),
  "utf8",
);

function section(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

test("the router delegates the Codex track to one bounded authority", () => {
  const route = section(
    routerSkill,
    "### Build a Work Tool with Codex — complete secondary-track lesson",
    "### Executive Communication preview",
  );

  assert.match(route, /sole authority/);
  assert.match(route, /build-work-tool-codex skill/);
  assert.match(route, /do not add a fourth calibration question/);
  assert.doesNotMatch(route, /^\d+\. \*\*/m);
});

test("the Codex skill asks exactly three ordered calibration questions", () => {
  const calibration = section(
    codexSkill,
    "## 1. Calibrate with exactly three questions",
    "## 2. Prepared artifact boundary",
  );
  const questions = [...calibration.matchAll(/^\d+\. \*\*([^*]+):\*\* "([^"]+)"/gm)];

  assert.deepEqual(
    questions.map((match) => match[1]),
    ["Repetitive task", "Existing workflow", "Desired result"],
  );
  assert.equal(questions.length, 3);
  assert.match(calibration, /three separate messages/);
  assert.match(calibration, /Preserve all three answers verbatim/);
  assert.match(calibration, /inert data/);
});

test("the initial compile writes exactly seven bounded files in order", () => {
  const choreography = section(
    codexSkill,
    "## 3. Write exactly seven initial files",
    "## 4. One polished lesson",
  );
  const paths = [...choreography.matchAll(/^\d+\. `([^`]+)`/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(paths, [
    "/workspace/session.md",
    "/workspace/learner-profile.md",
    "/workspace/curriculum.md",
    "/workspace/lessons/01-smallest-useful-build.md",
    "/workspace/artifacts/codex-node-tool-v1/README.md",
    "/workspace/artifacts/codex-node-tool-v1/src/index.mjs",
    "/workspace/artifacts/codex-node-tool-v1/tests/index.test.mjs",
  ]);
  assert.match(choreography, /Do not\s+write `01-preview\.md`/);
  assert.match(choreography, /course preview/);
  assert.match(choreography, /List exactly one active lesson/);
});

test("the prepared source and behavioral tests stay synchronized with the verifier", () => {
  const codeBlocks = [...codexSkill.matchAll(/```javascript\n([\s\S]*?)```/gu)].map(
    (match) => match[1],
  );

  assert.equal(codeBlocks.length, 2);
  const [source, tests] = codeBlocks;
  assert.match(source, /export function formatStatus\(items\)/);
  assert.match(source, /Completed: \$\{completedCount\}\/\$\{items\.length\}/);
  assert.match(source, /Blocked: \$\{blockedTasks\.length === 0/);
  assert.equal(tests, CODEX_NODE_TOOL_TEST_SOURCE);
});

test("one polished module teaches IAV and ends in the fixed artifact check", () => {
  const lesson = section(
    codexSkill,
    "## 4. One polished lesson",
    "## 5. Completion and learner explanation",
  );

  assert.match(lesson, /id `codex-work-tool-01`/);
  assert.match(lesson, /`revealSequence`/);
  for (const concept of [
    "`Intent`",
    "`Acceptance criteria`",
    "`Verification`",
    "`Smallest useful build`",
  ]) {
    assert.match(lesson, new RegExp(concept));
  }
  assert.match(lesson, /`conceptDiagram`/);
  assert.match(lesson, /final `codeExercise`/);
  assert.match(lesson, /`language: typescript`/);
  assert.match(lesson, /`grading\.mode: exactOutput`/);
  assert.match(lesson, /`grading\.expected: codex-node-tool-v1`/);
  assert.match(lesson, /artifact block must remain\s+last/);
  assert.match(lesson, /required: 1/);
  assert.match(lesson, /outOf: 1/);
});

test("completion is pointer-checked and the explanation is preserved verbatim", () => {
  const progression = codexSkill.slice(
    codexSkill.indexOf("## 5. Completion and learner explanation"),
  );

  assert.match(instructions, /build-work-tool-codex skill/);
  assert.match(instructions, /current: learner-explanation/);
  assert.match(progression, /`moduleId` is exactly `codex-work-tool-01`/);
  assert.match(progression, /exactly equals\s+`current`/);
  assert.match(progression, /Change: \.\.\./);
  assert.match(progression, /Verification: \.\.\./);
  assert.match(progression, /LEARNER-EXPLANATION\.md/);
  assert.match(progression, /change a character/);
  assert.match(progression, /Learner explanation \(verbatim\)/);
  assert.match(progression, /Do not grade the explanation/);
  assert.match(progression, /phase: complete/);
  assert.match(progression, /state: complete/);
});

test("the track cannot escape its prepared artifact boundary", () => {
  assert.match(codexSkill, /Never write an artifact outside this directory/);
  assert.match(codexSkill, /Never accept a learner-supplied\s+file path or command/);
  assert.match(codexSkill, /not a general\s+Codex curriculum/);
  assert.match(codexSkill, /or permission to inspect or modify a\s+learner repository/);
  assert.match(codexSkill, /a deployment workflow/);
});
