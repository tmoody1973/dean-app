# DEAN (working title)
## Product Brief & PRD — OpenAI Build Week 2026, Education Track

**Author:** Tarik Moody · **Date:** July 16, 2026 · **Deadline:** July 21, 5:00 PM PT
**Stack:** eve (Vercel agent framework) · GPT-5.6 via AI Gateway · Vercel Sandbox · Next.js 15 frontend · Zod Module Spec
**Approved roadmap:** [Dean product roadmap and Linear project design](plans/2026-07-16-dean-product-roadmap-design.md)

---

# PART 1 — PRODUCT BRIEF (the why)

## One-liner

**Dean doesn't enroll you in a course. It compiles a teacher for the professional capability your career requires next — then shows exactly how strongly the evidence supports each mastery claim.**

Type a learning goal, answer three calibration questions, and watch an AI tutor get *born* — a real, durable agent written to disk as files: its own instructions, its own lesson playbooks, its own executable exercises, its own check-in schedule. Then that tutor teaches you through interfaces it generates on the fly — and when you struggle, it rewrites its own curriculum files and rebuilds the lesson in a different form.

## The problem

Personalized learning tools today personalize the *conversation*, not the *teacher*. Every "AI tutor" is the same general-purpose chatbot wearing a different system prompt, delivering walls of text, grading your answers by vibes, and forgetting you between sessions. Adaptivity is a marketing word: when you fail, the bot re-explains the same thing, louder. Meanwhile the learner never *does* anything — they read about doing.

The cost: learners who need hands-on practice get paragraphs. Learners who think visually get bullet points. Nobody gets a teacher that actually changes its approach based on evidence of what isn't working.

## The insight

Two brand-new primitives make a fundamentally different architecture possible this month:

1. **In eve, an agent is a directory of files** — instructions in markdown, skills as playbooks, tools as TypeScript, schedules as files. Which means an agent can be a *generation target*. One agent can write another agent into existence.
2. **Generative UI with a typed contract** means the model can compose *interfaces*, not just prose — safely, because it assembles from a fixed registry of learning components (the Zod Module Spec) rather than emitting raw code.

Put together: **the curriculum becomes code, the teacher becomes an artifact, and adaptation becomes a visible file diff.**

## What it is

- **The Dean** (generation phase): takes a goal + calibration answers → writes the tutor's complete curriculum as files into the agent's workspace (learner profile, lesson plans, exercise definitions, spaced-repetition schedule) — streamed to the screen as the "teacher being born" animation.
- **The Tutor** (teaching phase): teaches one learner from those files. Delivers every lesson by calling a **render_module tool whose Zod schema IS the lesson contract** — 7 interface primitives (explain, code exercise, concept diagram, parameter slider, drag match, quiz, reveal sequence), validated by the framework before they can exist. Machine-verifiable work executes or compares for real, structural work is checked against explicit constraints, and judgment-supported feedback is labeled honestly instead of presented as deterministic mastery.
- **The adaptation loop**: in the Data to Decision hero, a failed module invokes its `onFailure` contract. The tutor regenerates the same concept in a *different modality* (abstract diagram → hands-on drill), folds the learner's actual mistake into the retry, and rewrites its workspace curriculum files. The learner can see the diff.
- **Durability**: the tutor parks between sessions and wakes on schedule — it checks in on *you*, days later, because spaced repetition is a schedule file, not a push-notification hack.

## Why it wins (mapped to Build Week judging criteria)

| Criterion | How Dean scores |
|---|---|
| **Use of GPT-5.6 / Codex** | GPT-5.6 is the intelligence at both layers: the Dean's curriculum generation and the Tutor's module composition. Codex is the documented build partner (README shows the workflow). |
| **Design / UX** | Generated interfaces instead of chat walls; the "teacher being born" file-tree animation; the failure→rebuild moment. Safety by construction: typed spec + fallback = nothing ever breaks on screen. |
| **Potential impact** | Workforce reskilling: a personal teacher compiled per learner at near-zero marginal cost for meaningful career outcomes — with deterministic evidence where possible and transparent verification limits everywhere else. The underpopulated corner of a student-tool-heavy track. |
| **Novelty** | Nobody is doing agent-compiles-tutor-agent. Every other Education entry will be a tutor chatbot. eve shipped ~4 weeks ago; treating its directory format as a generation target is a use its own docs don't anticipate. |

