import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);

test("the Study Partner first turn is wired from the browser request to explicit tutor rules", async () => {
  const [instructions, chat] = await Promise.all([
    readFile(new URL("agent/instructions.md", root), "utf8"),
    readFile(new URL("app/_components/agent-chat.tsx", root), "utf8"),
  ]);

  assert.match(chat, /createStudyPartnerRequest\(mode\)/);
  assert.match(chat, /await agent\.send\(request\)/);
  assert.match(instructions, /AI Study Partner first-turn contract/);
  assert.match(instructions, /type: "dean\.study-partner\.v1"/);
  assert.match(instructions, /Ask exactly\s+one learner-facing question/);
  assert.match(instructions, /mode: "warm-up"/);
  assert.match(instructions, /mode: "talk-it-through"/);
  assert.match(instructions, /mode: "rehearse"/);
  assert.match(
    instructions,
    /do not\s+call `render_module` or `grade_exercise`/i,
  );
  assert.match(instructions, /Do not give feedback until they answer/);
});
