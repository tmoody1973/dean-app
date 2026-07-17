"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { BlockRenderer } from "@/components/module/BlockRenderer";
import { Button } from "@/components/ui/button";
import type { GradeExerciseInput } from "@/lib/grading/contracts";
import type { GradeAttemptProjection } from "@/lib/grading/grading-events";
import {
  parseModule,
  safeFallback,
  type LearningModuleT,
} from "@/lib/module-spec";

const FALLBACK_CONCEPT = "A simpler explanation";
const FALLBACK_MARKDOWN =
  "Review the current concept in plain language, then continue when you are ready.";

type ModuleRendererProps = {
  readonly canCompleteModule: boolean;
  readonly canSubmitExercise: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly input: unknown;
  readonly onExerciseSubmit: (input: GradeExerciseInput) => Promise<void>;
  readonly onModuleComplete: (moduleId: string) => Promise<void>;
};

export function ModuleRenderer({
  canCompleteModule,
  canSubmitExercise,
  gradeAttempts,
  input,
  onExerciseSubmit,
  onModuleComplete,
}: ModuleRendererProps) {
  const module = useMemo(() => {
    const parsed = parseModule(input);

    if (parsed.ok) return parsed.module;

    return {
      ...safeFallback(FALLBACK_CONCEPT, FALLBACK_MARKDOWN),
      id: "safe-explanation-fallback",
    };
  }, [input]);

  return (
    <ModuleShell
      canCompleteModule={canCompleteModule}
      canSubmitExercise={canSubmitExercise}
      gradeAttempts={gradeAttempts}
      key={moduleRevision(module)}
      module={module}
      onExerciseSubmit={onExerciseSubmit}
      onModuleComplete={onModuleComplete}
    />
  );
}

function ModuleShell({
  canCompleteModule,
  canSubmitExercise,
  gradeAttempts,
  module,
  onExerciseSubmit,
  onModuleComplete,
}: {
  readonly canCompleteModule: boolean;
  readonly canSubmitExercise: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly module: LearningModuleT;
  readonly onExerciseSubmit: (input: GradeExerciseInput) => Promise<void>;
  readonly onModuleComplete: (moduleId: string) => Promise<void>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionReady, setInteractionReady] = useState(false);
  const [completionState, setCompletionState] = useState<
    "idle" | "pending" | "completed" | "error"
  >("idle");
  const completionInFlight = useRef(false);
  const completionSucceeded = useRef(false);
  const stepRef = useRef<HTMLDivElement>(null);
  const shouldFocusStep = useRef(false);
  const currentBlock = module.blocks[currentIndex];
  const stepNumber = currentIndex + 1;
  const totalSteps = module.blocks.length;
  const isComplete = stepNumber === totalSteps;
  const requiresInteraction = requiresInteractionBeforeContinue(currentBlock);
  const mayContinue = !requiresInteraction || interactionReady;
  const progress = `${(stepNumber / totalSteps) * 100}%`;
  const titleId = useId();

  useEffect(() => {
    if (!shouldFocusStep.current) return;

    stepRef.current?.focus();
    shouldFocusStep.current = false;
  }, [currentIndex]);

  const continueLesson = () => {
    if (isComplete || !mayContinue) return;

    shouldFocusStep.current = true;
    setInteractionReady(false);
    setCurrentIndex((index) => Math.min(index + 1, totalSteps - 1));
  };

  const completeModule = async () => {
    if (
      !canCompleteModule ||
      completionInFlight.current ||
      completionSucceeded.current
    ) {
      return;
    }

    completionInFlight.current = true;
    setCompletionState("pending");
    try {
      await onModuleComplete(module.id);
      completionSucceeded.current = true;
      setCompletionState("completed");
    } catch {
      setCompletionState("error");
    } finally {
      completionInFlight.current = false;
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="my-2 w-full overflow-hidden rounded-xl border border-rule bg-card text-card-foreground"
      data-module-id={module.id}
      data-testid="module-shell"
    >
      <div className="px-5 pt-5 sm:px-10 sm:pt-9">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold tracking-[0.18em] text-primary uppercase">
            Lesson
          </span>
          <span
            aria-live="polite"
            className="text-muted-foreground tabular-nums"
            data-testid="module-step"
          >
            Step {stepNumber} of {totalSteps}
          </span>
        </div>

        <div
          aria-label={`Lesson progress: step ${stepNumber} of ${totalSteps}`}
          aria-valuemax={totalSteps}
          aria-valuemin={1}
          aria-valuenow={stepNumber}
          className="mt-3 h-0.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out motion-reduce:transition-none"
            data-testid="module-progress-fill"
            style={{ width: progress }}
          />
        </div>

        <header className="pt-8 sm:pt-10">
          <h2
            className="max-w-2xl text-balance font-semibold text-2xl leading-tight tracking-[-0.025em] sm:text-[2rem]"
            id={titleId}
          >
            {module.title}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">{module.concept}</p>
        </header>
      </div>

      <div
        className="min-h-56 px-5 py-10 outline-none sm:min-h-72 sm:px-10 sm:py-12"
        data-block-index={currentIndex}
        data-block-type={currentBlock.type}
        data-testid="module-current-block"
        key={`${module.id}:${currentIndex}:${currentBlock.type}`}
        ref={stepRef}
        tabIndex={-1}
      >
        <BlockRenderer
          block={currentBlock}
          blockIndex={currentIndex}
          canSubmitExercise={canSubmitExercise}
          gradeAttempts={gradeAttempts}
          moduleId={module.id}
          onCheckedChange={setInteractionReady}
          onExerciseSubmit={onExerciseSubmit}
          onReadyChange={setInteractionReady}
        />
      </div>

      <footer className="flex flex-col gap-2 border-rule border-t bg-background/45 px-5 py-4 sm:items-end sm:px-10 sm:py-5">
        {mayContinue ? (
          <Button
            className="h-11 w-full rounded-lg px-6 shadow-none sm:w-auto"
            disabled={
              isComplete &&
              (!canCompleteModule ||
                completionState === "pending" ||
                completionState === "completed")
            }
            onClick={() => {
              if (isComplete) {
                void completeModule();
                return;
              }
              continueLesson();
            }}
            type="button"
          >
            {isComplete ? (
              completionState === "pending" ? (
                <>
                  <LoaderCircleIcon
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                  Continuing…
                </>
              ) : completionState === "error" ? (
                <>
                  <RotateCcwIcon aria-hidden="true" />
                  Try again
                </>
              ) : completionState === "completed" ? (
                <>
                  <CheckIcon aria-hidden="true" />
                  Complete
                </>
              ) : (
                <>
                  <CheckIcon aria-hidden="true" />
                  Done
                </>
              )
            ) : (
              <>
                Continue
                <ArrowRightIcon aria-hidden="true" />
              </>
            )}
          </Button>
        ) : (
          <p className="w-full text-center text-muted-foreground text-sm sm:text-right">
            Complete this interaction to continue.
          </p>
        )}
        {isComplete && completionState === "error" ? (
          <p className="text-destructive text-sm" role="alert">
            Couldn’t continue the lesson. Try again.
          </p>
        ) : null}
      </footer>
    </section>
  );
}

function moduleRevision(module: LearningModuleT): string {
  return JSON.stringify(module);
}

function requiresInteractionBeforeContinue(
  block: LearningModuleT["blocks"][number],
): boolean {
  return (
    block.type === "codeExercise" ||
    block.type === "dragMatch" ||
    block.type === "quiz" ||
    block.type === "revealSequence"
  );
}
