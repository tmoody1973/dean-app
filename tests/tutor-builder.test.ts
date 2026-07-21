import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// prettier-ignore
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { createTutorBlueprint, recommendTutorTrack } from "../lib/tutor-builder.ts";

test("recommends the closest verified tutor path from a plain-English goal", () => {
  assert.equal(
    recommendTutorTrack(
      "Help me turn campaign data into a budget recommendation",
      "I know spreadsheets but not SQL",
    ),
    "data-to-decision",
  );
  assert.equal(
    recommendTutorTrack(
      "Help me build a small script for weekly reporting",
      "I want Codex to make the tool",
    ),
    "build-work-tool-codex",
  );
  assert.equal(
    recommendTutorTrack(
      "Help me write an executive update for a VP",
      "The audience needs the tradeoff fast",
    ),
    "executive-communication",
  );
});

test("creates a launchable tutor blueprint within the approved track contract", () => {
  const blueprint = createTutorBlueprint({
    goal: "Help me automate a weekly campaign report",
    workContext: "Marketing analyst, comfortable with spreadsheets",
  });

  assert.equal(blueprint.trackId, "build-work-tool-codex");
  assert.match(blueprint.name, /^Work Tool Tutor:/);
  assert.equal(blueprint.steps.length, 4);
  assert.ok(
    blueprint.launchMessage.includes(
      "Track selected: Build a Work Tool with Codex.",
    ),
  );
  assert.ok(
    blueprint.launchMessage.includes(
      "Use this brief as learner context while staying inside the selected Build Week track",
    ),
  );
});

test("manual template choice overrides automatic routing", () => {
  const blueprint = createTutorBlueprint({
    goal: "Prepare a board-level recommendation from campaign performance",
    trackId: "data-to-decision",
    workContext: "The learner wants a checked path through evidence.",
  });

  assert.equal(blueprint.trackId, "data-to-decision");
  assert.equal(blueprint.verificationLabel, "Machine and structural checks");
  assert.ok(
    blueprint.steps.some((step) =>
      step.title.toLowerCase().includes("decision"),
    ),
  );
});
