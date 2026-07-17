# MOO-281 production durability verification

## Scope

This run verifies the deployed Dean web app and Eve runtime as one Vercel
project, with the approved shared-demo access policy. It verifies a real
learner session through curriculum generation, a parked-session boundary, and
resume. It does not verify multi-region recovery, account migration, or the
future cross-device product-state work.

## Deployment

- Vercel project: `dean` in `tmoody1973s-projects`
- Production deployment: `dpl_6yvmBRCUYjnrNxcEqXRkuqnoHWaX`
- Production URL: `https://dean-tmoody1973s-projects.vercel.app`
- Runtime build: `43e968804b43147267bda22a5c39242ca530dcdc`
- Runtime model: `openai/gpt-5.6-luna`
- Deployment build setting: `npm install --build-from-source=sqlite3`

The app and Eve runtime are deployed together by the Eve Vercel build output.
The source-built `sqlite3` setting is required because the downloaded native
binary did not match Vercel's production Linux runtime.

## Access-policy proof

The deployed health endpoint returned `200`. Creating a session with no
passcode returned `401` with `demo_access_required`; creating it with the
runtime-only `DEAN_DEMO_PASSCODE` returned `202`. Vercel's outer SSO deployment
protection was disabled only after explicit approval, so a judge can reach the
app's own shared-demo passcode gate. The passcode is set as a sensitive Vercel
environment variable for Production and Preview and is not committed.

## Persistence sentinel

The production session `wrun_41KXRH5Y2J0GND2FRZM4337B0V` selected the Data to
Decision track, answered all three calibration questions, and emitted these
successful `write_file` events in the required order:

1. `/workspace/session.md`
2. `/workspace/learner-profile.md`
3. `/workspace/curriculum.md`
4. `/workspace/lessons/01-question-framing.md`
5. `/workspace/lessons/02-sql-retrieval.md`
6. `/workspace/lessons/03-visualization-interpretation.md`
7. `/workspace/lessons/04-decision-ready-recommendation.md`

The same session then read lesson 01, called `render_module`, completed turn 3,
and parked with `wait: next-user-message`. A follow-up message using the same
continuation token created turn 4. The tutor replied that the first lesson was
already on screen rather than creating a new curriculum, proving it resumed
from the stored workspace and learner position.

## Logs and fallback decision

Vercel logs show the session endpoint and Eve workflow requests for both the
initial generation and resumed turn. The only logged tool error occurred before
the initial curriculum existed, when the model attempted to read the optional
learner profile; it recovered in the same turn and completed the seven writes.
There were no errors for the resume path.

Workspace persistence therefore matches local behavior for the verified
park/resume boundary. The pre-decided checkpoint-and-reseed fallback was not
implemented, because its trigger condition did not occur. It remains the
recovery approach if a future production environment shows different sandbox
behavior.