## The 60-second wow moment (demo beats, in order)

1. **Birth** (0:00–0:20): Maya, a marketing analyst, chooses Data to Decision and asks to turn campaign data into a recommendation her director can act on. Three calibration taps. The file tree materializes on screen in real time: `learner-profile.md → curriculum.md → lessons/01-question-framing.md → lessons/02-retrieve-data.md`. The newborn tutor speaks *her* language and starts from spreadsheet fluency.
2. **Teaching, not chatting** (0:20–0:40): the first interactive module renders, connects a business question to a SQL retrieval step, and runs a real query with a deterministic result.
3. **Visible adaptation** (0:40–1:00): learner fails a JOIN exercise on purpose. Cut to split-screen: the module *rebuilding itself* in a new modality with the learner's broken query embedded — and the git-style diff of the curriculum file changing underneath.

## Where it's excellent: the verifiability tier map

The product's power scales with how *checkable* the learner's work is. This boundary is a feature, not a limitation — it tells the learner exactly where a grading guarantee holds.

| Tier | Subjects | What works | Product stance |
|---|---|---|---|
| **Tier 1 — Machine-verifiable** | Code, queries, formulas, files, tests, and structured data | Execute or compare real output; deterministic grading; mistake-carried-forward retries | Used by SQL inside Data to Decision and artifact checks inside Build a Work Tool with Codex |
| **Tier 2 — Structurally verifiable** | Work with checkable components, constraints, and relationships | Validate required structure without claiming the work has one objectively correct answer | Used for visualization interpretation and recommendation requirements in Data to Decision |
| **Tier 3 — Judgment-supported** | Leadership, writing, communication, strategy, and design | Teach, simulate, critique, and apply a visible rubric; never present model opinion as deterministic mastery | Demonstrated by the Executive Communication preview |

## Target audience

**Beachhead: career-transition adults building professional capabilities under pressure.** The marketing analyst turning campaign data into a decision, the ops manager building a work tool, and the new leader learning to communicate a recommendation.

Why this segment over students or hobbyists:
- **They have existing domain knowledge**, which makes the Dean's calibration lever genuinely valuable — "I know spreadsheets" produces a spreadsheet-analogy SQL course. A blank-slate freshman gets less from that lever.
- **They're time-poor**, so a course that starts exactly at their knowledge edge — plus a tutor that schedules the reviews they'd never schedule themselves — solves their real constraint.
- **They're trust-sensitive**: an adult staking a career move on a capability needs evidence they can interpret. Deterministic grading is the strongest tier, not a blanket claim over judgment-supported work.
- **Track math**: the Education track will be wall-to-wall student-facing tools; adult workforce reskilling is the underpopulated corner, and "Potential Impact" scores reskilling higher than another study aid.
- **Founder-audience fit**: the builder is the user — a mid-career professional who spent this year learning agent frameworks and eval design under deadline pressure. "Who is this for?" gets an autobiographical answer.

## Positioning vs. prior art

- **vs. Paradigm**: Paradigm is a platform of courses with an adaptive layer. Dean has no courses — it manufactures teachers. Their moat is breadth of content; ours is depth of one mechanic they don't have (teacher-as-compiled-artifact, adaptation-as-diff).
- **vs. NotebookLM**: NotebookLM turns documents into study material. Dean turns *goals* into *agents* that teach interactively and evaluate work at an explicit verification tier.
- **vs. tutor chatbots**: chat is our fallback modality, not our product.

---

# PART 2 — PRD (the what)

## Problem statement

Learners using AI tutors receive one-size-fits-all chat: text-based teaching regardless of learning style, subjective grading, no persistence between sessions, and "adaptivity" that amounts to re-explanation. There is no product where the teacher itself is constructed per learner and demonstrably changes its method based on evidence of failure. For the hackathon: judges will see dozens of tutor chatbots; the cost of building one more is invisibility.

## Goals

