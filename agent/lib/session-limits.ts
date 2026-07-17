export const CURRICULUM_GENERATION_LIMIT = 3;
export const MODULE_GENERATION_LIMIT = 30;
export const GENERATION_WINDOW_MS = 60 * 60 * 1_000;

export type GenerationKind = "curriculum" | "module";

export type GenerationUsage = {
  readonly curriculumGenerations: number;
  readonly generationWindowStartedAt: number | null;
  readonly moduleGenerations: number;
};

export type GenerationAllowance = {
  readonly allowed: boolean;
  readonly message: string | null;
  readonly usage: GenerationUsage;
};

export function consumeGenerationAllowance(
  current: GenerationUsage,
  kind: GenerationKind,
  now = Date.now(),
): GenerationAllowance {
  const windowHasExpired =
    current.generationWindowStartedAt === null ||
    now - current.generationWindowStartedAt >= GENERATION_WINDOW_MS;
  const usage = windowHasExpired
    ? {
        curriculumGenerations: 0,
        generationWindowStartedAt: now,
        moduleGenerations: 0,
      }
    : current;
  const limit =
    kind === "curriculum" ? CURRICULUM_GENERATION_LIMIT : MODULE_GENERATION_LIMIT;
  const used =
    kind === "curriculum" ? usage.curriculumGenerations : usage.moduleGenerations;

  if (used >= limit) {
    return {
      allowed: false,
      message:
        kind === "curriculum"
          ? "You have used the three curriculum builds available in this session hour. Continue the lesson already on screen, or try again after the hour resets."
          : "You have reached this session's 30-module hourly limit. Continue with the module on screen, or try again after the hour resets.",
      usage,
    };
  }

  return {
    allowed: true,
    message: null,
    usage:
      kind === "curriculum"
        ? { ...usage, curriculumGenerations: used + 1 }
        : { ...usage, moduleGenerations: used + 1 },
  };
}
