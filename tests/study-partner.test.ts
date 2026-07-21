import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runtime requires the .ts extension.
// prettier-ignore
// @ts-expect-error The project intentionally leaves allowImportingTsExtensions disabled.
import { createStudyPartnerRequest, getStudyPartnerOption, STUDY_PARTNER_OPTIONS } from "../lib/study-partner.ts";

test("offers three focused AI Study Partner modes", () => {
  assert.deepEqual(
    STUDY_PARTNER_OPTIONS.map((option) => option.id),
    ["warm-up", "talk-it-through", "rehearse"],
  );
});

test("each study partner mode keeps the learner in a turn-by-turn exchange", () => {
  for (const option of STUDY_PARTNER_OPTIONS) {
    assert.match(option.message, /wait/i);
    assert.match(option.message, /active lesson|current tutor path/i);
  }

  assert.match(
    getStudyPartnerOption("rehearse").message,
    /verification boundary/i,
  );
});

test("each Study Partner control produces the client request the tutor contract expects", () => {
  for (const option of STUDY_PARTNER_OPTIONS) {
    const request = createStudyPartnerRequest(option.id);
    assert.equal(request.clientContext.type, "dean.study-partner.v1");
    assert.equal(request.clientContext.mode, option.id);
    assert.equal(request.message, option.message);
  }
});
