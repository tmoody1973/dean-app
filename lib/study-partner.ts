export const STUDY_PARTNER_OPTIONS = [
  {
    description: "Answer one small question before Dean explains more.",
    id: "warm-up",
    label: "Warm up",
    message:
      "Start an AI Study Partner warm-up for the active lesson. Ask me one short question in plain English. Wait for my answer before explaining or correcting anything. If I am stuck, offer one small hint and then wait again.",
  },
  {
    description: "Explain your reasoning out loud and uncover assumptions.",
    id: "talk-it-through",
    label: "Talk it through",
    message:
      "Be my AI Study Partner for the active lesson. Ask me to explain my reasoning in plain English, then ask one follow-up that helps me notice an assumption or missing piece. Keep the exchange focused on the current tutor path and wait for my answer before giving feedback.",
  },
  {
    description: "Rehearse how you would use this idea at work.",
    id: "rehearse",
    label: "Rehearse at work",
    message:
      "Be my AI Study Partner for a short work rehearsal based on the active lesson. Give me one realistic workplace prompt, then wait for my response before offering practical feedback in plain English. Keep any claims about correctness within the current track's verification boundary.",
  },
] as const;

export type StudyPartnerMode = (typeof STUDY_PARTNER_OPTIONS)[number]["id"];

export function getStudyPartnerOption(mode: StudyPartnerMode) {
  const option = STUDY_PARTNER_OPTIONS.find((item) => item.id === mode);
  if (option === undefined) {
    throw new Error(`Unsupported study partner mode: ${mode}`);
  }
  return option;
}
