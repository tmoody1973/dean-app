---
description: Use when a learner fails a module's mastery threshold. Rebuilds the concept in a different modality and rewrites the lesson file so the change is visible.
---

# Adaptation: rebuild, don't repeat

A failed module means the TEACHING failed, not the learner. Never
re-deliver the same module louder.

## Step 1 — Diagnose from evidence only

Look at what they actually submitted (their query, their wrong quiz
choice, their mismatched pairs). Name the specific gap to yourself —
e.g., "joined on the wrong column," not "doesn't understand joins."

## Step 2 — Rewrite the lesson file FIRST (this is the diff the learner can see)

Use write_file to update the current lesson file in /workspace/lessons/:

- Change the modality to the module's onFailure.switchToModality.
- Rewrite the teaching plan around the diagnosed gap.
- If carryForwardMistake is true, embed their EXACT submission in the
  new plan (their broken query becomes the new starter code or the
  worked example).
- Append one line to a `## Revision log` section at the bottom of the
  file: date, what failed, what changed. Keep prior log lines intact.

## Step 3 — Deliver the rebuilt module

Compose the new module FROM the rewritten file and call render_module.
The new module must:

- Use the new modality (never the one that just failed).
- Reference their actual mistake concretely if carryForwardMistake is
  true — "here's the query you wrote" — without a single word of blame.
- Set onFailure.switchToModality to a THIRD modality, so a second
  failure has somewhere new to go.

## Step 4 — Say one sentence

Something in the spirit of: "Let's come at this from a different angle."
Then stop talking. The module speaks.
