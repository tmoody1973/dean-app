# Dean — build rules for coding agents

## What this project is

An AI tutor for the OpenAI Build Week hackathon (Education track, deadline
July 21, 5:00 PM PT). A "Dean" phase compiles a personalized SQL curriculum
as files in the agent's /workspace; a "Tutor" phase teaches it, delivering
every lesson via the render_module tool, with deterministic grading.

Full spec: docs/dean-product-brief-and-prd.md
Verified platform behavior: docs/spike-findings.md
Build sequence and day prompts: docs/build-playbook.md

Read the spec and spike findings before any large task.

## Non-negotiable ground rules

1. **eve docs at `node_modules/eve/docs/` are the ONLY source of truth for
   eve APIs.** Never use eve APIs from memory. GitHub main may be ahead of
   our installed version.
2. **The model is `openai/gpt-5.6-luna`** with
   `modelContextWindowTokens: 200_000` in agent/agent.ts. Never change the
   model — hackathon judging depends on it.
3. **lib/module-spec.ts is the contract.** Do not modify the schema without
   being explicitly asked. render_module's inputSchema imports it.
4. **The agent may never grade correctness.** Grading tools compare real
   output to expected output and return `passed`; no code path may let the
   model influence or override it.
5. **Model output renders ONLY through registry components as data.**
   Never `dangerouslySetInnerHTML`. Never render model text as HTML.
6. **Do not "improve" agent/instructions.md or agent/skills/*.md without
   being asked.** Their exact wording encodes spike findings (instructed
   retry after tool-boundary rejection; one-sentence-after-tool-call rule).
7. **Scope discipline:** SQL only, no auth, no accounts, no features
   outside the PRD's P0/P1. If a task seems to need something out of
   scope, stop and ask.
8. **Known sharp edges** (details in docs/spike-findings.md):
   - Post-tool narration can return empty (`MODEL_CALL_FAILED`); the UI
     must never depend on narration after a tool event — tool events
     arrive first and are the source of truth.
   - Invalid render_module input is rejected at the tool boundary with no
     actions.requested event; the model does NOT retry unless instructed
     (instructions.md rule 3 handles this — do not add code retries).
   - Docker sandbox first-open takes ~30s locally.
   - eve expects Node 24.x; engine warnings on 26 are known.
   - Multiple-lockfile Next.js warning; set turbopack.root if disruptive.
9. **Work in small verifiable increments.** After each meaningful change,
   state exactly how the human can verify it in the browser or terminal.
10. **Never begin the next day-phase of docs/build-playbook.md without the
    human confirming the current phase's DONE MEANS checklist.**

## Scaffold notes

In workspaces or local package installs, resolve the installed `eve` package location first and read its `docs/` directory.
