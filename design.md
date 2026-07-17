# Dean Design System

## Genre

Modern-minimal Cobalt Workbench. Dean should feel like a precise teaching instrument: calm, structured, legible, and durable. It should not feel like a generic SaaS landing page or a decorative AI chat toy.

## Macrostructure

- Entry state: workbench onboarding, not a centered hero with three feature cards. Track choice should feel like selecting a professional learning mode.
- Active session: compact header, readable conversation stream, strong lesson canvas, durable composer.
- Lesson modules: long-document readability inside a workbench shell. Interactive blocks should share controls, borders, feedback states, and focus treatment.

## Theme tokens

- Surface: warm off-white app background with white paper surfaces.
- Ink: high-contrast near-black foreground.
- Rule: low-chroma hairline borders.
- Cobalt: single product accent for progress, primary action, active states, and focused controls.
- Success, warning, and destructive are semantic state colors only.
- Code surfaces use a dedicated dark code token, never arbitrary slate or blue values.

## Typography

- Preserve Geist as the product sans and Geist Mono as the code face.
- Use tight letter spacing only on major titles.
- Use all-caps labels sparingly for section metadata.
- Avoid decorative typography, gradient text, and fake browser/code chrome.

## Shape and spacing

- Default control radius: 8px.
- Large panels: 12px maximum unless the element is a pill.
- Prefer border and spacing over heavy shadows.
- Main lesson/content width should stay readable around 42rem.

## Motion

- Motion is functional only: small opacity/translate transitions, progress width, and focus-safe state changes.
- No bouncy or celebratory motion.
- Respect reduced motion globally.

## Interaction states

- Focus states use the cobalt ring token.
- Hover states are restrained: border/background shifts, not large lifts.
- Disabled states keep layout stable.
- Feedback cards use semantic state colors and readable text.

## CTA voice

- Primary actions are short: “Start”, “Continue”, “Check”, “Done”.
- Secondary actions are outline or ghost.
- Destructive actions stay explicit and rare.

## Implementation notes

- Do not change Eve agent behavior, passcode handling, grading logic, or routing as part of visual redesign work.
- Use semantic Tailwind tokens from `app/globals.css`; avoid hardcoded hex colors in React class names.
