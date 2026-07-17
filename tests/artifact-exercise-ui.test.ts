import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/module/blocks/CodeExerciseBlock.tsx", import.meta.url),
  "utf8",
);

function section(start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

test("only the canonical TypeScript sentinel routes to artifact verification", () => {
  const routing = section(
    "export function CodeExerciseBlock",
    "function SqlCodeExercise",
  );

  assert.match(routing, /block\.language === "sql"/);
  assert.match(routing, /block\.language === "typescript"/);
  assert.match(routing, /block\.grading\.mode === "exactOutput"/);
  assert.match(routing, /block\.grading\.expected === ARTIFACT_PROFILE_ID/);
  assert.match(routing, /return <ArtifactCodeExercise/);
  assert.match(routing, /return <UnverifiedCodeExercise/);
  assert.equal(source.match(/const ARTIFACT_PROFILE_ID = "codex-node-tool-v1"/g)?.length, 1);
});

test("the browser constructs one fixed artifact request without authority fields", () => {
  const artifact = section(
    "function ArtifactCodeExercise",
    "function UnverifiedCodeExercise",
  );
  const submission = artifact.match(
    /const submission = \{([\s\S]*?)\} satisfies GradeExerciseInput;/,
  )?.[1];

  assert.ok(submission, "missing fixed artifact submission");
  assert.match(submission, /attemptId: crypto\.randomUUID\(\)/);
  assert.match(submission, /blockIndex/);
  assert.match(submission, /kind: "artifact"/);
  assert.match(submission, /moduleId/);
  assert.match(submission, /profileId: ARTIFACT_PROFILE_ID/);
  assert.doesNotMatch(submission, /\b(?:path|command|passed)\b/);
  assert.doesNotMatch(submission, /block\.grading|starterCode/);
});

test("the card exposes fixed criteria and unlocks only from an authoritative pass", () => {
  const artifact = section(
    "function ArtifactCodeExercise",
    "function UnverifiedCodeExercise",
  );

  for (const criterion of [
    "README marker",
    "Exact prepared test file",
    "Node syntax",
    "Node behavior tests",
  ]) {
    assert.match(source, new RegExp(criterion));
  }

  assert.match(artifact, /findExactGradeAttempt\(gradeAttempts, activeAttempt\)/);
  assert.match(artifact, /result\?\.error === null && result\.passed/);
  assert.match(artifact, /onCheckedChange\(verifiedPass === true\)/);
  assert.match(artifact, /Run artifact checks/);
  assert.match(artifact, /Try checks again/);
  assert.match(artifact, /Running the fixed artifact checks/);
  assert.match(artifact, /Every fixed artifact criterion passed/);
  assert.match(artifact, /did not satisfy every fixed criterion/);
  assert.match(artifact, /protocolError/);
  assert.match(artifact, /No matching artifact result was returned/);
  assert.match(artifact, /MISSING_FILE/);
  assert.match(artifact, /CRITERIA_MISMATCH/);
  assert.match(artifact, /NONZERO_EXIT/);
  assert.doesNotMatch(artifact, /actualOutput|expectedOutput|<textarea/);
});
