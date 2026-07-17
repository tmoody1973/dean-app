import { timingSafeEqual } from "node:crypto";

export function hasValidDemoPasscode(
  supplied: string | null,
  configured: string | undefined,
): boolean {
  if (supplied === null || configured === undefined || configured.length === 0) {
    return false;
  }

  const suppliedBytes = Buffer.from(supplied, "utf8");
  const configuredBytes = Buffer.from(configured, "utf8");

  return (
    suppliedBytes.length === configuredBytes.length &&
    timingSafeEqual(suppliedBytes, configuredBytes)
  );
}
