# MOO-279 Three-track demo polish browser acceptance — 2026-07-17

## Scope

This run verifies the desktop judging path: curated-track entry, visible teacher
compilation, the evidence-driven rebuild/diff moment, and honest verification
labels. It does not add a learning component, mobile layout, gamification, or
new adaptation behavior.

## Environment

- Local Next.js application with the Eve Docker sandbox backend
- Data hero browser session: `dean-moo279`
- Codex preview browser session: `dean-moo279-codex`
- Executive preview browser session: `dean-moo279-executive`
- Entry screenshot: `docs/verification/2026-07-17-moo-279-entry.png`
- Adaptation screenshot: `docs/verification/2026-07-17-moo-279-adaptation-diff.png`

## Three-track entry and verification boundary

The initial screen presents only the three approved professional paths:

1. `Data to Decision` — marked `Complete hero` with `Machine and structural checks`.
2. `Build a Work Tool with Codex` — marked `Focused preview` with `File, build, or test evidence`.
3. `Executive Communication` — marked `Focused preview` with `Judgment-supported feedback`.

Each card sends the existing canonical track-selection message. Selecting the
two preview cards produced headers carrying their distinct labels:

- `Build a Work Tool with Codex | File, build, or test evidence`
- `Executive Communication | Judgment-supported feedback`

The different card labels make the full four-lesson Data hero visibly distinct
from the deliberately bounded secondary previews before a judge starts one.

## Curriculum birth

In a fresh Data to Decision run, Maya supplied the three prepared calibration
answers. During the compiler turn, the UI animated a `/workspace` file tree
with the seven initial files:

1. `session.md`
2. `learner-profile.md`
3. `curriculum.md`
4. `lessons/01-question-framing.md`
5. `lessons/02-sql-retrieval.md`
6. `lessons/03-visualization-interpretation.md`
7. `lessons/04-decision-ready-recommendation.md`

The tree appears before the first typed lesson module and uses the streamed
`write_file` inputs only; it does not invent curriculum state in the browser.

## Rebuild transition and readable diff

After the first relationship exercise, the prepared SQL starter was submitted
unchanged. The authoritative grader returned the known deterministic mismatch.
The browser then displayed `Rebuilding this a different way` before the
replacement module. Its card shows:

- `Before: hands-on` and `After: interactive`;
- a concise git-style lesson-file diff, with removed lines in rose and added
  lines in green;
- the preserved adaptation fields and paths; and
- the actual revision caption: `revision 1 — hands-on to interactive; carried
  forward the authoritative SQL mismatch`.

The next typed module was `Rebuild the net-return calculation`, whose first
block showed the learner's original submitted query. The existing deterministic
retry and all adaptation guardrails remained unchanged.

## Desktop and interaction review

At the local desktop recording viewport, the entry cards, file tree, lesson
shell, adaptation card, and composer remained readable without a placeholder
or dead control. The experience retains one visible learning block, the thin
lesson progress bar, one primary grade action, generous whitespace, a single
cobalt accent, and no streaks, XP, or other gamification.
