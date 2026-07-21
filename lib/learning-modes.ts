export const LEARNING_MODE_OPTIONS = [
  { id: "learn", label: "Learn" },
  { id: "explain", label: "Explain differently" },
  { id: "practice", label: "Practice" },
] as const;

export const LEARNING_MODE_ACTIONS = {
  explain: [
    {
      description: "Use shorter sentences and one idea at a time.",
      id: "simpler",
      label: "Make it simpler",
      message:
        "Explain the active lesson again in plain English. Use short sentences, define any jargon, and give me one small example before asking whether I want to continue.",
    },
    {
      description: "Connect the idea to a realistic workplace situation.",
      id: "work-example",
      label: "Give me a work example",
      message:
        "Explain the active lesson through one realistic workplace example. Show what a person would notice, decide, or do differently. Keep it focused and in plain English.",
    },
    {
      description: "Try another angle before returning to the lesson.",
      id: "another-way",
      label: "Try another way",
      message:
        "Teach the active lesson from a different angle than the last explanation. Use a simple comparison or visual mental model, then ask me one check-in question.",
    },
  ],
  practice: [
    {
      description: "Answer one short question about what you just learned.",
      id: "quick-check",
      label: "Give me a quick check",
      message:
        "Give me one short practice question about the active lesson. Wait for my answer before giving feedback. Keep any claim about correctness within the current track's verification boundary.",
    },
    {
      description: "Apply the lesson to a realistic decision at work.",
      id: "work-scenario",
      label: "Practice a work scenario",
      message:
        "Give me one realistic workplace scenario that uses the active lesson. Ask me what I would do, wait for my answer, then give practical feedback in plain English within the current verification boundary.",
    },
    {
      description: "Find the next interactive exercise in this path.",
      id: "next-exercise",
      label: "Show my next exercise",
      message:
        "Help me find the next interactive exercise in my active learning path. Briefly explain what I will practice and why it matters, then continue with the current lesson flow.",
    },
  ],
} as const;

export type LearningMode = (typeof LEARNING_MODE_OPTIONS)[number]["id"];
export type LearningActionMode = keyof typeof LEARNING_MODE_ACTIONS;
export type LearningActionId =
  (typeof LEARNING_MODE_ACTIONS)[LearningActionMode][number]["id"];

export function getLearningModeAction(
  mode: LearningActionMode,
  actionId: LearningActionId,
) {
  const action = LEARNING_MODE_ACTIONS[mode].find(
    (item) => item.id === actionId,
  );
  if (action === undefined) {
    throw new Error(`Unsupported ${mode} action: ${actionId}`);
  }
  return action;
}
