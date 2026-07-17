# MOO-278 Evidence-driven hero adaptation browser acceptance — 2026-07-17

## Scope

This run verifies the one approved Data to Decision adaptation: the first
eligible deterministic mismatch in `02-sql-retrieval` produces a preserved,
mistake-specific replacement module. It does not verify learner-wide analytics,
automatic schema changes, or the later readable before/after diff interface.

## Environment

- Local Next.js application with the Eve Docker sandbox backend
- Fresh local browser session: `dean-moo278`
- Eve session: `wrun_01KXRAG3AX1P7YPVRJKAEJ2WSJ`
- Track: `data-to-decision`
- Replacement screenshot:
  `docs/verification/2026-07-17-moo-278-rebuild.png`

## Original failure and evidence gate

After the normal three-question calibration and the first relationship lesson,
the learner left the prepared SQL starter unchanged:

```sql
SELECT
  channel,
  revenue_dollars AS net_return_dollars
FROM campaign_performance
ORDER BY net_return_dollars DESC;
```

The authoritative SQL grader returned a normal completed result with
`grader: sql`, `passed: false`, and `error: null`. Its actual rows were
`[["Search",3600],["Social",3000],["Email",2700]]`; the required rows were
`[["Search",2400],["Email",2100],["Social",1500]]`. That precise mismatch is
the only state which can trigger this adaptation. Passing results, grader
errors, stale attempts, altered setup, and any existing revision are ordinary
retry paths.

## Preserved transition

Before Dean rendered any explanatory text, the live Eve action stream saved
these durable files in the fixed order:

1. `/workspace/revisions/02-sql-retrieval/original.md`
2. `/workspace/revisions/02-sql-retrieval/learner-submission.sql`
3. `/workspace/lessons/02-sql-retrieval.md`
4. `/workspace/revisions/02-sql-retrieval/adapted.md`
5. `/workspace/revisions/02-sql-retrieval/display-manifest.md`
6. `/workspace/curriculum.md`
7. `/workspace/session.md`

The curriculum kept `02-sql-retrieval` as the active module and records
revision `1`, the source attempt id, all four snapshot paths, and the modality
change from `hands-on` to `interactive`. The learner submission is saved as raw
SQL. The original and adapted lesson copies provide the future diff input;
MOO-279 owns presenting that diff in the UI.

## Rebuilt module and verified retry

Dean replaced the original two-block lesson with `Rebuild the net-return query`,
an `interactive` module containing exactly three blocks:

1. `Why the executed rows differ` exposes the carried-forward submitted query,
   its actual result, and the expected result.
2. A visual concept diagram connects Revenue, Spend, Subtract, and Net return.
3. The final code exercise carries the same query forward and requires the
   same deterministic exact-output contract.

The learner then submitted the corrected query:

```sql
SELECT
  channel,
  revenue_dollars - spend_dollars AS net_return_dollars
FROM campaign_performance
ORDER BY net_return_dollars DESC;
```

The authoritative grader returned `passed: true`, `error: null`, and matching
actual and expected output. The browser displayed `Verified by execution. Your
output matches.` Selecting Done advanced the current module to
`03-visualization-interpretation`.

During browser automation, a newline-collapsed submission produced a retryable
SQL syntax error. It did not create another adaptation. Entering the corrected
SQL through the browser's native textarea setter then passed, independently
demonstrating the error and replay guardrails.
