# MOO-277 Executive Communication browser acceptance — 2026-07-17

## Scope

This run verifies the one approved Executive Communication preview. It covers
three-part calibration, one prepared leadership scenario, a visible rubric,
two learner drafts, and a concrete comparison. It does not verify objective
mastery, a complete leadership course, employee evaluation, or deterministic
grading of professional writing.

## Environment

- Local Next.js application with the Eve Docker sandbox backend
- Fresh local browser session: `dean-moo277`
- Track: `executive-communication`
- Completion screenshot:
  `docs/verification/2026-07-17-moo-277-complete.png`

## Calibration

Dean asked exactly three questions, one per turn, before writing any file. The
learner supplied:

1. Audience: `Executive steering committee deciding whether to change a customer-facing launch.`
2. Stakes/context: `Sales announced the date to three customers; the steering committee knows the schedule but not the vendor delay or QA constraint.`
3. Communication goal: `They should choose whether to keep the date with reduced scope or move it one week, and name the launch owner.`

The browser then showed exactly four initial writes, in order:

1. `/workspace/session.md`
2. `/workspace/learner-profile.md`
3. `/workspace/curriculum.md`
4. `/workspace/lessons/01-leadership-recommendation.md`

The profile preserved all three answers. The curriculum exposed one active
scenario rather than implying a complete Executive Communication course.

## Prepared scenario and rubric

The first interactive module revealed one fixed launch decision:

- the customer-analytics release is due in 12 days;
- the external connector is 8 days late;
- QA requires 4 uninterrupted days;
- keeping the date requires removing an export needed by the largest customer;
- Sales has announced the date to three customers; and
- moving the launch one week preserves scope.

Before either draft, the browser displayed all five rubric criteria:

1. Recommendation first
2. Decision or ask
3. Evidence
4. Tradeoff and risk
5. Concision, targeting 90 words or fewer

The final block stated `Guided judgment — not verified mastery.` and explicitly
said that selecting Done did not evaluate the writing.

## Preserved drafts

After the scenario completed, the learner submitted this first draft:

```text
The launch is in 12 days, the connector is late, QA needs time, and there are customer commitments. We need to discuss the options.
```

Dean preserved it verbatim in
`/workspace/executive-communication/attempt-1.md`. The learner then submitted:

```text
Move the launch one week and keep the analytics export. The connector is already 8 days late, QA still needs 4 uninterrupted days, and our largest customer needs the export at launch. This protects the full scope but requires Sales to reset the date already shared with three customers. I recommend the launch owner approve the move today and Sales notify customers tomorrow.
```

Dean preserved the revision verbatim in
`/workspace/executive-communication/attempt-2.md` without overwriting Attempt 1.

## Concrete comparison

The comparison module repeated the same rubric and cited observable changes:

- Recommendation first: Attempt 1 opened with `The launch is in 12 days…`;
  Attempt 2 opened with `Move the launch one week…`.
- Decision or ask: Attempt 1 ended with `discuss the options`; Attempt 2 asked
  the launch owner to approve the move today and Sales to notify customers
  tomorrow.
- Evidence: Attempt 1 described the connector and QA timing generically;
  Attempt 2 named `8 days late` and `4 uninterrupted days`.
- Tradeoff and risk: Attempt 1 referred to customer commitments generally;
  Attempt 2 named preserved scope and the cost of resetting the announced date.
- Concision: Attempt 1 was shorter but ended without ownership or timing;
  Attempt 2 spent additional words on both.

The final reveal separately covered Opening, Evidence and tradeoff, and
Decision or next action. The module described changes rather than declaring an
objectively better writer or verified skill.

## Evidence boundary and completion

The visible event stream contained calibration questions, workspace reads and
writes, and typed module renders. It contained no `grade_exercise` request,
score, pass/fail result, or deterministic mastery event. Every feedback screen
used the exact label `Guided judgment — not verified mastery.`

Completing the comparison changed the curriculum and session to `complete`, and
the browser displayed `Your Executive Communication preview is complete.`
