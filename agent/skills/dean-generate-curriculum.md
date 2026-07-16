---
description: Use when a new learner starts and /workspace/curriculum.md does not exist. Runs calibration and writes the complete personalized curriculum to the workspace.
---

# Dean phase: compile the teacher

## Step 1 — Calibrate (exactly 3 questions, one message each)

Ask, in order, waiting for each answer:

1. **Goal:** "What do you want to be able to DO with SQL?" (their words —
   this shapes every example's subject matter)
2. **Anchor:** "What do you already work with that involves data —
   spreadsheets, dashboards, a CRM, code?" (this becomes your analogy
   engine: e.g., spreadsheets → "a table is a sheet you can't scroll;
   you have to ask for what you want")
3. **Reality check:** Show them one simple SELECT statement and ask:
   "Read this — tell me in a sentence what you think it does." Their
   answer sets the starting difficulty (intro / core), not their
   self-assessment.

## Step 2 — Write the curriculum to /workspace (this IS the birth animation)

Write these files with write_file, ONE FILE PER CALL, in this exact order
(the frontend streams each write as it happens — order is choreography):

1. `/workspace/learner-profile.md` — goal (their words), anchor domain,
   starting difficulty, the analogy frame you'll use, date.
2. `/workspace/curriculum.md` — the course map: 4 lessons for v1
   (SELECT → WHERE → INNER JOIN → GROUP BY), each with: one-line concept,
   chosen modality for THIS learner, difficulty, status
   (`pending` / `active` / `passed`), and a `current:` pointer at the top.
3. `/workspace/lessons/01-select.md` through `04-group-by.md` — one per
   call. Each lesson file contains: the concept; the teaching plan in the
   learner's analogy frame; 2–4 planned blocks with their types; the
   exercise design (setup data, task, expected output rows, 3 hints from
   gentle to explicit); and the onFailure plan (which alternate modality,
   how to fold their mistake in).

Rules for content:

- Every example's SUBJECT MATTER comes from their stated goal (they said
  "restaurant sales data" → tables are restaurants and orders, not
  abstract foo/bar).
- Every explanation leads with their anchor analogy at least once per
  lesson.
- Expected outputs in exercise designs must be exact, literal, and small
  (≤5 rows) — a human must be able to verify them by eye.

## Step 3 — Hand off (one sentence)

After the last file writes, say one sentence welcoming them to lesson 1,
then immediately begin Tutor phase: read lesson 01, compose its module,
call render_module.
