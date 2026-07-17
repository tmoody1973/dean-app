import type { TrackId } from "@/lib/track-spec";

export type WorkspaceWrite = {
  readonly content: string;
  readonly messageIndex: number;
  readonly path: string;
};

export type LessonDiffLine = {
  readonly kind: "added" | "removed" | "unchanged";
  readonly text: string;
};

export type AdaptationDisplay = {
  readonly afterModality: string | null;
  readonly beforeModality: string | null;
  readonly caption: string;
  readonly diff: readonly LessonDiffLine[];
  readonly messageIndex: number;
};

export type CurriculumRouteItem = {
  readonly description: string;
  readonly state: "active" | "done" | "upcoming";
  readonly title: string;
};

export type DemoDisplay = {
  readonly adaptation: AdaptationDisplay | null;
  readonly birthMessageIndex: number | null;
  readonly birthWrites: readonly WorkspaceWrite[];
  readonly routeItems: readonly CurriculumRouteItem[];
  readonly selectedTrackId: TrackId | null;
};

const MAX_BIRTH_WRITES = 7;

const ORIGINAL_LESSON_PATH = "/workspace/revisions/02-sql-retrieval/original.md";
const ADAPTED_LESSON_PATH = "/workspace/revisions/02-sql-retrieval/adapted.md";

export function createDemoDisplay(messages: readonly unknown[]): DemoDisplay {
  const writes = collectWorkspaceWrites(messages);
  const birthWrites = writes.slice(0, MAX_BIRTH_WRITES);
  const selectedTrackId = findSelectedTrack(messages);

  return {
    adaptation: createAdaptationDisplay(writes),
    birthMessageIndex: birthWrites[0]?.messageIndex ?? null,
    birthWrites,
    routeItems: createCurriculumRoute(writes, selectedTrackId),
    selectedTrackId,
  };
}

export function collectWorkspaceWrites(messages: readonly unknown[]): readonly WorkspaceWrite[] {
  const writes: WorkspaceWrite[] = [];

  messages.forEach((message, messageIndex) => {
    if (!isRecord(message) || !Array.isArray(message.parts)) return;

    message.parts.forEach((part) => {
      if (!isRecord(part) || part.type !== "dynamic-tool" || part.toolName !== "write_file") return;
      if (!isRecord(part.input)) return;

      const path = part.input.filePath;
      const content = part.input.content;
      if (typeof path !== "string" || typeof content !== "string" || !isSafeWorkspacePath(path)) return;

      writes.push({ content, messageIndex, path });
    });
  });

  return writes;
}

export function createAdaptationDisplay(
  writes: readonly WorkspaceWrite[],
): AdaptationDisplay | null {
  const original = writes.find((write) => write.path === ORIGINAL_LESSON_PATH);
  const adapted = writes.find((write) => write.path === ADAPTED_LESSON_PATH);

  if (!original || !adapted) return null;

  return {
    afterModality: findYamlValue(adapted.content, "modality"),
    beforeModality: findYamlValue(original.content, "modality"),
    caption:
      findRevisionCaption(adapted.content) ??
      "The retry now teaches from the executed rows, not a repeated explanation.",
    diff: lessonDiff(original.content, adapted.content),
    messageIndex: adapted.messageIndex,
  };
}

export function createCurriculumRoute(
  writes: readonly WorkspaceWrite[],
  selectedTrackId: TrackId | null,
): readonly CurriculumRouteItem[] {
  const current = findLatestCurriculumCurrent(writes);
  const trackId =
    selectedTrackId ??
    findLatestCurriculumTrackId(writes) ??
    inferTrackFromCurrent(current);
  const route = getBaseLearningRoute(trackId);
  if (route.length === 0) return [];

  if (current === "complete") {
    return route.map(({ currentIds: _currentIds, ...item }) => ({
      ...item,
      state: "done",
    }));
  }

  const activeIndex = route.findIndex((item) => item.currentIds.includes(current ?? ""));
  const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return route.map(({ currentIds: _currentIds, ...item }, index) => ({
    ...item,
    state:
      index < resolvedActiveIndex
        ? "done"
        : index === resolvedActiveIndex
          ? "active"
          : "upcoming",
  }));
}

type BaseRouteItem = Omit<CurriculumRouteItem, "state"> & {
  readonly currentIds: readonly string[];
};

function getBaseLearningRoute(
  trackId: TrackId | null,
): readonly BaseRouteItem[] {
  if (trackId === "data-to-decision") {
    return [
      {
        currentIds: ["01-question-framing"],
        description: "Frame the decision and define what evidence matters.",
        title: "Question framing",
      },
      {
        currentIds: ["02-sql-retrieval"],
        description: "Query the campaign data and pass the machine check.",
        title: "SQL retrieval",
      },
      {
        currentIds: ["03-visualization-interpretation"],
        description:
          "Read the result and connect it to a visual recommendation.",
        title: "Visualization interpretation",
      },
      {
        currentIds: ["04-decision-ready-recommendation"],
        description: "Prepare the recommendation structure.",
        title: "Decision-ready recommendation",
      },
      {
        currentIds: ["recommendation-artifact"],
        description: "Save the director-ready recommendation artifact.",
        title: "Recommendation artifact",
      },
    ];
  }

  if (trackId === "build-work-tool-codex") {
    return [
      {
        currentIds: ["codex-work-tool-01"],
        description: "Define, build, and verify the smallest useful work tool.",
        title: "Implementation and tests",
      },
      {
        currentIds: ["learner-explanation"],
        description: "Explain what the tool handles and what proves it works.",
        title: "Learner explanation",
      },
    ];
  }

  if (trackId === "executive-communication") {
    return [
      {
        currentIds: ["executive-update-01"],
        description: "Review the scenario and visible leadership rubric.",
        title: "Scenario and rubric",
      },
      {
        currentIds: ["awaiting-attempt-1"],
        description: "Draft the first leadership recommendation in chat.",
        title: "First recommendation",
      },
      {
        currentIds: ["awaiting-revision-2"],
        description: "Revise the recommendation using the same scenario facts.",
        title: "Rubric-guided revision",
      },
      {
        currentIds: ["executive-comparison-01"],
        description: "Compare observable wording changes between both drafts.",
        title: "Revision comparison",
      },
    ];
  }

  return [
    {
      currentIds: [""],
      description: "Dean turns your goal into a visible route.",
      title: "Tutor route",
    },
  ];
}