1. **Compile a working tutor agent from a single goal statement** in under 90 seconds of pipeline time (cached for video), with the file tree visible as it's written.
2. **Deliver exactly three curated Build Week tracks**: Data to Decision as the complete hero, Build a Work Tool with Codex as one polished artifact lesson, and Executive Communication as one judgment-supported preview.
3. **Expose a verification-tier contract for every track** so the UI distinguishes machine-verifiable, structurally verifiable, and judgment-supported evidence.
4. **Demonstrate visible adaptation**: a failed Data to Decision module regenerates in a different modality with the learner's mistake carried forward, and the underlying lesson-file diff is displayable.
5. **Demonstrate durability**: one scheduled check-in fires from a parked tutor session during the demo window.
6. **Submit a complete, testable entry** (video ≤3 min, public repo, README with Codex/GPT-5.6 usage and testing instructions) before July 21, 5:00 PM PT.

## Non-goals (v1 / hackathon scope)

- **No arbitrary-subject support.** The MVP accepts only Data to Decision, Build a Work Tool with Codex, and Executive Communication. The three-track limit is a delivery constraint, not Dean's permanent product boundary.
- **No auth, accounts, or multi-user.** Single-learner demo instance. (Cut reason: zero demo value, high time cost.)
- **No course marketplace, sharing, or community features.** (Cut reason: Paradigm's moat, not ours; separate initiative.)
- **No freeform generated JSX/HTML.** All UI composes from the 7-primitive registry. (Cut reason: render-reliability risk on camera. Exception: at most ONE sandboxed-iframe "wildcard" interactive, only if Days 1–3 run ahead of schedule.)
- **No mobile layout.** Desktop demo only.
- **No pricing/negotiation gimmick** (Paradigm's name-your-tuition). (Cut reason: charm without substance; off-thesis.)
- **No deterministic mastery claims for judgment-supported work.** Executive Communication may teach, simulate, critique, and apply a rubric, but it must label the result as guided judgment rather than verified mastery.

## Users & user stories (priority order)

**Persona A — The Reskilling Professional** (primary; demo persona: "Maya," a marketing analyst, fluent in spreadsheets, needs to turn campaign data into a recommendation for her director)
- As a reskilling professional, I want to state my goal and what I already know, so that my course starts at my knowledge edge instead of from zero — my time is the scarcest thing I have.
- As a reskilling professional, I want Dean to verify my work at the strongest honest tier, so that I can distinguish machine-backed evidence from structural checks and guided judgment.
- As a reskilling professional, I want a failed concept re-taught a *different way* — anchored in what I already know (spreadsheets) — so that I get unstuck instead of discouraged.
- As a reskilling professional juggling a job, I want my tutor to schedule reviews and check in on me, so that spaced repetition happens without me managing it.
- As a reskilling professional, when the AI produces something malformed, I want a plain explanation to appear instead of an error, so that my limited study window never dead-ends.

**Persona B — The Judge/Evaluator**
- As a judge, I want to reproduce the core flow from the README in <10 minutes, so that Stage One functionality verification passes.
- As a judge, I want to see clearly where GPT-5.6 does the thinking and where deterministic code enforces safety/grading, so that I can score model use and design honestly.

**Persona C — The Builder (Tarik)**
- As the builder, I want the Module Spec to be the single contract between agent and frontend, so that backend and UI can be built in parallel with Codex.

## Requirements

### P0 — Must-have (cannot submit without)

**R1. Curated track selection and Dean generation pipeline (curriculum birth)**
Track choice + calibration answers → the Dean writes the tutor's curriculum into the agent's **sandbox workspace** (curriculum plan, lesson files, learner profile, verification metadata), then hands off to tutoring mode. *(Research note: eve loads `agent/skills/` at build time and deployed Functions are read-only, so the living curriculum lives in the sandbox workspace — the filesystem eve's read_file/write_file/bash tools are built to write at runtime. Same demo, legal plumbing.)*
- [ ] A learner can choose Data to Decision, Build a Work Tool with Codex, or Executive Communication; unsupported goals receive a clear supported-track response.
- [ ] Given a supported track and calibration answers, when generation runs, then curriculum files exist in the workspace and the tutor delivers module 1 from them.
- [ ] Session state and generated curriculum identify the selected track and its verification tier.
- [ ] Generated curriculum demonstrably reflects calibration (e.g., spreadsheet analogies for the demo persona).
- [ ] File-writing events stream to the frontend for the birth animation.
- [ ] Curriculum survives a parked/resumed session — via workspace persistence if the Day 1 spike passes, else checkpointed in session state and re-seeded on resume.

**R2. Module Spec pipeline (the contract, enforced at the tool boundary)**
The tutor delivers every lesson by calling a **`render_module` tool whose Zod `inputSchema` IS the LearningModule schema** — the framework rejects invalid modules before they exist, and the frontend renders by listening for `render_module` events on the session stream.
- [ ] Given a lesson turn, when the tutor calls render_module with a valid module, then the frontend receives the event and renders the blocks in order.
- [ ] Given an invalid module attempt, when the tool boundary rejects it, then the model retries; after repeated failure, `safeFallback` renders a plain explanation — never an error state.
- [ ] All 7 primitives have working React components; at minimum explain, codeExercise, conceptDiagram, and dragMatch appear across the Build Week experience.

**R3. Tier-aware verification and feedback**
- [ ] Given a SQL codeExercise, when the learner submits, then setupScript + learner code execute via an in-process sqlite library inside the grading tool, and output is compared per grading mode (exactOutput / rowsMatch / containsAll). *(Tools run in the app runtime per eve docs — in-process execution is the reliable path; sandbox execution is the P1 upgrade for the "learner's real computer" narrative.)*
- [ ] Build a Work Tool artifacts use explicit, bounded file, build, or test checks.
- [ ] Structural exercises evaluate declared required components or relationships and expose those criteria to the learner.
- [ ] Executive Communication feedback uses a visible rubric, cites observable differences, and is labeled judgment-supported rather than passed or verified.
- [ ] Machine-verifiable grading derives ONLY from execution or exact comparison; the model never controls or overrides the result.
- [ ] Execution failures (timeout, bad SQL) surface as a retryable state with the error shown, not a dead end.

**R4. Adaptation loop**
- [ ] Given a failed module, when mastery isn't met, then the tutor regenerates the concept in the `onFailure.switchToModality`, embedding the learner's actual wrong answer.
- [ ] The corresponding skill-file rewrite is captured and renderable as a diff.

**R5. Three-track Build Week content contract**
- [ ] Data to Decision delivers calibration, curriculum birth, business-question framing, SQL retrieval, visualization interpretation, recommendation writing, deterministic and structural checks, visible adaptation, and a concrete recommendation artifact.
- [ ] Build a Work Tool with Codex delivers a learner profile, curriculum preview, one polished lesson, one controlled project artifact, and one bounded artifact check.
- [ ] Executive Communication delivers short calibration, a curriculum preview, one interactive leadership scenario, a visible rubric, and revision comparison labeled as judgment-supported.
- [ ] The product does not accept arbitrary subjects before the Build Week acceptance checklist passes.

**R6. Submission package**
- [ ] Demo video ≤3 min on YouTube (public), hero generations cached — no live pipeline on camera.
- [ ] Public repo, README with: what it does, Codex + GPT-5.6 usage explanation, testing instructions a judge can follow, sample data.
- [ ] Devpost form complete before July 21, 5:00 PM PT (target: submit July 20 night; the 21st is buffer).

### P1 — Nice-to-have (build only if P0 is green)

- **Scheduled check-in fires live** during a recorded segment (tutor parks, wakes on schedule, messages the learner). If timing is flaky, simulate with an honest on-screen label.
- **Diff view polish**: side-by-side before/after skill file with highlighted changes (P0 only requires it be *renderable*; P1 makes it beautiful).
- **parameterSlider + revealSequence** appear in the hero track (P0 requires them built, not necessarily featured).
- **Session resume**: close the tab, return, tutor recalls exact position via eve durable state.
- **.ics calendar export** (conditional — only if Day 4 runs ahead): the Dean emits a downloadable .ics of the tutor's check-in schedule. Zero OAuth, ~30 min, makes the durability beat feel real ("your tutor put its reviews on your calendar"). Cut without hesitation if Day 4 is tight.

### P2 — Future considerations (design for, don't build)

- **Compiler expansion beyond curated tracks**: additional professional outcomes may add machine-verifiable harnesses (Python, bash, spreadsheet formulas, git, regex), structural contracts, or judgment-supported rubrics only after an approved design defines the verification boundary and evidence plan.
- The "wildcard" fully-generated interactive in a sandboxed iframe — registry renderer should tolerate an eighth, iframe-typed block later.
- Dean-generated tutors deployed as standalone eve projects per learner (`vercel deploy` per tutor) — keep generated directories deploy-clean.
- Teacher marketplace: human experts seed skill templates the Dean personalizes (the Polanyi/tacit-knowledge angle, done our way).
- **Integrations & channels (v2 retention layer).** Lead with **Slack**: eve channels make "same tutor, new surface" a one-file addition, and a reskilling professional's tutor DMing a 5-minute review during the workday is the killer retention feature for this audience. Then Discord, then Google Calendar/Gmail via Vercel Connect (scoped tokens, no hand-rolled OAuth), then Drive ingestion ("upload your slides → get a course" — the Paradigm move, done on our grading rails). Rule: no integration ships before it has a retention hypothesis attached.
- **Product infrastructure (v2 — post-judging only).** **Convex** as the product database and **Clerk** for auth + subscriptions (Clerk Billing). State boundary, decided now so v1 doesn't violate it: **eve owns agent state** (curriculum files, session memory, durable workflow position — that's the product's soul and it lives in the agent); **Convex owns product state** (user accounts, cross-tutor progress records, entitlements, marketplace data). Clerk gates access and billing tiers wrap around the Dean (e.g., free = 1 tutor, paid = unlimited + Slack channel). Hard constraint: rules require the project be free and unrestricted for judges through the judging period (ends Aug 5) — no paywall touches the repo before then.

## Architecture (one paragraph, plain English — updated per research 7/16)

One eve project, scaffolded with `npx eve@latest init --channel-web-nextjs`, ships the agent and the Next.js frontend together (`eve/next`). The agent has two phases: **Dean mode** (track selection and calibration → writes the curriculum and verification metadata as files into the agent's sandbox workspace, streamed to the frontend as the birth animation) and **Tutor mode** (teaches from those files). GPT-5.6 powers both via a model string in agent.ts (`openai/gpt-5.6-*` — the scaffold defaults to a Claude model; change it first thing) routed through AI Gateway. Lessons are delivered through a **`render_module` tool whose Zod inputSchema IS the LearningModule schema** — the framework enforces the contract at the tool boundary, and the frontend (via the eve session stream / `useEveAgent`) listens for render_module events and maps blocks to registry components. Machine-verifiable grading runs through bounded execution or exact comparison, structural checks evaluate explicit requirements, and judgment-supported feedback uses visible rubrics without deterministic pass language. Failure in the Data to Decision hero triggers the tutor to regenerate the concept in a new modality and rewrite its workspace curriculum files (the diff is the adaptation proof); eve's durable workflows keep the session alive between visits, and a schedule file wakes the tutor for check-ins. **Hard wall:** GPT-5.6 composes and teaches; typed schemas and bounded tools own validation and machine-verifiable results, while the UI labels weaker evidence honestly.

**Architecture decision record (research, 7/16):** Dean-generates-standalone-agent-directories is out for v1 — eve loads skills at build time and deployed Functions are read-only. The self-rewriting tutor with workspace-based curriculum is primary; per-learner deployed tutors move to P2 (eve's build pipeline supports it later). CopilotKit fallback is closed — `useEveAgent` + `eve/next` is the documented first-class frontend path.

## UX reference: Brilliant's grammar, compiled per learner

**North star: Brilliant.org's interactive-first lesson design.** Positioning line for the video and Devpost description: **"Brilliant's feel, compiled per learner."** Brilliant hand-crafts every interactive with human teams over months — their moat and their ceiling. Dean composes the same interaction style on demand, calibrated to one person, in seconds.

**Day 4 layout rules (design constraints for Codex, not suggestions):**
1. **One block on screen at a time.** A module is a sequence you step through, never a scrolling wall of all its blocks. "Continue" advances.
2. **Thin progress bar** across the top of every module (block N of M). Course-level progress lives on a simple path/list view, not a dashboard.
3. **Interact before you read.** Where the module allows, the manipulable block (exercise, slider, dragMatch) leads; explain blocks stay under ~3 sentences on screen.
4. **Big, single "Check" button** per gradeable block; instant, unmissable pass/fail feedback (green/red state + one-line why). Failure reveals hints one at a time, then triggers the rebuild.
5. **Generous whitespace, one accent color, no chrome.** The generated content is the interface; the shell should disappear.

**Deliberately NOT borrowed from Brilliant:** streaks, XP, leagues, achievement animations. That's subscription-retention machinery — off-thesis for the demo and it dilutes the differentiator (verified grading) with borrowed dopamine. P2 at most.

## Persistence, in plain English (and why no Convex or Clerk this week)

**The two-questions rule.** A login system answers *"who are you?"* Persistence answers *"where were we?"* They feel like the same thing because every app you use bundles them — but they're separate problems, and the hackathon build only needs the second one.

**How "where were we?" works here, step by step:**
1. A learner starts with the Dean. eve creates a **durable session** — think of it as a bookmarked conversation that lives on Vercel's servers, not in the browser.
2. Everything about that learner accumulates in two places: the **session state** (calibration answers, current module, pass/fail history — checkpointed by eve's workflows after every step) and the **tutor's own directory** (the generated instructions and skill files, which the tutor rewrites as the learner progresses). The learner's "account" IS the tutor's filesystem plus the session log.
3. The browser holds only a pointer — a session ID in a cookie/URL (e.g., `/tutor/abc123`). Close the laptop Tuesday, open it Thursday: the pointer finds the parked session, eve resumes it from the last checkpoint, and the tutor picks up mid-course. Nothing was "logged out" because nothing was logged in — the session simply never died.
4. The scheduled check-in works the same way: the schedule file wakes the parked session at the appointed time; no account required for the tutor to remember you exist.

**What this deliberately cannot do (and why that's fine until Aug 5):** log in from a second device, recover a lost session link, support multiple learners with identities, or take payment. Those are "who are you?" problems — Clerk's job — and none of them appear in the demo, the judging flow, or the three video beats. Costs of adding them now: ~a day of auth wiring that shows up on zero demo screens; login friction on the judge's testing path (rules require judges reach a working project fast and free through the judging period, ending Aug 5); and a second state system (Convex) alongside eve's, meaning two sources of truth to keep synchronized in a five-day build. Convex isn't rejected — it's **redundant this week**, because eve's durable workflows already are the database for the only user that matters (the judge playing Maya).

**The v2 attach point (already designed, so nothing this week blocks it):** Clerk answers "who are you"; the existing eve session gets stamped with the Clerk user ID; Convex stores account-level product state (cross-device progress, entitlements, marketplace); Clerk Billing gates tutor count by tier. Attaching an identity to an existing session later is boring, solved work — the v1 architecture loses nothing by waiting.

## Guardrails & abuse prevention

The hard-wall architecture already does most of the safety work (typed spec, fixed component registry, three curated tracks, and tier-aware verification). The additions below are ~half a day, mostly config, scheduled before deployment. Judging note: "safety of the user" is explicitly named under the Design criterion — document these in the README.

**P0 guardrails (ship with the demo):**
- **Key isolation + hard budget cap.** API key server-side only; all GPT-5.6 calls via AI Gateway. Hard spend cap on the key so worst case is a stalled demo, never a bill. Gateway spend alerts on.
- **Deployment passcode.** One shared passcode gates the public URL; credentials go in the Devpost testing instructions (explicitly permitted by the rules for private sites). Kills drive-by token abuse for ~10 minutes of work.
- **Rate limits per session:** ~3 Dean generations and ~30 module generations per hour — generous for any judge, useless to a scraper. Friendly "taking a breather" message on limit.
- **Three-track lock as injection defense.** The Dean routes only Data to Decision, Build a Work Tool with Codex, and Executive Communication during Build Week; unsupported goals get a friendly redirect and never reach generation. Goal input is length-capped, and calibration uses bounded choices where practical.
- **Sandbox limits:** execution timeout (seconds), output size cap, no network egress from exercise runs. (eve sandbox microVM isolation is the base layer.)
- **No raw HTML path.** Model output renders only as data through registry components — text as text, never `dangerouslySetInnerHTML`. The Zod/registry leash IS the XSS guardrail; keep it unbroken.

**P1 (only if time):** per-IP limits in addition to per-session; anomaly alert (single session exceeding N total tokens); tutor system-prompt hardening that permits only the selected approved track and declines unsupported requests.

**Explicitly not doing (v2):** CAPTCHA, WAF rules, abuse ML, account-based quotas — those arrive with Clerk identities in v2, where quotas attach to users instead of sessions.

## Success metrics (hackathon-adapted)

**Leading (during build):**
- Day 1 spike results: runtime skill pickup works OR fallback chosen; GPT-5.6 streams via Gateway; sandbox executes SQL; hardcoded module renders end-to-end. Target: all four answered by end of Day 1.
- Module generation validity rate ≥80% first-parse by Day 3 (retry loop covers the rest).
- Full Data to Decision path (birth → teach → fail → rebuild) runs clean 3× in a row by end of Day 4, and both secondary tracks pass their promised-depth smoke checks.

**Lagging (post-submission):**
- Pass Stage One functionality screening (binary).
- Judge-reproducible in <10 min from README (test on one cold-start friend before submitting).
- Stretch: Education track win / OpenAI or Vercel social mention.

## Timeline & phasing (5 days)

| Day | Deliverable | Kill criteria |
|---|---|---|
| **Thu 7/16** | Complete the verified platform spike, approve the professional-learning roadmap, create the Linear project, and establish three-track plus verification contracts (`MOO-269`–`MOO-270`) | Do not begin implementation until the issue contracts and source-of-truth documents agree. |
| **Fri 7/17** | Build the safe module shell, seven-component registry, deterministic grader, and grading-event path (`MOO-271`–`MOO-274`) | Preserve the typed boundary and safe fallback; cut polish before weakening validation or grading authority. |
| **Sat 7/18** | Deliver the Data to Decision hero, Codex work-tool lesson, Executive Communication preview, and visible hero adaptation (`MOO-275`–`MOO-278`) | Keep the hero complete and the secondary tracks at their explicitly promised depth. |
| **Sun 7/19** | Polish the three-track demonstration and pass access, limit, timeout, and scheduled-review guardrails (`MOO-279`–`MOO-280`) | Everything outside the judging path remains secondary to a reliable 60-second hero sequence. |
| **Mon 7/20** | Deploy, verify production durability, record the video, clean the repository, and submit by night (`MOO-281`–`MOO-282`) | Use the documented persistence fallback if deployed workspace behavior differs from local Docker. |
| **Tue 7/21** | Buffer only: re-record, fix README, verify submission | Hard stop 5:00 PM PT |

## Risks (top 3 — updated per research 7/16)

1. **eve is a 4-week-old beta.** Undocumented sharp edges are certain. *Mitigation:* full docs ship in `node_modules/eve/docs` — point Codex at them as ground truth; the remaining unknowns are down to one (workspace persistence) with a pre-decided fallback.
2. **Sandbox/session persistence semantics.** Sessions are durable (Workflows), but sandboxes run on ephemeral microVMs — workspace files may not survive a park/resume. *Mitigation:* tonight's spike answers it; fallback (curriculum in checkpointed session state, re-seeded on resume) is a few lines and demo-identical.
3. **Time.** 5 days, solo, new framework. *Mitigation:* research already killed two architecture forks (agent-spawning, CopilotKit) before any code; pre-committed scope cuts; demo-screen-only polish rule; submit Day 4 night with Day 5 as pure buffer; cache every hero output.

## Open questions

- **[Engineering — blocking, resolve TONIGHT]** Do sandbox workspace files survive a parked→resumed session? (Sole remaining architecture question; fallback pre-decided.)
- **[Engineering — 2 min, tonight]** Exact GPT-5.6 model id on the AI Gateway list (`openai/gpt-5.6-*`).
- **[Engineering — non-blocking]** Sandbox/exec cold-start latency — acceptable UX or needs a loading state? (Moot for grading if in-process path holds; relevant only to the P1 sandbox-flavor upgrade.)
- **[Product — non-blocking]** Real name. "Dean" is a working title; decide before the video. (Wants to evoke: a teacher being made. Candidates worth riffing: Homeroom, Faculty, Provost, Alma.)
- **[Legal/rules — non-blocking]** Confirm no third-party trademarks or copyrighted music in the video; eve is Apache-2.0, fine to build on with attribution.

**Resolved by research (7/16):** ~~Runtime skill pickup~~ (no — build-time; curriculum moves to sandbox workspace). ~~GPT-5.6 via Gateway~~ (yes — `openai/gpt-5.6-luna` live on Gateway; verify variant). ~~Custom frontend consumes eve stream~~ (yes — `useEveAgent` + `eve/next` are documented first-class; CopilotKit fallback closed). ~~SQL execution~~ (in-process sqlite in the grading tool is primary; eve sandbox is the P1 narrative upgrade).

---

*Companion artifact: `module-spec.ts` (the Zod contract + EXAMPLE_MODULE for the Day 1 spike). Next artifact to produce: the Dean's generation prompt template.*
