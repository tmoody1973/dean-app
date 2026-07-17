# MOO-282 submission-readiness record

## Completed technical checks

- A fresh disposable copy made from `git archive HEAD` installed dependencies
  with the README's `npm install` command.
- `npm run typecheck` passed in that clean copy.
- `npm run build:eve` passed in that clean copy.
- The source project previously passed its Next.js production build, and the
  deployed Vercel build is Ready. The clean-copy Next build generated its
  production artifacts but left a build lock while running under local Node 26;
  that machine is outside the README's Node 24 requirement, so it is not used
  as the authoritative production-build result.
- The public GitHub repository, live app root, and live health endpoint each
  returned HTTP `200`.
- The README and PRD accurately describe the three curated tracks, GPT-5.6's
  teaching role, Codex's bounded learning and build-partner roles, verification
  tiers, and current safety limits.
- A HyperFrames submission-video source package now exists at
  `videos/dean-submission-demo/`.
- The video package uses the verified production screenshots captured from the
  live Vercel app, local Kokoro narration, no background music, and no SFX.
- The generated video timeline is 54.869 seconds, with eight visual frames:
  hook, bounded three-track promise, calibration, curriculum birth, Data lesson,
  Codex lesson, Executive Communication lesson, and final live-demo CTA.
- The video source was upgraded from HyperFrames `0.7.39` to `0.7.61` and
  passed `npx --yes hyperframes@0.7.61 check --snapshots` with 0 lint errors,
  0 lint warnings, 0 runtime errors, 0 layout issues, 0 motion errors, and all
  9/9 contrast checks passing WCAG AA.
- Midpoint snapshots were generated with
  `npx --yes hyperframes@0.7.61 snapshot --at 2.72,9.642,16.405,22.741,30.741,38.88,46.464,52.501`.
  The reviewed contact sheet is
  `videos/dean-submission-demo/snapshots/contact-sheet.jpg`.

## Video notes

- HyperFrames printed a non-gating StaticGuard notice claiming voice clips used
  `data-end` without `data-duration`; `videos/dean-submission-demo/index.html`
  was inspected and contains `data-duration` on all eight voice elements, with
  no `data-end` occurrences.
- Captions are absent because the local Kokoro path generated audio without
  word timings. The video remains suitable for preview review but the final
  submission can still choose to render this version or revise to a timestamped
  voice/caption path.

## Reviewer path

1. Clone the public repository and follow the local setup instructions in the
   README with Node 24 and an AI Gateway credential.
2. Or open the live demo URL in the README and use the shared-demo passcode
   distributed in the submission materials.
3. Select **Data to Decision** to see the complete curriculum-birth and first
   lesson flow; the other two tracks are intentionally documented as a focused
   artifact lesson and a judgment-supported preview.

## Remaining external gates

- The checked HyperFrames source and contact sheet are present, but no final
  MP4 or public video URL has been rendered yet. The workflow requires explicit
  user approval to preview/render after checks pass.
- An unfamiliar human reviewer has not yet completed the ten-minute cold-start
  journey, so no friction record exists.

These are submission-material and human-review tasks, not claims the repository
can truthfully mark complete on its own.
