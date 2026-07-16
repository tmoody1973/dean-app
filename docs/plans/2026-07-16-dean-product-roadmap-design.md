# Dean product roadmap and Linear project design

- **Status:** Approved design; Linear project and 33 issues created
- **Date:** 2026-07-16
- **Repository:** https://github.com/tmoody1973/dean-app
- **Linear project:** https://linear.app/moodyco/project/dean-professional-learning-platform-bdc85a1300c6
- **Linear team:** Moodyco (`MOO`)
- **Build Week deadline:** July 21, 2026, 5:00 PM PT

## Purpose

This document defines Dean's product direction, Build Week scope, planning
workflow, and approved Linear project. It is the durable design source for the
project and issue contracts below. Linear owns execution status, dependencies,
acceptance criteria, and verification evidence.

Linear creation completed on July 16, 2026 after an exact-title duplicate audit
of the project and all 33 approved issues.

## Product north star

Dean compiles a personalized teacher for the professional capability a learner
needs next. The learner names an outcome, answers calibration questions, and
watches Dean write an inspectable curriculum. The tutor then teaches through
Brilliant-inspired interactive modules, adapts when evidence shows that the
learner is stuck, and states honestly how strongly it can verify mastery.

SQL remains an important machine-verifiable skill. It is one supporting module
inside the Data to Decision hero track, not Dean's permanent product boundary.

## Verification tiers

Every track declares one of three verification tiers.

1. **Machine-verifiable:** executable or exactly comparable work such as code,
   queries, formulas, files, tests, and structured data.
2. **Structurally verifiable:** work that satisfies checkable constraints,
   required components, or expected relationships.
3. **Judgment-supported:** work such as leadership, writing, communication,
   strategy, and design. Dean may teach, simulate, critique, and apply a rubric,
   but it must not present model judgment as deterministic mastery.

## Approved planning model

Dean uses rolling-wave planning and a hybrid source-of-truth model.

- The PRD owns product requirements and scope.
- `docs/plans/` owns approved designs and implementation plans.
- Linear owns work status, dependencies, issue contracts, and evidence.
- GitHub owns source history and links commits to Linear identifiers.
- The active Build Week horizon is specified in detail now.
- Later horizons remain outcome-level until brainstorming produces an approved
  design and smaller build-ready issues.

## Issue lifecycle

1. Brainstorm the outcome and compare approaches.
2. Save the approved design in `docs/plans/`.
3. Create or refine a Linear issue with Intent, Acceptance criteria,
   Verification checklist, Out of scope, and a design link.
4. Move the issue to In Progress only after alignment.
5. Build only the accepted scope.
6. Verify against real browser, terminal, API, database, or deployment output.
7. Record commits and evidence in Linear.
8. Mark the issue Done only when its checklist passes.

If a requirement changes, pause work and update the design and issue first. If
verification fails, keep the issue In Progress and record the evidence. Split
new shippable outcomes into new issues instead of silently expanding scope.

## Brilliant-inspired interaction grammar

Brilliant is interaction inspiration, not a visual clone. Dean adopts these
constraints:

- show one learning block at a time;
- display a thin progress indicator;
- lead with interaction when the concept allows it;
- keep on-screen explanation brief;
- use one large action for gradeable work;
- provide immediate, unmistakable feedback;
- reveal hints progressively;
- use generous whitespace, one accent color, and minimal shell chrome;
- omit streaks, XP, leagues, and other off-thesis gamification.

## Build Week MVP

The MVP supports exactly three curated tracks. It does not accept arbitrary
subjects before the Build Week acceptance checklist passes.

### Complete hero: Data to Decision

A marketing professional learns to turn campaign data into a recommendation a
director can act on. The journey includes calibration, curriculum birth,
business-question framing, SQL-based retrieval, visualization interpretation,
recommendation writing, deterministic checks, failure-driven adaptation, and a
visible curriculum change.

### Secondary proof: Build a Work Tool with Codex

The learner identifies repetitive work, writes acceptance criteria, uses Codex
to build the smallest useful tool, tests the result, and explains what changed.
The MVP includes a generated profile and curriculum, one polished lesson, and
one small verifiable artifact.

### Preview: Executive Communication

