"use client";

import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { BlockRenderer } from "@/components/module/BlockRenderer";
import { Button } from "@/components/ui/button";
import {
  parseModule,
  safeFallback,
  type LearningModuleT,
} from "@/lib/module-spec";

const FALLBACK_CONCEPT = "A simpler explanation";
const FALLBACK_MARKDOWN =
  "Review the current concept in plain language, then continue when you are ready.";

export function ModuleRenderer({ input }: { readonly input: unknown }) {
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
      key={moduleRevision(module)}
      module={module}
    />
  );
}

function ModuleShell({ module }: { readonly module: LearningModuleT }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionReady, setInteractionReady] = useState(false);
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

  return (
    <section
      aria-labelledby={titleId}
      className="my-2 w-full overflow-hidden rounded-2xl border border-black/8 bg-card text-card-foreground shadow-[0_18px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10"
      data-module-id={module.id}
      data-testid="module-shell"
    >
      <div className="px-5 pt-5 sm:px-10 sm:pt-9">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold tracking-[0.18em] text-[#2753c7] uppercase dark:text-[#8aabff]">
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
          className="mt-3 h-0.5 overflow-hidden rounded-full bg-black/8 dark:bg-white/12"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[#2753c7] transition-[width] duration-150 ease-out motion-reduce:transition-none dark:bg-[#8aabff]"
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
          onCheckedChange={setInteractionReady}
          onReadyChange={setInteractionReady}
        />
      </div>

      <footer className="flex border-black/8 border-t px-5 py-4 sm:justify-end sm:px-10 sm:py-5 dark:border-white/10">
        {mayContinue ? (
          <Button
            className="h-11 w-full rounded-xl bg-[#2753c7] px-6 text-white shadow-none hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 sm:w-auto dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
            disabled={isComplete}
            onClick={continueLesson}
            type="button"
          >
            {isComplete ? (
              <>
                <CheckIcon aria-hidden="true" />
                Done
              </>
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
