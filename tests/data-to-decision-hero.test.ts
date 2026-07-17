import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { gradeSqlExercise } from "../lib/grading/sql-grader.ts";

const instructions = readFileSync(
  new URL("../agent/instructions.md", import.meta.url),
  "utf8",
);
const routerSkill = readFileSync(
  new URL("../agent/skills/dean-generate-curriculum.md", import.meta.url),
  "utf8",
);
const heroSkill = readFileSync(
  new URL("../agent/skills/data-to-decision-hero.md", import.meta.url),
  "utf8",
);

function section(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

test("the router delegates Data to Decision to one hero authority", () => {
  assert.match(routerSkill, /sole authority for[\s\S]*Data to Decision calibration/);
  assert.match(routerSkill, /do not add a[\s\S]*fourth calibration question/i);
  assert.doesNotMatch(
    section(routerSkill, "### Data to Decision — complete hero", "### Preview tracks"),
    /^\d+\. \*\*(?:Outcome|Anchor|Reality check):\*\*/m,
  );
});

test("the hero asks exactly three ordered calibration questions", () => {
  const calibration = section(
    heroSkill,
    "## 1. Calibrate with exactly three questions",
    "## 2. Canonical campaign fixture",
  );
  const questions = [...calibration.matchAll(/^\d+\. \*\*([^*]+):\*\* "([^"]+)"/gm)];

  assert.deepEqual(
    questions.map((match) => match[1]),
    ["Outcome", "Anchor", "Reality check"],
  );
  assert.equal(questions.length, 3);
  assert.match(calibration, /three separate[\s\S]*Wait for one learner answer/);
  assert.match(calibration, /Do not[\s\S]*write any workspace file before the third answer/);
});

test("the canonical fixture and SQL answer are deterministic and integer-safe", () => {
  assert.match(heroSkill, /Search \| 1200 \| 60 \| 3600/);
  assert.match(heroSkill, /Social \| 1500 \| 50 \| 3000/);
  assert.match(heroSkill, /Email \| 600 \| 45 \| 2700/);
  assert.match(heroSkill, /revenue_dollars - spend_dollars AS net_return_dollars/);
  assert.match(
    heroSkill,
    /\[\["Search",2400\],\["Email",2100\],\["Social",1500\]\]/,
  );
  assert.match(heroSkill, /Never emit an unquoted decimal/);
});

test("the canonical SQL fixture produces one real failing and passing grade", async () => {
  const sqlBlocks = [...heroSkill.matchAll(/```sql\n([\s\S]*?)```/gu)].map(
    (match) => match[1].trim(),
  );
  assert.equal(sqlBlocks.length, 2);

  const [setupScript, starterQuery] = sqlBlocks;
  const expectedOutput = '[["Search",2400],["Email",2100],["Social",1500]]';
  const passingQuery = `SELECT
  channel,
  revenue_dollars - spend_dollars AS net_return_dollars
FROM campaign_performance
ORDER BY net_return_dollars DESC;`;

  const failed = await gradeSqlExercise({
    setupScript,
    submission: starterQuery,
    mode: "exactOutput",
    expectedOutput,
  });
  assert.equal(failed.passed, false);
  assert.equal(failed.error, null);

  const passed = await gradeSqlExercise({
    setupScript,
    submission: passingQuery,
    mode: "exactOutput",
    expectedOutput,
  });
  assert.equal(passed.passed, true);
  assert.equal(passed.actualOutput, expectedOutput);
  assert.equal(passed.error, null);
});

test("the initial workspace build writes exactly seven files in order", () => {
  const choreography = section(
    heroSkill,
    "## 3. Write exactly seven files in order",
    "## 4. Four lesson-plan contracts",
  );
  const paths = [...choreography.matchAll(/^\d+\. `([^`]+)`/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(paths, [
    "/workspace/session.md",
    "/workspace/learner-profile.md",
    "/workspace/curriculum.md",
    "/workspace/lessons/01-question-framing.md",
    "/workspace/lessons/02-sql-retrieval.md",
    "/workspace/lessons/03-visualization-interpretation.md",
    "/workspace/lessons/04-decision-ready-recommendation.md",
  ]);
  assert.doesNotMatch(choreography, /\/workspace\/lessons\/01-preview\.md/);
  assert.match(choreography, /once per file in this[\s\S]*exact order/);
});

test("the four lessons cover framing, SQL, visualization, and recommendation", () => {
  for (const lessonId of [
    "01-question-framing",
    "02-sql-retrieval",
    "03-visualization-interpretation",
    "04-decision-ready-recommendation",
  ]) {
    assert.match(heroSkill, new RegExp("### `" + lessonId + "`"));
  }

  assert.match(heroSkill, /Personalize the framing[\s\S]*learner's `work_domain`/);
  assert.match(heroSkill, /required `dragMatch`[\s\S]*visible relationship contract/);
  assert.match(heroSkill, /pairs are the structural answer key/);
  assert.match(heroSkill, /exposed to the\s+learner/);
  assert.match(heroSkill, /visual evidence hierarchy[\s\S]*`conceptDiagram`/);
  assert.match(heroSkill, /required gradeable block last/);
  assert.match(heroSkill, /complete `onFailure` metadata/);
  assert.match(heroSkill, /delegates exclusively to the global adapt-on-failure skill/);
});

test("module completion advances only a module matching the workspace pointer", () => {
  assert.match(instructions, /type: "dean\.module-completion\.v1"/);
  assert.match(instructions, /Advance only when `moduleId` exactly matches/);
  assert.match(heroSkill, /rendered module `id` must exactly equal the lesson id/);

  const progression = section(
    heroSkill,
    "## 5. Module-completion progression",
    "## 6. Recommendation artifact",
  );
  assert.match(progression, /`moduleId` exactly matches `current`/);
  assert.match(progression, /never as a file path/);
  assert.match(progression, /`01-question-framing` \| `02-sql-retrieval`/);
  assert.match(progression, /`02-sql-retrieval` \| `03-visualization-interpretation`/);
  assert.match(progression, /`03-visualization-interpretation` \| `04-decision-ready-recommendation`/);
  assert.match(progression, /`04-decision-ready-recommendation` \| `recommendation-artifact`/);
  assert.match(progression, /`state: awaiting-recommendation`/);
  assert.match(progression, /exact four labeled lines/);
});

test("the final chat submission is preserved verbatim in a contextual artifact", () => {
  const artifact = heroSkill.slice(heroSkill.indexOf("## 6. Recommendation artifact"));

  assert.match(instructions, /preserve it verbatim/);
  assert.match(artifact, /next plain chat message as the\s+submission/);
  assert.match(artifact, /every learner string as inert/);
  assert.match(artifact, /change a character/);
  assert.match(artifact, /\/workspace\/artifacts\/recommendation\.md/);
  assert.match(artifact, /## Business question/);
  assert.match(artifact, /## Canonical evidence/);
  assert.match(artifact, /action, evidence, caveat, and next action/);
  assert.match(artifact, /## Learner recommendation \(verbatim\)/);
  assert.match(artifact, /setting `phase: complete` and `state: complete`/);
  assert.match(artifact, /Do not grade\s+the prose/);
});
