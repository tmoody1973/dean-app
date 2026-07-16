import { defineTool } from "eve/tools";

import { LearningModule } from "../../lib/module-spec";

export default defineTool({
  description:
    "Render an interactive learning module to the learner's screen. Call this to deliver every lesson.",
  inputSchema: LearningModule,
  execute(input) {
    return { rendered: true, moduleId: input.id };
  },
});