The learner turns a complex update into a concise leadership recommendation.
The MVP includes short calibration, a curriculum preview, one interactive
scenario, and rubric-based feedback labeled as judgment-supported.

## Proposed Linear project

### Name

**Dean — Professional Learning Platform**

### Description

Dean compiles a personalized teacher for the professional capability a learner
needs next. The learner states an outcome, answers calibration questions, and
watches Dean create an inspectable curriculum. Dean teaches through typed,
interactive modules, adapts from evidence of failure, and labels the strength
of every mastery claim.

**North star:** professionals can build a tutor for a meaningful career
outcome, practice through interactive experiences, understand the verification
boundary, retain progress durably, and carry credible evidence forward.

**Current phase:** Build Week MVP. Day 1 platform verification is complete at
commit `c7a260a`. The active milestone delivers Data to Decision as the full
hero, Build a Work Tool with Codex as the artifact proof, and Executive
Communication as the judgment-supported preview.

**Sources of truth:**

- Requirements: `docs/dean-product-brief-and-prd.md`
- Platform evidence: `docs/spike-findings.md`
- Approved designs: `docs/plans/`
- Execution status and evidence: [Linear project](https://linear.app/moodyco/project/dean-professional-learning-platform-bdc85a1300c6)
- Source and implementation history: GitHub

The Build Week phase retains the July 21 deadline. The overall product roadmap
has no artificial end date; each later horizon defines its exit criteria before
activation.

## Build Week issue contracts

Parenthetical identifiers below are durable roadmap aliases. The leading
`MOO-*` identifiers are the real Linear issues.

### MOO-269 (MVP-01) — Establish the Linear-driven development workflow

#### Intent

Create a durable planning system that connects the PRD, approved Git plans,
Linear issue contracts, commits, and verification evidence.

#### Acceptance criteria

- [ ] `AGENTS.md` contains the approved Linear workflow and three-track scope.
- [ ] This roadmap design is committed under `docs/plans/`.
- [ ] The PRD and README position Dean as a professional learning platform and
      describe SQL as one supporting skill in the hero track.
- [ ] The Linear project and approved issues link to this repository design.
- [ ] The repository records the resulting Linear project URL and identifiers.

#### Verification checklist

- [ ] Read every source-of-truth link from GitHub and Linear.
- [ ] Confirm `AGENTS.md` contains no conflicting SQL-only product rule.
- [ ] Confirm the Git worktree is clean after the planning commit.
- [ ] Confirm Linear contains no duplicate Dean project.

#### Out of scope

- Product feature implementation.
- Arbitrary automation between GitHub and Linear.

### MOO-270 (MVP-02) — Generalize Dean's MVP track and verification contracts

#### Intent

Replace SQL-only product routing with three curated MVP tracks and explicit
verification-tier metadata while preserving the validated tool boundaries.

#### Acceptance criteria

- [ ] A learner can choose Data to Decision, Build a Work Tool with Codex, or
      Executive Communication.
- [ ] Session state and generated curriculum identify the selected track.
- [ ] Every track declares its verification tier in data available to the UI.
- [ ] Agent instructions route only the three approved tracks.
- [ ] Invalid `render_module` input still follows the instructed retry and safe
      fallback behavior from the spike.
- [ ] The implementation does not accept arbitrary subjects.

#### Verification checklist

- [ ] Start a fresh session for each track and confirm correct routing.
- [ ] Inspect generated files and verify the track and tier are present.
- [ ] Attempt an unsupported goal and confirm a clear supported-track response.
- [ ] Run the project typecheck.

#### Out of scope

- Full lesson content for any track.
- General-purpose learn-anything routing.
- Changes to the fixed GPT-5.6 model configuration.

### MOO-271 (MVP-03) — Build the safe Brilliant-inspired module shell

#### Intent

Replace the raw development payload with a safe lesson shell that presents one
validated learning block at a time.

#### Acceptance criteria

- [ ] The renderer accepts `unknown` input and validates it with `parseModule()`.
- [ ] Invalid input renders `safeFallback()` instead of an error state.
- [ ] Only one block appears at a time.
- [ ] Continue navigation and a thin progress indicator show block position.
- [ ] The shell uses generous whitespace, one accent color, and minimal chrome.
- [ ] Model content never renders as raw HTML.

#### Verification checklist

- [ ] Render `EXAMPLE_MODULE` and navigate every block.
- [ ] Render intentionally invalid input and observe the explain fallback.
- [ ] Inspect the DOM for raw HTML injection paths.
- [ ] Verify keyboard navigation and visible focus.
- [ ] Run typecheck.

#### Out of scope

- Exercise execution and grading.
- Course-level navigation.
- Gamification.

### MOO-272 (MVP-04) — Implement the seven interactive learning components

#### Intent

Give GPT-5.6 a reliable registry of interactive lesson components that share
Dean's Brilliant-inspired interaction grammar.

#### Acceptance criteria

- [ ] Implement explain, code exercise, concept diagram, parameter slider,
      drag match, quiz, and reveal sequence components.
- [ ] Every component consumes validated data rather than generated JSX.
- [ ] Interactive blocks lead before explanation when the module orders them
      that way.
- [ ] Gradeable blocks expose one prominent Check action.
- [ ] Feedback is immediate, clear, and accessible.
- [ ] Hints reveal one at a time where the schema provides them.

#### Verification checklist

- [ ] Exercise each component with valid fixture data in the browser.
- [ ] Verify keyboard use, focus order, labels, and color-independent feedback.
- [ ] Confirm no component uses `dangerouslySetInnerHTML`.
- [ ] Run typecheck.

#### Out of scope

- Backend grading decisions.
- New block types outside `lib/module-spec.ts`.
- Streaks, XP, leagues, or achievement animation.

### MOO-273 (MVP-05) — Implement deterministic exercise grading

#### Intent

Make pass or fail derive from real execution and exact comparison rather than
model judgment.

#### Acceptance criteria

- [ ] SQL exercises run through a bounded in-process SQLite path.
- [ ] The grader implements exact output, row matching, and contains-all modes.
- [ ] The grader returns actual output, expected output, pass/fail, and safe
      retryable error details.
- [ ] Time and output-size limits protect the runtime.
- [ ] Artifact checks for the Codex track use explicit, bounded file, build, or
      test criteria.
- [ ] No model-controlled input can override the computed result.

#### Verification checklist

- [ ] Run known passing and failing SQL fixtures for every comparison mode.
- [ ] Run syntax-error, timeout, and oversized-output cases.
- [ ] Run one passing and one failing artifact check.
- [ ] Review the grading code path and identify the sole pass/fail assignment.
- [ ] Run typecheck and relevant tests.

#### Out of scope

- Judgment-supported communication scoring.
- Unbounded shell execution.
- Support for every future subject.

### MOO-274 (MVP-06) — Connect learning components to grading events

#### Intent

Make the browser display authoritative grading-tool events even when model
narration is empty or delayed.

#### Acceptance criteria

- [ ] Learner submissions reach the agent in a structured form.
- [ ] The agent calls the deterministic grader for supported exercises.
- [ ] UI pass/fail state comes from the tool result event.
- [ ] Errors remain retryable and preserve learner input.
- [ ] Failed attempts reveal hints progressively.
- [ ] The UI never waits for post-tool narration to show the result.

#### Verification checklist

- [ ] Observe a passing, failing, and erroring exercise in the browser.
- [ ] Simulate empty post-tool narration and confirm feedback still appears.
- [ ] Inspect session events and match the displayed state to the tool result.
- [ ] Run typecheck.

#### Out of scope

- Model-authored pass/fail decisions.
- Cross-session analytics.

### MOO-275 (MVP-07) — Build the complete Data to Decision hero track

#### Intent

Deliver the full proof that Dean can compile a personalized professional
teacher around a career outcome rather than a single technical subject.

#### Acceptance criteria

- [ ] Fresh sessions ask three calibration questions and write a learner
      profile plus a four-part curriculum.
- [ ] The curriculum covers question framing, SQL retrieval, visualization
      interpretation, and a decision-ready recommendation.
- [ ] Examples reflect the learner's stated work domain.
- [ ] At least one SQL exercise receives deterministic grading.
- [ ] At least one structural exercise checks visualization or recommendation
      requirements.
- [ ] File-writing events are visible to the browser.
- [ ] The complete path ends in a concrete recommendation artifact.

#### Verification checklist

- [ ] Complete the Maya marketing-analyst journey from a fresh session.
- [ ] Inspect every generated workspace file.
- [ ] Pass one exercise and fail another deliberately.
- [ ] Compare the final recommendation with its stated business question and
      required evidence.
- [ ] Record the full run for repeatable review.

#### Out of scope

- Arbitrary data sources.
- A full business-intelligence product.
- Additional complete career tracks.

### MOO-276 (MVP-08) — Build the Codex work-tool secondary track

#### Intent

Prove that Dean can teach a professional to turn a work problem into a small,
tested artifact with Codex.

#### Acceptance criteria

- [ ] Calibration identifies a repetitive task, existing workflow, and desired
      result.
- [ ] Dean writes a learner profile and course preview.
- [ ] One polished lesson teaches Intent, Acceptance criteria, Verification,
      and the smallest useful build.
- [ ] The lesson produces one small project artifact in a controlled workspace.
- [ ] A deterministic file, build, or test check verifies the artifact.
- [ ] The learner explains what the artifact changes and how it was verified.

#### Verification checklist

- [ ] Complete the prepared demo task from calibration through artifact check.
- [ ] Inspect the generated project files.
- [ ] Run the artifact's build or test command independently.
- [ ] Confirm a deliberately broken artifact fails the same check.

#### Out of scope

- A complete Codex curriculum.
- Arbitrary production deployment.
- Autonomous modification of unrelated learner repositories.

### MOO-277 (MVP-09) — Build the Executive Communication preview track

#### Intent

Demonstrate that Dean can teach a judgment-supported professional capability
without disguising model opinion as deterministic mastery.

#### Acceptance criteria

- [ ] Short calibration captures audience, stakes, and communication goal.
- [ ] Dean writes a learner profile and curriculum preview.
- [ ] One interactive scenario asks the learner to turn a complex update into
      a concise leadership recommendation.
- [ ] Feedback uses a visible rubric with concrete criteria.
- [ ] The UI labels the result as guided judgment, not verified mastery.
- [ ] The learner can revise and compare attempts.

#### Verification checklist

- [ ] Complete the prepared leadership-update scenario.
- [ ] Verify the rubric appears before or with feedback.
- [ ] Confirm the UI never displays deterministic pass language.
- [ ] Compare two revisions and confirm feedback cites observable differences.

#### Out of scope

- Claims of objective communication mastery.
- A complete leadership curriculum.
- Automated hiring or employee evaluation.

### MOO-278 (MVP-10) — Implement evidence-driven hero adaptation

#### Intent

Show that Dean changes the teacher when a learner struggles instead of merely
repeating the same explanation.

#### Acceptance criteria

- [ ] A failed Data to Decision module triggers the approved adaptation skill.
- [ ] The learner's actual mistake appears in the replacement lesson.
- [ ] The replacement uses a different modality.
- [ ] Dean rewrites the relevant workspace lesson file.
- [ ] The system preserves before and after versions for display.
- [ ] The rebuilt module still satisfies the typed contract.

#### Verification checklist

- [ ] Fail the prepared hero exercise deliberately.
- [ ] Compare the original and replacement modules.
- [ ] Inspect the lesson-file diff and locate the carried-forward mistake.
- [ ] Confirm the new modality differs from the original.
- [ ] Run typecheck.

#### Out of scope

- Personalized adaptation analytics across many learners.
- Automatic schema changes.

### MOO-279 (MVP-11) — Polish the three-track demo experience

#### Intent

Make Dean's breadth, teacher-compilation moment, and evidence-driven adaptation
clear within a short judging session.

#### Acceptance criteria

- [ ] The entry screen presents the three approved professional tracks.
- [ ] The hero curriculum birth renders as an animated file tree.
- [ ] Adaptation shows a concise rebuilding transition and readable diff.
- [ ] Secondary tracks display their distinct verification labels.
- [ ] The UI follows all approved Brilliant-inspired constraints.
- [ ] A judge can distinguish the full hero from the two previews.

#### Verification checklist

- [ ] Run the planned 60-second hero sequence in the browser.
- [ ] Open both preview tracks and verify their promised depth and labels.
- [ ] Review desktop layout at the target recording resolution.
- [ ] Confirm the demo contains no dead control or placeholder error.

#### Out of scope

- Mobile optimization.
- New learning components.
- Gamification.

### MOO-280 (MVP-12) — Add guardrails and scheduled review

#### Intent

Protect the public demonstration and prove that a tutor can follow up after the
learner leaves.

#### Acceptance criteria

- [ ] The public route uses the approved shared-access mechanism.
- [ ] Curriculum and module generation have friendly session limits.
- [ ] Grading enforces timeout and output limits.
- [ ] One scheduled review can wake or honestly simulate a parked tutor.
- [ ] Security and limit failures present useful user messages.

#### Verification checklist

- [ ] Attempt unauthorized and authorized access.
- [ ] Reach each configured limit and inspect the message.
- [ ] Exercise grading timeout and oversized-output protection.
- [ ] Observe the scheduled or explicitly triggered review path.

#### Out of scope

- Full account-based quotas.
- CAPTCHA, WAF automation, or abuse machine learning.

### MOO-281 (MVP-13) — Deploy and verify production durability

#### Intent

Prove that the deployed product preserves the learner's curriculum and position
across real production lifecycle events.

#### Acceptance criteria

- [ ] The web app and eve runtime deploy as one Vercel project.
- [ ] A deployed session can create curriculum files and resume after parking.
- [ ] The production persistence result is documented with evidence.
- [ ] If workspace persistence fails, the system checkpoints session state and
      reseeds curriculum files on resume.
- [ ] Production routes use the approved access policy.

#### Verification checklist

- [ ] Run the documented persistence sentinel test against the deployment.
- [ ] Close and resume a real learner session.
- [ ] Inspect deployment logs and session events.
- [ ] Verify the fallback path if production behavior differs from local Docker.

#### Out of scope

- Multi-region architecture.
- Post-hackathon account migration.

### MOO-282 (MVP-14) — Validate and prepare the submission package

#### Intent

Make the repository and demonstration reproducible for a judge who has no prior
project context.

#### Acceptance criteria

- [ ] A clean machine can follow the README and reach a working lesson in less
      than ten minutes, excluding external account approval time.
- [ ] README and PRD describe the three-track professional-learning product,
      GPT-5.6's role, Codex's role, verification tiers, and current limits.
- [ ] The demo video stays within the competition limit and shows the three
      promised tracks at their stated depth.
- [ ] Stable hero outputs are captured for recording.
- [ ] Submission links, repository, and deployed app work for a reviewer.

#### Verification checklist

- [ ] Perform a clean install and smoke test from README instructions only.
- [ ] Run typecheck and production build.
- [ ] Review the final video duration and every external link.
- [ ] Ask an unfamiliar reviewer to reach the hero lesson and record friction.

#### Out of scope

- Post-submission roadmap implementation.
- Unverified claims about future capabilities.

## Later-horizon outcome contracts

The issues below remain in Backlog. Each uses this gateway contract before any
implementation begins.

### Standard gateway acceptance criteria

- [ ] A brainstorming session compares at least two approaches.
- [ ] An approved design is committed under `docs/plans/`.
- [ ] The design defines the user outcome, verification tier, success measure,
      architecture boundary, failure handling, and real evidence plan.
- [ ] The outcome is split into small build-ready Linear issues with explicit
      dependencies.
- [ ] No implementation issue starts before human approval.

### Standard gateway verification checklist

- [ ] Review the design against the PRD and current platform constraints.
- [ ] Confirm the proposed evidence can be collected from real behavior.
- [ ] Confirm child issues cover the outcome without hidden scope.

### Standard gateway out of scope

- Implementation inside the outcome issue itself.
- Marking the outcome Done because a design exists.

### MOO-283 (ROAD-15) — Generalize the compiler beyond curated MVP tracks

**Intent:** Make learner profiles, curriculum generation, lessons, adaptation,
and mastery contracts domain-neutral without becoming an unbounded generic
chat tutor.

### MOO-284 (ROAD-16) — Build the production verification-tier framework

**Intent:** Give every track a consistent machine-verifiable, structurally
verifiable, or judgment-supported contract and UI language.

### MOO-285 (ROAD-17) — Guarantee durable learner state

**Intent:** Preserve curriculum, progress, evidence, and recovery across
devices, deployments, failures, and sandbox replacement.

### MOO-286 (ROAD-18) — Add identity, product state, entitlements, and billing

**Intent:** Attach user identity to eve-owned agent state while keeping
account-level records and entitlements in the product data layer.

### MOO-287 (ROAD-19) — Add production observability, abuse controls, and cost limits

**Intent:** Measure failures, latency, model cost, and anomalous use, then apply
limits that protect users and the service.

### MOO-288 (ROAD-20) — Make scheduled reviews reliable across channels

**Intent:** Deliver, retry, observe, and explain spaced-review check-ins for
parked tutors.

### MOO-289 (ROAD-21) — Launch the Data and Analytics career path

**Intent:** Expand the hero into a complete path spanning SQL, spreadsheets,
statistics, visualization, analysis, and decision communication.

### MOO-290 (ROAD-22) — Launch the Automation and Developer Tools path

**Intent:** Teach professionals to use Python, Bash, Git, regex, Codex, and
workflow automation to build useful work artifacts.

### MOO-291 (ROAD-23) — Launch the Operations and Project Management path

**Intent:** Teach planning, prioritization, risk, process design, and delivery
through structurally verifiable professional scenarios.

### MOO-292 (ROAD-24) — Launch the Professional Communication and Leadership path

**Intent:** Teach writing, presenting, feedback, delegation, and leadership
through transparent judgment-supported practice.

### MOO-293 (ROAD-25) — Launch the Career Transition path

**Intent:** Help learners build role-specific capability plans, interview
practice, portfolio artifacts, and evidence of professional growth.

### MOO-294 (ROAD-26) — Create a professional-skill authoring kit

**Intent:** Let new domains define exercises, verification methods,
modalities, and adaptation strategies without rewriting Dean's core.

### MOO-295 (ROAD-27) — Ship the Slack workday tutor

**Intent:** Deliver short lessons and scheduled reviews inside a professional's
daily work environment.

### MOO-296 (ROAD-28) — Add Discord, Calendar, Gmail, and Drive pathways

**Intent:** Extend tutor access, review delivery, scheduling, and source
ingestion through retention-driven integrations.

### MOO-297 (ROAD-29) — Build expert-authored tutor templates

**Intent:** Let experienced practitioners define reusable teaching structures
that Dean personalizes for each learner.

### MOO-298 (ROAD-30) — Build tutor discovery and marketplace mechanics

**Intent:** Help learners find trusted tutor templates while preserving clear
verification and quality boundaries.

### MOO-299 (ROAD-31) — Support standalone per-learner tutor deployments

**Intent:** Evaluate when a learner's compiled tutor should become an
independently deployable eve project.

### MOO-300 (ROAD-32) — Add organization-level learning programs

**Intent:** Let teams define professional outcomes, assign learning paths, and
review aggregate evidence without exposing private learner work.

### MOO-301 (ROAD-33) — Evaluate one sandboxed wildcard interactive

**Intent:** Test whether one constrained generated interactive can extend the
registry without weakening rendering safety or demo reliability.

## Dependency summary

The Build Week critical path is:

`MVP-01 → MVP-02 → MVP-03 → MVP-04 → MVP-06 → MVP-07 → MVP-10 → MVP-11 → MVP-13 → MVP-14`

`MVP-05` can proceed alongside the renderer. `MVP-08` and `MVP-09` can start
after the shared track and module contracts stabilize. `MVP-12` can proceed
alongside track implementation, then must pass before deployment.

## Linear creation record

Completed on July 16, 2026:

1. Resolved the sole active Linear team as Moodyco (`MOO`).
2. Confirmed no duplicate Dean project or exact-title issue existed, including
   archived records.
3. Received explicit approval for this complete project and issue draft.
4. Created the [parent project](https://linear.app/moodyco/project/dean-professional-learning-platform-bdc85a1300c6).
5. Created all 33 approved issues as `MOO-269` through `MOO-301`.
6. Applied the real identifiers to this plan.
7. Set only `MOO-269` In Progress; left the other 32 issues in Backlog.

No product implementation began during Linear creation.
