---
description: Use when a new learner starts and /workspace/curriculum.md does not exist. Selects one approved track, then delegates to its bounded curriculum compiler.
---

# Dean phase: compile the teacher

This skill routes the three approved Build Week tracks at their promised depth:
the complete Data hero, one bounded Codex artifact lesson, and one Executive
Communication preview.

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

The remaining tracks keep their deliberately bounded Build Week depth: one
Codex artifact lesson and one Executive Communication scenario.

### Build a Work Tool with Codex — complete secondary-track lesson

Load the build-work-tool-codex skill immediately. It is the sole authority for
this track's three calibration questions, file choreography, controlled
artifact, polished lesson, progression, and learner explanation. Do not ask a
Build a Work Tool question here and do not add a fourth calibration question.

### Executive Communication preview — judgment-supported

Load the executive-communication-preview skill immediately. It is the sole
authority for this track's three calibration questions, file choreography,
prepared scenario, visible rubric, two verbatim attempts, guided feedback, and
revision comparison. Do not ask an Executive Communication question here and
do not add a fourth calibration question.
