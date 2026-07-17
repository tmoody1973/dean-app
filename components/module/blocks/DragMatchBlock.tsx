"use client";

import { CheckCircleIcon, CircleXIcon, RotateCcwIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { checkDeclaredRelationships } from "@/lib/grading/structural-relationships";
import type { LearningModuleT } from "@/lib/module-spec";

type DragMatch = Extract<
  LearningModuleT["blocks"][number],
  { type: "dragMatch"; }
>;

type DragMatchBlockProps = {
  readonly block: DragMatch;
  readonly onCheckedChange: (checked: boolean) => void;
};

export function DragMatchBlock({
  block,
  onCheckedChange,
}: DragMatchBlockProps) {
  const [assignments, setAssignments] = useState<readonly (number | null)[]>(
    () => block.pairs.map(() => null),
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const statusId = useId();
  const rightOrder = useMemo(
    () => block.pairs.map((_, index) => (index + 1) % block.pairs.length),
    [block.pairs],
  );
  const relationshipCheck = checkDeclaredRelationships(
    assignments,
    block.pairs.length,
  );

  const chooseRight = (rightIndex: number) => {
    if (selectedLeft === null || checked) return;

    setAssignments((current) =>
      current.map((assignedRight, leftIndex) => {
        if (leftIndex === selectedLeft) return rightIndex;
        if (assignedRight === rightIndex) return null;
        return assignedRight;
      }),
    );
    setSelectedLeft(null);
  };

  const checkMatches = () => {
    if (!relationshipCheck.complete) return;

    setChecked(true);
    setSelectedLeft(null);
    onCheckedChange(relationshipCheck.satisfied);
  };

  const tryAgain = () => {
    setAssignments(block.pairs.map(() => null));
    setSelectedLeft(null);
    setChecked(false);
    onCheckedChange(false);
  };

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        Matching exercise
      </p>
      <p className="text-pretty text-lg leading-8">{block.prompt}</p>
      <p className="mt-3 text-muted-foreground text-sm">
        Choose an item on the left, then choose its match on the right.
      </p>
      <p className="mt-2 text-muted-foreground text-sm">
        Required criterion: every declared relationship must match before you
        can continue.
      </p>

      <div
        aria-describedby={statusId}
        className="mt-6 grid grid-cols-2 gap-3 sm:gap-5"
      >
        <div className="space-y-3" role="group" aria-label="Items to match">
          {block.pairs.map((pair, leftIndex) => {
            const assignedRight = assignments[leftIndex];
            const resultIsCorrect = checked && assignedRight === leftIndex;

            return (
              <div className="space-y-1.5" key={leftIndex}>
                <button
                  aria-pressed={selectedLeft === leftIndex}
                  className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-left text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-default disabled:opacity-80 motion-reduce:transition-none"
                  disabled={checked}
                  onClick={() => setSelectedLeft(leftIndex)}
                  type="button"
                >
                  <span className="block">{pair.left}</span>
                  {assignedRight !== null ? (
                    <span className="mt-1 block text-muted-foreground text-xs">
                      Matched with {block.pairs[assignedRight].right}
                    </span>
                  ) : null}
                </button>
                {checked ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    {resultIsCorrect ? (
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    ) : (
                      <CircleXIcon aria-hidden="true" className="size-3.5" />
                    )}
                    {resultIsCorrect ? "Match" : "Needs another look"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-3" role="group" aria-label="Possible matches">
          {rightOrder.map((rightIndex) => {
            const assignedLeft = assignments.findIndex(
              (assignedRight) => assignedRight === rightIndex,
            );
            const isAssigned = assignedLeft !== -1;

            return (
              <button
                aria-label={`${block.pairs[rightIndex].right}${isAssigned ? ", already matched" : ""}`}
                aria-pressed={isAssigned}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-left text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-default disabled:opacity-80 motion-reduce:transition-none aria-pressed:border-primary/55 aria-pressed:bg-primary/5"
                disabled={checked || selectedLeft === null}
                key={rightIndex}
                onClick={() => chooseRight(rightIndex)}
                type="button"
              >
                {block.pairs[rightIndex].right}
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" id={statusId} aria-live="polite">
        {selectedLeft === null
          ? `${assignments.filter((assignment) => assignment !== null).length} of ${block.pairs.length} items matched.`
          : `${block.pairs[selectedLeft].left} selected. Choose a match from the right column.`}
      </p>

      {!checked ? (
        <div className="mt-6">
          <Button
            className="h-11 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/40"
            disabled={!relationshipCheck.complete}
            onClick={checkMatches}
            type="button"
          >
            Check
          </Button>
          {!relationshipCheck.complete ? (
            <p className="mt-2 text-muted-foreground text-xs">
              Match every item before checking.
            </p>
          ) : null}
        </div>
      ) : (
        <div
          className="mt-6 rounded-lg border border-rule bg-muted/45 p-4"
          role="status"
        >
          <div className="flex gap-3 text-sm leading-6">
            {relationshipCheck.satisfied ? (
              <CheckCircleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
            ) : (
              <CircleXIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
            )}
            <div>
              <p className="font-medium">
                Relationship check: {relationshipCheck.correctCount} of{" "}
                {relationshipCheck.requiredCount} required matches correct.
              </p>
              <p className="text-muted-foreground">
                {relationshipCheck.satisfied
                  ? "The declared relationships are structurally satisfied."
                  : "All declared relationships are required to continue."}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                This structural check does not judge broader semantic
                correctness.
              </p>
              <Button
                className="mt-2 h-auto px-0 py-1"
                onClick={tryAgain}
                type="button"
                variant="link"
              >
                <RotateCcwIcon aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