function findLatestCurriculumCurrent(
  writes: readonly WorkspaceWrite[],
): string | null {
  for (let index = writes.length - 1; index >= 0; index -= 1) {
    const write = writes[index];
    if (write.path === "/workspace/curriculum.md") {
      return findYamlValue(write.content, "current");
    }
  }

  return null;
}

function findLatestCurriculumTrackId(
  writes: readonly WorkspaceWrite[],
): TrackId | null {
  for (let index = writes.length - 1; index >= 0; index -= 1) {
    const write = writes[index];
    if (write.path !== "/workspace/curriculum.md") continue;

    const trackId = findYamlValue(write.content, "track_id");
    if (isTrackId(trackId)) return trackId;
  }

  return null;
}

function inferTrackFromCurrent(current: string | null): TrackId | null {
  if (current === null) return null;
  if (
    [
      "01-question-framing",
      "02-sql-retrieval",
      "03-visualization-interpretation",
      "04-decision-ready-recommendation",
      "recommendation-artifact",
    ].includes(current)
  ) {
    return "data-to-decision";
  }
  if (["codex-work-tool-01", "learner-explanation"].includes(current)) {
    return "build-work-tool-codex";
  }
  if (
    [
      "executive-update-01",
      "awaiting-attempt-1",
      "awaiting-revision-2",
      "executive-comparison-01",
    ].includes(current)
  ) {
    return "executive-communication";
  }

  return null;
}

function isTrackId(value: string | null): value is TrackId {
  return (
    value === "data-to-decision" ||
    value === "build-work-tool-codex" ||
    value === "executive-communication"
  );
}

export function lessonDiff(before: string, after: string): readonly LessonDiffLine[] {
  const oldLines = normalizeLines(before);
  const newLines = normalizeLines(after);
  const matrix = Array.from({ length: oldLines.length + 1 }, () =>
    new Uint16Array(newLines.length + 1),
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      matrix[oldIndex][newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? matrix[oldIndex + 1][newIndex + 1] + 1
          : Math.max(matrix[oldIndex + 1][newIndex], matrix[oldIndex][newIndex + 1]);
    }
  }

  const diff: LessonDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      if (oldLines[oldIndex] !== undefined) {
        diff.push({ kind: "unchanged", text: oldLines[oldIndex] });
      }
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (
      newIndex < newLines.length &&
      (oldIndex === oldLines.length || matrix[oldIndex][newIndex + 1] > matrix[oldIndex + 1][newIndex])
    ) {
      diff.push({ kind: "added", text: newLines[newIndex] });
      newIndex += 1;
      continue;
    }

    if (oldIndex < oldLines.length) {
      diff.push({ kind: "removed", text: oldLines[oldIndex] });
      oldIndex += 1;
    }
  }

  return compactDiff(diff);
}

function compactDiff(diff: readonly LessonDiffLine[]): readonly LessonDiffLine[] {
  const changed = diff
    .map((line, index) => (line.kind === "unchanged" ? -1 : index))
    .filter((index) => index >= 0);
  if (changed.length === 0) return diff.slice(0, 12);

  const start = Math.max(0, changed[0] - 2);
  const end = Math.min(diff.length, changed.at(-1)! + 3);
  const excerpt = diff.slice(start, end);
  return excerpt.length > 22 ? excerpt.slice(0, 22) : excerpt;
}

function findSelectedTrack(messages: readonly unknown[]): TrackId | null {
  const matches: readonly [TrackId, string][] = [
    ["data-to-decision", "Track selected: Data to Decision."],
    ["build-work-tool-codex", "Track selected: Build a Work Tool with Codex."],
    ["executive-communication", "Track selected: Executive Communication."],
  ];

  for (const message of messages) {
    if (!isRecord(message) || !Array.isArray(message.parts)) continue;
    for (const part of message.parts) {
      if (!isRecord(part) || part.type !== "text") continue;
      const partText = part.text;
      if (typeof partText !== "string") continue;
      const match = matches.find(([, text]) => partText.includes(text));
      if (match) return match[0];
    }
  }

  return null;
}

function findYamlValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*([^\\n#]+)`, "m"));
  return match?.[1]?.trim() ?? null;
}

function findRevisionCaption(content: string): string | null {
  const match = content.match(/^\s*(revision 1[^\n]*)$/im);
  return match?.[1]?.trim() ?? null;
}

function normalizeLines(content: string): readonly string[] {
  return content.replaceAll("\r\n", "\n").split("\n");
}

function isSafeWorkspacePath(value: string): boolean {
  return value.startsWith("/workspace/") && !/[\\\u0000-\u001f\u007f]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
