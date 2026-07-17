"use client";

import { CodeExerciseBlock } from "@/components/module/blocks/CodeExerciseBlock";
import { ConceptDiagramBlock } from "@/components/module/blocks/ConceptDiagramBlock";
import { DragMatchBlock } from "@/components/module/blocks/DragMatchBlock";
import { ExplainBlock } from "@/components/module/blocks/ExplainBlock";
import { ParameterSliderBlock } from "@/components/module/blocks/ParameterSliderBlock";
import { QuizBlock } from "@/components/module/blocks/QuizBlock";
import { RevealSequenceBlock } from "@/components/module/blocks/RevealSequenceBlock";
import type { GradeExerciseInput } from "@/lib/grading/contracts";
import type { GradeAttemptProjection } from "@/lib/grading/grading-events";
import type { LearningModuleT } from "@/lib/module-spec";

type LearningBlock = LearningModuleT["blocks"][number];

type BlockRendererProps = {
  readonly block: LearningBlock;
  readonly blockIndex: number;
  readonly canSubmitExercise: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly moduleId: string;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly onExerciseSubmit: (input: GradeExerciseInput) => Promise<void>;
  readonly onReadyChange: (ready: boolean) => void;
};

/**
 * The only route from validated lesson data to interactive UI.
 * Every branch mounts a component we own; lesson payloads never become JSX.
 */
export function BlockRenderer({
  block,
  blockIndex,
  canSubmitExercise,
  gradeAttempts,
  moduleId,
  onCheckedChange,
  onExerciseSubmit,
  onReadyChange,
}: BlockRendererProps) {
  switch (block.type) {
    case "explain":
      return <ExplainBlock block={block} />;
    case "codeExercise":
      return (
        <CodeExerciseBlock
          block={block}
          blockIndex={blockIndex}
          canSubmit={canSubmitExercise}
          gradeAttempts={gradeAttempts}
          moduleId={moduleId}
          onCheckedChange={onCheckedChange}
          onSubmit={onExerciseSubmit}
        />
      );
    case "conceptDiagram":
      return <ConceptDiagramBlock block={block} />;
    case "parameterSlider":
      return <ParameterSliderBlock block={block} />;
    case "dragMatch":
      return (
        <DragMatchBlock
          block={block}
          onCheckedChange={onCheckedChange}
        />
      );
    case "quiz":
      return (
        <QuizBlock
          block={block}
          onCheckedChange={onCheckedChange}
        />
      );
    case "revealSequence":
      return (
        <RevealSequenceBlock
          block={block}
          onReadyChange={onReadyChange}
        />
      );
  }
}
