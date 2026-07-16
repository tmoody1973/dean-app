# SPIKE FINDINGS — 2026-07-16, Day 1 verification night

All four load-bearing questions were tested on a fresh
`npx eve@latest init --channel-web-nextjs` scaffold. Results below are
verified evidence, not assumptions. Architecture decisions in the PRD
(docs/dean-product-brief-and-prd.md) were made against these findings.

## 1. MODEL: GPT-5.6 via AI Gateway — WORKS

- Exact model string: `openai/gpt-5.6-luna`
- Streaming confirmed: YES (incremental chunks, milliseconds apart)
- Gateway routing confirmed in runtime config, model routing metadata
  (`routing: gateway → openai`, credential: api-key), and a Gateway
  generation ID on step.completed.
- **Required config:** eve's model catalog lacked context-window metadata
  for this model and refused to compile. Fix (documented override):
  `modelContextWindowTokens: 200_000` in agent/agent.ts. Keep this line.

## 2. WORKSPACE PERSISTENCE — PERSISTS (local Docker backend)

- write_file created `/workspace/curriculum-test.md` with sentinel
  `PERSISTENCE-CHECK-7716`.
- read_file recovered it after a ~2m15s park/resume of the same session.
- read_file recovered it again after a FULL eve server stop and restart,
  resuming the same session.
- **Implication:** curriculum lives in the workspace. Phase detection by
  file existence (`/workspace/curriculum.md`) is trustworthy locally.
- **Open caveat:** backend was Docker (local persistent backend per the
  sandbox lifecycle docs). Deployed, eve selects Vercel Sandbox
  (ephemeral microVMs) — persistence there is UNVERIFIED. Day 5 must
  re-run this test against the deployed app; pre-decided fallback is
  curriculum checkpointed in session state, re-seeded on resume.

## 3. RENDER_MODULE CONTRACT — WORKS

- Tool: agent/tools/render_module.ts (defineTool), inputSchema =
  LearningModule from lib/module-spec.ts.
- Valid module: full EXAMPLE_MODULE (3 blocks, grading config, mastery,
  onFailure) arrived on the session stream as an `actions.requested`
  event; tool result `{ rendered: true, moduleId: "sql-inner-join-01" }`.
- Invalid module (missing required `title`): **rejected at the tool
  boundary** — no actions.requested, no action.result, execute never ran.
  eve passed the validation error back to the model internally (matches
  CHANGELOG bd287b1).
- **Critical behavior:** the model did NOT retry or repair the call on its
  own; it reported the failure in prose. Retry is therefore INSTRUCTED in
  agent/instructions.md (rule 3). Do not duplicate it in code.

## 4. FRONTEND PIPE — WORKS

- `withEve()` mounts eve's HTTP routes on the Next.js origin.
- `useEveAgent()` consumes the session stream; its default reducer
  converts `actions.requested` into a `dynamic-tool` message part.
- app/_components/agent-message.tsx (~line 105) detects
  `toolName === "render_module"` and currently renders `part.input` in a
  raw `<pre>`. **That branch is the integration seam for the real
  ModuleRenderer.**
- Resilience note: the module rendered even when post-tool narration
  failed, because actions.requested reaches the browser before narration.
  The lesson never depends on chat text.

## 5. SHARP EDGES (all encountered and resolved/recorded)

1. Gateway context-window metadata missing for gpt-5.6-luna → compile
   failure → fixed with `modelContextWindowTokens: 200_000`.
2. Post-tool model narration repeatedly returned empty, even after eve's
   built-in one-time reissue, producing `MODEL_CALL_FAILED` after a
   successful tool result. A normal follow-up message recovered the
   session. Mitigations: UI never depends on post-tool narration;
   instructions cap post-tool narration to one sentence; cache hero
   outputs for the demo video; consider Gateway fallback models for
   judge live-testing.
3. Invalid tool input produces NO stream events (rejection is internal to
   the turn) — frontend cannot observe rejected attempts.
4. Docker sandbox took ~30 seconds to open on first use.
5. eve expects Node 24.x; machine runs 26.0.0. Engine warnings emitted;
   all tests passed anyway. Use Node 24 for supported development; if
   anything gets inexplicably flaky, this is suspect #1.
6. Next.js inferred the wrong workspace root from multiple lockfiles.
   Set turbopack.root if it becomes disruptive.
7. Next.js dev rewrote next-env.d.ts (incidental, reverted).
8. Schema bug found: safeFallback() returned one block while
   LearningModule required min(2) — runtime-invalid despite typechecking.
   **Fixed: blocks is now `.min(1)` in lib/module-spec.ts.**

## Recommended Day 2 start (from the spike)

Verify the `.min(1)` fix is in lib/module-spec.ts, then replace the raw
`<pre>` with a typed renderer that re-validates input through
parseModule(). See docs/build-playbook.md, Day 2 prompt.
