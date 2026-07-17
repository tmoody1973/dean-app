import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { hasValidDemoPasscode } from "../agent/lib/demo-passcode.ts";

test("shared demo passcode accepts only an exact configured value", () => {
  assert.equal(hasValidDemoPasscode("open-sesame", "open-sesame"), true);
  assert.equal(hasValidDemoPasscode("open-sesame!", "open-sesame"), false);
  assert.equal(hasValidDemoPasscode(null, "open-sesame"), false);
  assert.equal(hasValidDemoPasscode("open-sesame", undefined), false);
});
