"use client";

import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CheckIcon,
  CircleIcon,
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
import { cn } from "@/lib/utils";

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
  const [completionError, setCompletionError] = useState<string | null>(null);
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
  const currentStepLabel = blockTypeLabel(currentBlock.type);
  const stepItems = module.blocks.map((block, index) => ({
    label: blockTypeLabel(block.type),
    state:
      index < currentIndex
        ? "done"
        : index === currentIndex
          ? "active"
          : "upcoming",
    type: block.type,
  }));

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
    setCompletionError(null);
    try {
      await onModuleComplete(module.id);
      completionSucceeded.current = true;
      setCompletionState("completed");
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : "Dean could not advance the lesson. Try again.",
      );
      setCompletionState("error");
    } finally {
      completionInFlight.current = false;
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="my-2 w-full overflow-hidden rounded-2xl border border-rule bg-card text-card-foreground shadow-[0_24px_80px_-60px_rgba(15,23,42,0.8)]"
      data-module-id={module.id}
      data-testid="module-shell"
    >
      <div className="border-rule border-b bg-primary/5 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenIcon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold tracking-[0.18em] text-primary text-xs uppercase">
                Lesson workspace
              </p>
              <p className="mt-0.5 truncate text-muted-foreground text-xs">
                {readableMode(module.modality)} ·{" "}
                {readableMode(module.difficulty)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border bg-background/75 px-2.5 py-1 font-medium text-foreground">
              {currentStepLabel}
            </span>
            <span
              aria-live="polite"
              className="text-muted-foreground tabular-nums"
              data-testid="module-step"
            >
              Step {stepNumber} of {totalSteps}
            </span>
          </div>
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
      </div>

      <div className="grid min-h-[32rem] lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden border-rule border-r bg-background/45 p-4 lg:block">
          <p className="px-2 text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
            Lesson steps
          </p>
          <ol className="mt-3 space-y-1">
            {stepItems.map((item, index) => (
              <li
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm",
                  item.state === "active"
                    ? "border-primary/35 bg-primary/8"
                    : item.state === "done"
                      ? "border-transparent bg-success/7"
                      : "border-transparent bg-transparent",
                )}
                key={`${item.type}:${index}`}
              >
                <div className="flex items-start gap-2">
                  {item.state === "done" ? (
                    <CheckCircle2Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-success"
                    />
                  ) : item.state === "active" ? (
                    <CircleIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 fill-primary text-primary"
                    />
                  ) : (
                    <CircleIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground/45"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {index + 1} of {totalSteps}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <div className="min-w-0">
          <header className="px-5 pt-7 sm:px-10 sm:pt-9">
            <h2
              className="max-w-2xl text-balance font-semibold text-2xl leading-tight tracking-[-0.025em] sm:text-[2rem]"
              id={titleId}
            >
              {module.title}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              {module.concept}
            </p>
          </header>

          <div
            className="min-h-56 px-5 py-8 outline-none sm:min-h-72 sm:px-10 sm:py-10"
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
        </div>
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
            {completionError ?? "Couldn’t continue the lesson. Try again."}
          </p>
        ) : null}
      </footer>
    </section>
  );
}

function blockTypeLabel(
  blockType: LearningModuleT["blocks"][number]["type"],
): string {
  switch (blockType) {
    case "codeExercise":
      return "Practice";
    case "conceptDiagram":
      return "Map";
    case "dragMatch":
      return "Match";
    case "explain":
      return "Content";
    case "parameterSlider":
      return "Explore";
    case "quiz":
      return "Quiz";
    case "revealSequence":
      return "Walkthrough";
  }
}

function readableMode(value: string): string {
  return value
    .split(/[-_]/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
