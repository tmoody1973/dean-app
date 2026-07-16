# Dean — build rules for coding agents

## What this project is

An AI teacher compiler for professional career learning, built for the OpenAI
Build Week hackathon (Education track, deadline July 21, 5:00 PM PT). A
"Dean" phase compiles a personalized curriculum as files in the agent's
/workspace; a "Tutor" phase teaches it through the render_module tool. The
active MVP supports Data to Decision, Build a Work Tool with Codex, and
Executive Communication at deliberately different verification tiers.

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
7. **Scope discipline:** Build only the three approved MVP tracks. SQL is
   one supporting skill inside Data to Decision, not the product boundary.
   Do not add auth, accounts, arbitrary subjects, or features outside an
   approved Linear issue and the PRD's active scope. If a task seems to need
   something else, stop and ask.
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

## Linear development workflow

Linear is the execution source of truth for consequential, multi-step work.
The PRD owns product requirements; approved technical designs live in
docs/plans/; Linear owns issue status, dependencies, acceptance criteria,
and verification evidence.

1. Before implementation, read the relevant Linear issue and restate its
   Intent and Acceptance criteria.
2. If no issue exists, use the brainstorming skill to clarify the design.
   Save approved designs under docs/plans/YYYY-MM-DD-<topic>-design.md,
   then draft the Linear issue.
3. Every build issue must contain Intent, Acceptance criteria, Verification
   checklist, Out of scope, and a link to its approved plan.
4. Do not move a roadmap outcome directly into implementation. Refine it
   through brainstorming and split it into small, shippable issues first.
5. Work only within the active issue's scope. New requirements become issue
   updates or separate issues before implementation continues.
6. Include the Linear identifier in commits:
   feat(scope): short description (DEA-123)
7. Do not mark an issue Done until its verification checklist passes against
   real browser, terminal, API, database, or deployment evidence. Record that
   evidence in a Linear comment.
8. Update the parent Linear project at phase boundaries with completed
   outcomes, current risks, and the next planned result.
9. The active Build Week implementation supports exactly three approved
   professional-learning tracks:
   - Data to Decision: complete hero journey, with SQL as one supporting
     skill and deterministic grading where applicable.
   - Build a Work Tool with Codex: secondary track with one polished lesson
     and one verifiable artifact.
   - Executive Communication: preview track with one interactive scenario
     and explicitly judgment-supported feedback.
   Do not add more tracks, subjects, or generalized "learn anything" behavior
   until the Build Week DONE MEANS checklist passes. Dean's product north star
   is professional career learning across verification tiers; the three-track
   limit is a delivery constraint, not the permanent product boundary.
10. Brilliant.org is interaction inspiration: one concept at a time, visual
    and hands-on learning, immediate feedback, and progressive disclosure. Do
    not copy branding or add streaks, XP, leagues, or other off-thesis
    gamification.
