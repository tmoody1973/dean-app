import { defineState } from "eve/context";

import type { TrackId, VerificationTier } from "../../lib/track-spec";

export type SelectedTrack = {
  readonly id: TrackId;
  readonly name: string;
  readonly outcome: string;
  readonly verificationLabel: string;
  readonly verificationTiers: readonly VerificationTier[];
};

export type LearnerSessionState = {
  readonly curriculumGenerations: number;
  readonly generationWindowStartedAt: number | null;
  readonly moduleGenerations: number;
  readonly selectedTrack: SelectedTrack | null;
};

export const learnerSession = defineState<LearnerSessionState>(
  "dean.learner-session",
  () => ({
    curriculumGenerations: 0,
    generationWindowStartedAt: null,
    moduleGenerations: 0,
    selectedTrack: null,
  }),
);
