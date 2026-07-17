import { defineTool } from "eve/tools";

import { LearningModule } from "../../lib/module-spec";
import { learnerSession } from "../lib/learner-session";
import { consumeGenerationAllowance } from "../lib/session-limits";

export default defineTool({
  description:
    "Render an interactive learning module to the learner's screen. Call this to deliver every lesson.",
  inputSchema: LearningModule,
  execute(input) {
    const current = learnerSession.get();
    const allowance = consumeGenerationAllowance(current, "module");

    if (!allowance.allowed) {
      throw new Error(allowance.message ?? "Module generation is temporarily unavailable.");
    }

    learnerSession.update(() => ({
      ...current,
      ...allowance.usage,
    }));

    return { rendered: true, moduleId: input.id };
  },
});
