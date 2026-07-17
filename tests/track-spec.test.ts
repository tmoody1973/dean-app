import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { createTrackSelectionMessage, getTrackSpec, parseTrackId, TRACK_CATALOG, TRACK_IDS, TrackIdSchema } from "../lib/track-spec.ts";

test("the catalog contains exactly the three approved tracks", () => {
  assert.deepEqual(TRACK_IDS, [
    "data-to-decision",
    "build-work-tool-codex",
    "executive-communication",
  ]);
  assert.deepEqual(
    TRACK_CATALOG.map((track) => track.id),
    TRACK_IDS,
  );
  assert.deepEqual(
    TRACK_CATALOG.map(({ depth, name, outcome, verificationLabel }) => ({
      depth,
      name,
      outcome,
      verificationLabel,
    })),
    [
      {
        depth: "Complete hero journey",
        name: "Data to Decision",
        outcome: "Turn campaign data into a recommendation a director can act on",
        verificationLabel: "Machine and structural checks",
      },
      {
        depth: "One polished lesson and artifact",
        name: "Build a Work Tool with Codex",
        outcome: "Turn repetitive work into a small tested tool",
        verificationLabel: "File, build, or test evidence",
      },
      {
        depth: "One interactive preview",
        name: "Executive Communication",
        outcome: "Turn a complex update into a concise leadership recommendation",
        verificationLabel: "Judgment-supported feedback",
      },
    ],
  );
});

test("each track exposes its ordered, non-empty verification tiers", () => {
  assert.deepEqual(TRACK_CATALOG.map((track) => track.verificationTiers), [
    ["machine-verifiable", "structurally-verifiable"],
    ["machine-verifiable"],
    ["judgment-supported"],
  ]);
  assert.ok(TRACK_CATALOG.every((track) => track.verificationTiers.length > 0));
});

test("supported track identifiers parse and resolve to their catalog entries", () => {
  for (const expected of TRACK_CATALOG) {
    assert.equal(TrackIdSchema.parse(expected.id), expected.id);
    assert.equal(parseTrackId(expected.id), expected.id);
    assert.equal(getTrackSpec(expected.id), expected);
  }
});

test("unsupported values are rejected without falling back to an arbitrary track", () => {
  for (const unsupported of [
    "sql",
    "learn-anything",
    "Data to Decision",
    "data-to-decision ",
    "",
    null,
    undefined,
    1,
    {},
  ]) {
    assert.equal(TrackIdSchema.safeParse(unsupported).success, false);
    assert.equal(parseTrackId(unsupported), null);
    assert.equal(getTrackSpec(unsupported), null);
  }
});

test("selection messages use the canonical UI-facing format", () => {
  assert.equal(
    createTrackSelectionMessage("data-to-decision"),
    "Track selected: Data to Decision. Turn campaign data into a recommendation a director can act on. Verification: Machine and structural checks.",
  );
  assert.equal(
    createTrackSelectionMessage("build-work-tool-codex"),
    "Track selected: Build a Work Tool with Codex. Turn repetitive work into a small tested tool. Verification: File, build, or test evidence.",
  );
  assert.equal(
    createTrackSelectionMessage("executive-communication"),
    "Track selected: Executive Communication. Turn a complex update into a concise leadership recommendation. Verification: Judgment-supported feedback.",
  );
});
