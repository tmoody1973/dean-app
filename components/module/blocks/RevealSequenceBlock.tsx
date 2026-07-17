"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LearningModuleT } from "@/lib/module-spec";

type RevealSequenceBlockData = Extract<
  LearningModuleT["blocks"][number],
  { type: "revealSequence"; }
>;

export function RevealSequenceBlock({
  block,
  onReadyChange,
}: {
  readonly block: RevealSequenceBlockData;
  readonly onReadyChange: (ready: boolean) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);
  const headingId = useId();
  const step = block.steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isFinal = currentIndex === block.steps.length - 1;

  useEffect(() => {
    onReadyChange(isFinal);
  }, [isFinal, onReadyChange]);

  useEffect(() => {
    if (!shouldFocusHeading.current) return;

    headingRef.current?.focus();
    shouldFocusHeading.current = false;
  }, [currentIndex]);

  const moveTo = (index: number) => {
    shouldFocusHeading.current = true;
    setCurrentIndex(index);
  };

  return (
    <section className="max-w-2xl" aria-labelledby={`${headingId}-title`}>
      <div className="flex items-start justify-between gap-4">
        <h2
          className="text-pretty text-lg font-semibold leading-8"
          id={`${headingId}-title`}
        >
          {block.title}
        </h2>
        <p
          aria-live="polite"
          className="shrink-0 pt-1 text-sm text-muted-foreground tabular-nums"
        >
          Part {currentIndex + 1} of {block.steps.length}
        </p>
      </div>

      <article className="mt-7 rounded-lg border border-rule bg-background p-5 sm:p-6">
        <h3
          className="scroll-m-4 text-pretty font-semibold text-xl leading-8 outline-none focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/30"
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
        >
          {step.heading}
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-pretty leading-7 text-muted-foreground break-words">
          {step.body}
        </p>
        {step.code ? (
          <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-muted/45 p-4 font-mono text-sm leading-6">
            <code>{step.code}</code>
          </pre>
        ) : null}
      </article>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          className="h-11 rounded-lg px-4"
          disabled={isFirst}
          onClick={() => moveTo(Math.max(0, currentIndex - 1))}
          type="button"
          variant="outline"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Previous
        </Button>
        {isFinal ? (
          <p className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
            <CheckIcon aria-hidden="true" className="size-4" />
            All parts viewed
          </p>
        ) : (
          <Button
            className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/40"
            onClick={() =>
              moveTo(Math.min(block.steps.length - 1, currentIndex + 1))
            }
            type="button"
          >
            Next
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
}
