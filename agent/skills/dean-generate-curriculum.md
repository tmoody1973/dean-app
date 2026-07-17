---
description: Use when a new learner starts and /workspace/curriculum.md does not exist. Selects one approved track, then delegates to its bounded curriculum compiler.
---

# Dean phase: compile the teacher

This skill routes the three approved Build Week tracks. Data to Decision is the
complete hero journey; the other two tracks remain bounded previews.

## Step 0 — Resolve the track before calibration

If `/workspace/session.md` already exists, read it and resume that exact track.
Never select a different track inside the same session.

Otherwise accept only an exact approved track name or the UI's canonical
message containing one of these ids:

| Track id | Track | Verification tiers |
| --- | --- | --- |
| `data-to-decision` | Data to Decision | `machine-verifiable`, `structurally-verifiable` |
| `build-work-tool-codex` | Build a Work Tool with Codex | `machine-verifiable` |
| `executive-communication` | Executive Communication | `judgment-supported` |

Call `select_track` with the canonical id. Treat the tool result as the
authority for the track name and verification tiers copied into workspace
files.

For an unsupported or ambiguous request, call `ask_question` exactly as the
global instructions require and stop until the learner chooses. Do not infer a
track from an arbitrary subject, write any file, or call `render_module`.

## Step 1 — Delegate or calibrate

### Data to Decision — complete hero

Load the data-to-decision-hero skill immediately. It is the sole authority for
the Data to Decision calibration questions, file-writing choreography, lesson
contracts, progression, and final recommendation artifact. Do not ask any Data
to Decision calibration question from this routing skill and do not add a
fourth calibration question.

### Preview tracks

The remaining two tracks deliberately have different depths: one complete
secondary-track lesson and one routing preview.

### Build a Work Tool with Codex — complete secondary-track lesson

Load the build-work-tool-codex skill immediately. It is the sole authority for
this track's three calibration questions, file choreography, controlled
artifact, polished lesson, progression, and learner explanation. Do not ask a
Build a Work Tool question here and do not add a fourth calibration question.

### Executive Communication preview — exactly 3 questions

Ask these questions in order, one message at a time, waiting for each answer.

1. **Outcome:** "Which audience needs a decision or recommendation from you?"
2. **Anchor:** "What are the stakes, and what context does that audience already have?"
3. **Reality check:** Ask for the one sentence they would say today. Use its clarity to set `intro` or `core` difficulty; never call the result passed or verified mastery.

## Step 2 — Write a preview curriculum to /workspace

This step applies only to Executive Communication. Data to Decision and Build a
Work Tool with Codex use their own complete, bounded skill contracts.

Write these files with `write_file`, ONE FILE PER CALL, in this exact order.
The frontend streams each write as it happens, so order is choreography.

1. `/workspace/session.md`
   - `track_id`: canonical id from `select_track`
   - `track`: exact display name from `select_track`
   - `verification_tiers`: exact ordered tier list from `select_track`
   - `phase`: `dean`
   - `started`: current date
2. `/workspace/learner-profile.md`
   - Repeat `track_id`, `track`, and `verification_tiers` exactly.
   - Record the learner's answers, starting difficulty, analogy frame, and date.
3. `/workspace/curriculum.md`
   - Repeat `track_id`, `track`, and `verification_tiers` exactly at the top.
   - Add `current: 01-preview` and an outcome-level map for the selected track:
     - Executive Communication: identify audience and stakes → practice one leadership scenario → revise against a visible judgment-supported rubric.
   - Give each map item a one-line outcome, modality, difficulty, and status
     (`pending` / `active` / `passed`). Do not write polished lesson content.
4. `/workspace/lessons/01-preview.md`
   - Repeat `track_id`, `track`, and `verification_tiers` exactly.
   - State the selected outcome, starting difficulty, analogy frame, and one
     planned `explain` block that confirms the route. Label it explicitly as a
     routing preview; later issues own full lesson content.

## Step 3 — Hand off preview tracks with a routing preview

This step applies only to Executive Communication. After the last preview file
writes, call `render_module` with one valid `explain` block
that names the selected track, shows its verification label, and previews the
outcome map. This is a routing confirmation, not a full lesson. Then say at
most one short sentence.
