import { z } from "zod";

export const TRACK_IDS = [
  "data-to-decision",
  "build-work-tool-codex",
  "executive-communication",
] as const;

export const TrackIdSchema = z.enum(TRACK_IDS);

export type TrackId = z.infer<typeof TrackIdSchema>;

export const VERIFICATION_TIERS = [
  "machine-verifiable",
  "structurally-verifiable",
  "judgment-supported",
] as const;

export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

export type VerificationTierCollection = readonly [
  VerificationTier,
  ...VerificationTier[],
];

export type TrackSpec = {
  readonly id: TrackId;
  readonly name: string;
  readonly outcome: string;
  readonly depth: string;
  readonly verificationTiers: VerificationTierCollection;
  readonly verificationLabel: string;
};

export const TRACK_CATALOG = [
  {
    id: "data-to-decision",
    name: "Data to Decision",
    outcome: "Turn campaign data into a recommendation a director can act on",
    depth: "Complete hero journey",
    verificationTiers: ["machine-verifiable", "structurally-verifiable"],
    verificationLabel: "Machine and structural checks",
  },
  {
    id: "build-work-tool-codex",
    name: "Build a Work Tool with Codex",
    outcome: "Turn repetitive work into a small tested tool",
    depth: "One polished lesson and artifact",
    verificationTiers: ["machine-verifiable"],
    verificationLabel: "File, build, or test evidence",
  },
  {
    id: "executive-communication",
    name: "Executive Communication",
    outcome: "Turn a complex update into a concise leadership recommendation",
    depth: "One interactive preview",
    verificationTiers: ["judgment-supported"],
    verificationLabel: "Judgment-supported feedback",
  },
] as const satisfies readonly [TrackSpec, TrackSpec, TrackSpec];

const TRACK_BY_ID = {
  "data-to-decision": TRACK_CATALOG[0],
  "build-work-tool-codex": TRACK_CATALOG[1],
  "executive-communication": TRACK_CATALOG[2],
} as const satisfies Readonly<Record<TrackId, TrackSpec>>;

export function parseTrackId(value: unknown): TrackId | null {
  const result = TrackIdSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function getTrackSpec(value: unknown): TrackSpec | null {
  const trackId = parseTrackId(value);
  return trackId === null ? null : TRACK_BY_ID[trackId];
}

export function createTrackSelectionMessage(trackId: TrackId): string {
  const track = TRACK_BY_ID[trackId];
  return `Track selected: ${track.name}. ${track.outcome}. Verification: ${track.verificationLabel}.`;
}
