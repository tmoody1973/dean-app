import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  TrackIdSchema,
  VERIFICATION_TIERS,
  getTrackSpec,
} from "../../lib/track-spec";
import {
  learnerSession,
  type SelectedTrack,
} from "../lib/learner-session";
import { consumeGenerationAllowance } from "../lib/session-limits";

const selectedTrackSchema = z.object({
  id: TrackIdSchema,
  name: z.string(),
  outcome: z.string(),
  verificationLabel: z.string(),
  verificationTiers: z.array(z.enum(VERIFICATION_TIERS)).min(1),
});

export default defineTool({
  description:
    "Select one approved Dean learning track before calibration. The selected track is fixed for the session.",
  inputSchema: z.object({
    trackId: TrackIdSchema,
  }),
  outputSchema: z.object({
    selected: z.literal(true),
    sessionId: z.string(),
    track: selectedTrackSchema,
  }),
  execute({ trackId }, ctx) {
    const spec = getTrackSpec(trackId);

    if (spec === null) {
      throw new Error(`Unsupported track: ${trackId}`);
    }

    const current = learnerSession.get();

    if (
      current.selectedTrack !== null &&
      current.selectedTrack.id !== trackId
    ) {
      throw new Error(
        "A different track is already selected. Start a fresh session to change tracks.",
      );
    }

    if (current.selectedTrack !== null) {
      return {
        selected: true,
        sessionId: ctx.session.id,
        track: current.selectedTrack,
      };
    }

    const allowance = consumeGenerationAllowance(current, "curriculum");
    if (!allowance.allowed) {
      throw new Error(allowance.message ?? "Curriculum generation is temporarily unavailable.");
    }

    const track: SelectedTrack = {
      id: spec.id,
      name: spec.name,
      outcome: spec.outcome,
      verificationLabel: spec.verificationLabel,
      verificationTiers: [...spec.verificationTiers],
    };

    learnerSession.update(() => ({
      ...allowance.usage,
      selectedTrack: track,
    }));

    return {
      selected: true,
      sessionId: ctx.session.id,
      track,
    };
  },
});
