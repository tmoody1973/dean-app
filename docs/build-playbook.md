# DEAN BUILD PLAYBOOK — Codex workflow for Days 2–5
#
# HOW TO USE:
# 1. Do the SETUP steps yourself (10 min).
# 2. Each day, paste that day's prompt into Codex. One prompt per day.
# 3. Verify the day's "done means" checklist with your own eyes before
#    moving on. You are the QA gate; Codex is the hands.

────────────────────────────────────────────────────────────────────
SETUP (you, ~10 minutes, before any more Codex work)
────────────────────────────────────────────────────────────────────

1. Create docs/ in the repo and drop in:
   - dean-product-brief-and-prd.md
   - spike-findings.md            (paste Codex's Task 5 report into a file)
   - dean-agent-prompts.md        (keep as reference; you'll split it next)

2. Split dean-agent-prompts.md into the real files:
   - Content of FILE 1 → agent/instructions.md   (replace the scaffold's)
   - Content of FILE 2 → agent/skills/dean-generate-curriculum.md
   - Content of FILE 3 → agent/skills/adapt-on-failure.md

3. Fix the one-liner: in lib/module-spec.ts change
   blocks: z.array(Block).min(2)  →  .min(1)

4. Create AGENTS.md at the repo root with the content below.

5. Optional but smart: `nvm use 24` (spike flagged Node 26 vs expected 24).

────────────────────────────────────────────────────────────────────
AGENTS.md  (paste this exact content into the repo root)
────────────────────────────────────────────────────────────────────

# Dean — build rules for coding agents

## What this project is
An AI tutor for the OpenAI Build Week hackathon (Education track,
deadline July 21 5pm PT). A "Dean" phase compiles a personalized SQL
curriculum as files in the agent's /workspace; a "Tutor" phase teaches
it, delivering every lesson via the render_module tool. Full spec:
docs/dean-product-brief-and-prd.md. Verified platform behavior:
docs/spike-findings.md. Read both before large tasks.

## Non-negotiable ground rules
1. eve docs at node_modules/eve/docs/ are the ONLY source of truth for
   eve APIs. Never use eve APIs from memory. GitHub main may be ahead
   of our installed version.
2. The model is `openai/gpt-5.6-luna` with
   `modelContextWindowTokens: 200_000` in agent/agent.ts. Never change
   the model — judging depends on it.
3. lib/module-spec.ts is the contract. Do not modify the schema without
   being explicitly asked. render_module's inputSchema imports it.
4. The agent may never grade correctness. Grading tools compare real
   output to expected output and return `passed`; no code path may let
   the model override it.
5. Model output renders ONLY through registry components as data.
   Never dangerouslySetInnerHTML. Never render model text as HTML.
6. Do not "improve" agent/instructions.md or agent/skills/*.md without
   being asked — their wording encodes spike findings (e.g., instructed
   retry, one-sentence-after-tool-call rule).
7. Scope discipline: SQL only, no auth, no accounts, no new features
   not in the PRD's P0/P1. If a task seems to need something out of
   scope, stop and ask.
8. Known sharp edges (see docs/spike-findings.md): post-tool narration
   can return empty (MODEL_CALL_FAILED) — UI must never depend on
   narration after a tool event; Docker sandbox first-open ~30s;
   multiple-lockfile Next.js warning (set turbopack.root if disruptive).
9. Work in small verifiable increments. After each meaningful change,
   state how the human can verify it in the browser or terminal.

────────────────────────────────────────────────────────────────────
DAY 2 PROMPT (Fri 7/17) — the renderer & registry
────────────────────────────────────────────────────────────────────

Read AGENTS.md, docs/spike-findings.md, and lib/module-spec.ts before
writing code.

Today we replace the raw <pre> at app/_components/agent-message.tsx
(the render_module branch) with a real module renderer. Build:

1. components/module/ — one React component per block type in the
   schema: ExplainBlock (markdown, no raw HTML), ConceptDiagramBlock
   (nodes/edges as simple SVG or positioned divs), CodeExerciseBlock
   (editor textarea, starter code, Check button — grading stubbed to
   "not wired yet"), ParameterSliderBlock (slider updates the {{value}}
   in a displayed template; execution stubbed), DragMatchBlock
   (tap-to-match is fine — drag not required), QuizBlock (choices,
   answer reveal + explanation), RevealSequenceBlock (step-through).
2. components/module/ModuleRenderer.tsx — takes unknown input, runs
   parseModule(); valid → render blocks ONE AT A TIME with a Continue
   button and a thin progress bar (block N of M); invalid → render
   safeFallback(). Never an error state on screen.
3. Swap the <pre> for <ModuleRenderer />.
4. Layout rules (from the PRD's UX reference section — these are
   constraints, not suggestions): one block visible at a time; thin
   progress bar; big single Check button per gradeable block with
   instant green/red feedback; generous whitespace, ONE accent color,
   no gamification, no streaks, no XP.

Do NOT build grading logic today. Do NOT touch agent/ files.
Work component by component and tell me how to verify each in the
browser using EXAMPLE_MODULE.

DONE MEANS: I ask the agent to render EXAMPLE_MODULE and step through
a styled 3-block lesson in the browser; an intentionally broken module
shows the fallback explain block, never an error.

────────────────────────────────────────────────────────────────────
DAY 3 PROMPT (Sat 7/18) — grading, the full loop, adaptation
────────────────────────────────────────────────────────────────────

Read AGENTS.md and docs/spike-findings.md first.

Today the loop closes: teach → grade → adapt.

1. agent/tools/grade_exercise.ts — defineTool. Input: language,
   setupScript, learnerCode, grading {mode, expected}. Runs setupScript
   + learnerCode via an in-process sqlite library (e.g.,
   better-sqlite3) in the tool runtime, compares per mode (exactOutput
   / rowsMatch / containsAll), returns { passed, actualOutput,
   expectedOutput }. Deterministic; the model cannot influence
   `passed`. Timeouts and SQL errors return a retryable failure state
   with the error text.
2. Wire CodeExerciseBlock's Check button: learner code goes to the
   agent as a structured message; agent calls grade_exercise; UI shows
   green/red from the tool result event (never from narration —
   narration can be empty per spike finding #2). Hints reveal one at a
   time on failure.
3. Dean phase end-to-end: fresh session → 3 calibration questions →
   the workspace files get written (verify with the file tools) →
   lesson 1 renders. The frontend should show a simple "file being
   written" line for each write_file event during Dean phase (birth
   animation v0 — filenames appearing is enough today).
4. Adaptation: fail a module on purpose → agent follows
   adapt-on-failure skill → lesson file rewritten in /workspace →
   rebuilt module arrives in a different modality with my mistake
   embedded. Capture before/after of the lesson file so Day 4 can
   render a diff (storing both versions is enough today).

DONE MEANS: I can play Maya start to finish — calibrate, learn, pass
an exercise with real grading, fail one on purpose, and watch the
lesson come back rebuilt in a new modality.

────────────────────────────────────────────────────────────────────
DAY 4 PROMPT (Sun 7/19) — the three demo screens + guardrails
────────────────────────────────────────────────────────────────────

Read AGENTS.md first. Today is polish ONLY on the three demo moments,
plus safety config. Nothing new.

1. Birth animation: during Dean phase, render the write_file events as
   an animated file tree materializing (filename appears with a brief
   shimmer, tree grows). This is demo beat 1 — it gets the most care.
2. Diff view: when adaptation rewrites a lesson file, show a
   before/after diff (added lines highlighted) with the Revision log
   line as its caption. Demo beat 3.
3. Failure→rebuild transition: a short visible moment between a failed
   check and the rebuilt module ("rebuilding this a different way…").
   Demo beat 2's connective tissue.
4. Guardrails (PRD Guardrails section): shared-passcode custom AuthFn
   on the eve channel per node_modules/eve/docs auth guide; per-session
   rate limits (~3 curriculum generations, ~30 modules/hour) with a
   friendly limit message; verify the sqlite grading tool has a
   timeout and output-size cap.
5. Wire one schedule file so a parked tutor sends a check-in during a
   window I choose (for the video). If timing is unreliable, make it
   triggerable and tell me honestly.

DONE MEANS: the full Maya run looks intentional on screen — birth
animation, styled lessons, visible rebuild with diff — and the
deployment is passcode-gated and rate-limited.

────────────────────────────────────────────────────────────────────
DAY 5 PROMPT (Mon 7/20) — deploy, README, submission
────────────────────────────────────────────────────────────────────

Read AGENTS.md first.

1. Deploy to Vercel. Then RE-RUN the workspace persistence test from
   docs/spike-findings.md against the DEPLOYED app (spike verified
   Docker locally; Vercel Sandbox is unverified). If persistence
   differs, implement the pre-decided fallback: curriculum checkpointed
   in session state, files re-seeded on resume.
2. Write README.md for judges: what Dean is (use the PRD one-liner);
   how GPT-5.6 does the intelligence (cite openai/gpt-5.6-luna config
   + the render_module architecture) and how Codex built it (brief,
   honest workflow description); architecture diagram in text; the
   guardrails; testing instructions with the passcode — a cold-start
   judge must reach a working lesson in under 10 minutes; the tier-map
   roadmap paragraph.
3. Repo hygiene: remove dead scaffold code, verify typecheck and a
   clean install-and-run from the README instructions alone.
4. Help me cache/record the three hero moments for the video (never
   live on camera).

DONE MEANS: a friend who has never seen this follows the README on a
clean machine and reaches a rendered lesson; the Devpost form has
everything it needs; we submit TONIGHT — Tuesday is buffer only.
