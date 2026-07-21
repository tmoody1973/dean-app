import {
  createTrackSelectionMessage,
  getTrackSpec,
  type TrackId,
  type VerificationTier,
} from "#lib/track-spec";

export type TutorPlanStep = {
  readonly evidence: string;
  readonly plainEnglish: string;
  readonly title: string;
};

export type TutorBlueprint = {
  readonly fitReason: string;
  readonly goal: string;
  readonly launchMessage: string;
  readonly name: string;
  readonly outcome: string;
  readonly steps: readonly TutorPlanStep[];
  readonly trackId: TrackId;
  readonly verificationLabel: string;
  readonly verificationTiers: readonly VerificationTier[];
  readonly workContext: string;
};

export type TutorBuilderInput = {
  readonly goal: string;
  readonly trackId?: TrackId;
  readonly workContext: string;
};

export function createTutorBlueprint(input: TutorBuilderInput): TutorBlueprint {
  const goal = normalizeInput(input.goal);
  const workContext = normalizeInput(input.workContext);
  const trackId = input.trackId ?? recommendTutorTrack(goal, workContext);
  const track = getTrackSpec(trackId);

  if (track === null) {
    throw new Error(`Unsupported tutor track: ${trackId}`);
  }

  const blueprint = {
    fitReason: getFitReason(trackId, goal, workContext),
    goal,
    name: createTutorName(trackId, goal),
    outcome: track.outcome,
    steps: createPlanSteps(trackId, goal),
    trackId,
    verificationLabel: track.verificationLabel,
    verificationTiers: track.verificationTiers,
    workContext,
  };

  return {
    ...blueprint,
    launchMessage: createTutorLaunchMessage(blueprint),
  };
}

export function recommendTutorTrack(
  goal: string,
  workContext: string,
): TrackId {
  const text = `${goal} ${workContext}`.toLowerCase();

  const scores: Record<TrackId, number> = {
    "build-work-tool-codex": scoreKeywords(text, [
      ["automation", 5],
      ["automate", 5],
      ["code", 2],
      ["codex", 3],
      ["script", 3],
      ["tool", 3],
      ["workflow", 2],
      ["app", 2],
      ["build", 2],
      ["test", 2],
    ]),
    "data-to-decision": scoreKeywords(text, [
      ["data", 2],
      ["sql", 2],
      ["spreadsheet", 2],
      ["dashboard", 2],
      ["campaign", 1],
      ["revenue", 1],
      ["budget", 1],
      ["metric", 1],
      ["report", 1],
      ["analysis", 2],
    ]),
    "executive-communication": scoreKeywords(text, [
      ["executive", 2],
      ["leadership", 2],
      ["stakeholder", 2],
      ["update", 1],
      ["memo", 2],
      ["email", 1],
      ["presentation", 2],
      ["recommendation", 1],
      ["director", 1],
      ["vp", 2],
    ]),
  };

  const ranked = Object.entries(scores).sort(
    ([, left], [, right]) => right - left,
  );
  if ((ranked[0]?.[1] ?? 0) > 0) return ranked[0][0] as TrackId;

  return "data-to-decision";
}

export function createTutorLaunchMessage(
  tutor: Pick<
    TutorBlueprint,
    "goal" | "name" | "steps" | "trackId" | "workContext"
  >,
): string {
  const stepList = tutor.steps
    .map((step, index) => `${index + 1}. ${step.title}: ${step.plainEnglish}`)
    .join("\n");
  const context =
    tutor.workContext.length > 0
      ? tutor.workContext
      : "No extra work context supplied.";

  return `${createTrackSelectionMessage(tutor.trackId)}

Custom tutor brief:
Tutor name: ${tutor.name}
Learner goal: ${tutor.goal}
Work context: ${context}

Planned learning route:
${stepList}

Use this brief as learner context while staying inside the selected Build Week track and its verification boundary.`;
}

function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function scoreKeywords(
  text: string,
  weightedKeywords: readonly (readonly [string, number])[],
): number {
  return weightedKeywords.reduce(
    (score, [keyword, weight]) => score + (text.includes(keyword) ? weight : 0),
    0,
  );
}

function createTutorName(trackId: TrackId, goal: string): string {
  const shortGoal = goal.length > 54 ? `${goal.slice(0, 51).trimEnd()}…` : goal;

  if (trackId === "build-work-tool-codex") {
    return `Work Tool Tutor: ${shortGoal}`;
  }

  if (trackId === "executive-communication") {
    return `Executive Tutor: ${shortGoal}`;
  }

  return `Decision Tutor: ${shortGoal}`;
}

function getFitReason(
  trackId: TrackId,
  goal: string,
  workContext: string,
): string {
  const source = workContext.length > 0 ? `${goal} ${workContext}` : goal;

  if (trackId === "build-work-tool-codex") {
    return `Best fit because the goal sounds like building or automating a concrete work artifact: "${source}".`;
  }

  if (trackId === "executive-communication") {
    return `Best fit because the goal depends on communicating a recommendation clearly to people: "${source}".`;
  }

  return `Best fit because the goal depends on turning evidence into a decision: "${source}".`;
}

function createPlanSteps(
  trackId: TrackId,
  goal: string,
): readonly TutorPlanStep[] {
  if (trackId === "build-work-tool-codex") {
    return [
      {
        evidence: "A short problem statement.",
        plainEnglish: `Name the repetitive work behind "${goal}" and define what a useful first tool must do.`,
        title: "Pick the smallest useful tool",
      },
      {
        evidence: "A bounded input and output contract.",
        plainEnglish:
          "Decide what goes into the tool, what comes out, and what the tool should refuse to do.",
        title: "Set the tool boundary",
      },
      {
        evidence: "A generated artifact plus a fixed verification check.",
        plainEnglish:
          "Build the first version and prove it works with a file, command, or test result.",
        title: "Build and verify",
      },
      {
        evidence: "A learner explanation saved as an artifact.",
        plainEnglish:
          "Explain what changed, what was verified, and what still needs human judgment.",
        title: "Explain the result",
      },
    ];
  }

  if (trackId === "executive-communication") {
    return [
      {
        evidence: "A visible audience and decision frame.",
        plainEnglish: `Turn "${goal}" into one clear decision someone needs to make.`,
        title: "Frame the audience and decision",
      },
      {
        evidence: "A first draft preserved verbatim.",
        plainEnglish:
          "Write the recommendation in plain language before Dean gives feedback.",
        title: "Draft the recommendation",
      },
      {
        evidence: "Rubric-based, judgment-supported feedback.",
        plainEnglish:
          "Compare the draft against a clear rubric without pretending there is one machine-correct answer.",
        title: "Use the leadership rubric",
      },
      {
        evidence: "A before-and-after comparison.",
        plainEnglish: "Revise the message and see exactly what became clearer.",
        title: "Revise and compare",
      },
    ];
  }

  return [
    {
      evidence: "A business question stated in one sentence.",
      plainEnglish: `Turn "${goal}" into a clear decision question before touching the data.`,
      title: "Frame the decision",
    },
    {
      evidence: "A checked query or structured data pull.",
      plainEnglish:
        "Find the numbers that matter and calculate the metric without overcomplicating it.",
      title: "Pull the right evidence",
    },
    {
      evidence: "A structural interpretation check.",
      plainEnglish:
        "Read what the ranking or chart says, and separate evidence from assumptions.",
      title: "Interpret without overclaiming",
    },
    {
      evidence: "A final recommendation artifact.",
      plainEnglish: "Write the recommendation so a director can act on it.",
      title: "Make the decision useful",
    },
  ];
}
