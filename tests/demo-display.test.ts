import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { createDemoDisplay, lessonDiff } from "../lib/demo-display.ts";

test("the demo display derives a safe curriculum-birth tree and selected track", () => {
  const display = createDemoDisplay([
    {
      parts: [
        { text: "Track selected: Data to Decision. Turn campaign data into a recommendation a director can act on.", type: "text" },
        { input: { content: "state: calibrating", filePath: "/workspace/session.md" }, toolName: "write_file", type: "dynamic-tool" },
        { input: { content: "learner: Maya", filePath: "/workspace/learner-profile.md" }, toolName: "write_file", type: "dynamic-tool" },
        { input: { content: "current: 01-question-framing", filePath: "/workspace/curriculum.md" }, toolName: "write_file", type: "dynamic-tool" },
        { input: { content: "id: 01-question-framing", filePath: "/workspace/lessons/01-question-framing.md" }, toolName: "write_file", type: "dynamic-tool" },
      ],
    },
  ]);

  assert.equal(display.selectedTrackId, "data-to-decision");
  assert.deepEqual(display.birthWrites.map((write) => write.path), [
    "/workspace/session.md",
    "/workspace/learner-profile.md",
    "/workspace/curriculum.md",
    "/workspace/lessons/01-question-framing.md",
  ]);
  assert.equal(display.birthMessageIndex, 0);
  assert.deepEqual(display.routeItems.map(({ state, title }) => [title, state]), [
    ["Question framing", "active"],
    ["SQL retrieval", "upcoming"],
    ["Visualization interpretation", "upcoming"],
    ["Decision-ready recommendation", "upcoming"],
    ["Recommendation artifact", "upcoming"],
  ]);
});

test("the demo display advances the visible route from the latest curriculum pointer", () => {
  const display = createDemoDisplay([
    {
      parts: [
        { text: "Track selected: Data to Decision.", type: "text" },
        {
          input: {
            content: "current: 01-question-framing",
            filePath: "/workspace/curriculum.md",
          },
          toolName: "write_file",
          type: "dynamic-tool",
        },
      ],
    },
    {
      parts: [
        {
          input: {
            content: "current: 03-visualization-interpretation",
            filePath: "/workspace/curriculum.md",
          },
          toolName: "write_file",
          type: "dynamic-tool",
        },
      ],
    },
  ]);

  assert.deepEqual(display.routeItems.map(({ state, title }) => [title, state]), [
    ["Question framing", "done"],
    ["SQL retrieval", "done"],
    ["Visualization interpretation", "active"],
    ["Decision-ready recommendation", "upcoming"],
    ["Recommendation artifact", "upcoming"],
  ]);
});

test("the demo display marks a route complete when the curriculum is complete", () => {
  const display = createDemoDisplay([
    {
      parts: [
        {
          input: {
            content: "current: codex-work-tool-01",
            filePath: "/workspace/curriculum.md",
          },
          toolName: "write_file",
          type: "dynamic-tool",
        },
        {
          input: {
            content: "track_id: build-work-tool-codex\ncurrent: complete",
            filePath: "/workspace/curriculum.md",
          },
          toolName: "write_file",
          type: "dynamic-tool",
        },
      ],
    },
  ]);

  assert.deepEqual(display.routeItems.map(({ state, title }) => [title, state]), [
    ["Implementation and tests", "done"],
    ["Learner explanation", "done"],
  ]);
});

test("the adaptation card uses only preserved lesson snapshots and shows additions", () => {
  const display = createDemoDisplay([
    {
      parts: [
        { input: { content: "id: 02-sql-retrieval\nmodality: hands-on\n## Teaching plan\nTry the query.", filePath: "/workspace/revisions/02-sql-retrieval/original.md" }, toolName: "write_file", type: "dynamic-tool" },
        { input: { content: "id: 02-sql-retrieval\nmodality: interactive\n## Evidence-backed diagnosis\nRevenue must subtract spend.\n## Revision log\nrevision 1 — hands-on to interactive; carried forward the authoritative SQL mismatch", filePath: "/workspace/revisions/02-sql-retrieval/adapted.md" }, toolName: "write_file", type: "dynamic-tool" },
      ],
    },
  ]);

  assert.equal(display.adaptation?.beforeModality, "hands-on");
  assert.equal(display.adaptation?.afterModality, "interactive");
  assert.match(display.adaptation?.caption ?? "", /revision 1/);
  assert.ok(display.adaptation?.diff.some((line) => line.kind === "added" && line.text.includes("Evidence-backed")));
});

test("the concise diff retains changed lines with local context", () => {
  const diff = lessonDiff("a\nb\nc\nd", "a\nb\nchanged\nd");
  assert.deepEqual(diff, [
    { kind: "unchanged", text: "a" },
    { kind: "unchanged", text: "b" },
    { kind: "removed", text: "c" },
    { kind: "added", text: "changed" },
    { kind: "unchanged", text: "d" },
  ]);
});
