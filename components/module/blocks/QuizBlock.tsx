"use client";

import { CheckCircleIcon, CircleXIcon, RotateCcwIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LearningModuleT } from "@/lib/module-spec";

type Quiz = Extract<LearningModuleT["blocks"][number], { type: "quiz"; }>;

type QuizBlockProps = {
  readonly block: Quiz;
  readonly onCheckedChange: (checked: boolean) => void;
};

export function QuizBlock({ block, onCheckedChange }: QuizBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const groupName = useId();
  const feedbackId = useId();
  const canCheck =
    selectedIndex !== null && block.answerIndex < block.choices.length;
  const isCorrect = checked && selectedIndex === block.answerIndex;

  const checkAnswer = () => {
    if (!canCheck) return;

    setChecked(true);
    onCheckedChange(true);
  };

  const chooseAgain = () => {
    setSelectedIndex(null);
    setChecked(false);
    onCheckedChange(false);
  };

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        Knowledge check
      </p>

      <fieldset aria-describedby={checked ? feedbackId : undefined}>
        <legend className="text-pretty text-lg leading-8">
          {block.question}
        </legend>
        <div className="mt-6 space-y-3">
          {block.choices.map((choice, index) => {
            const choiceId = `${groupName}-${index}`;

            return (
              <label
                className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow,background-color] has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/30 has-[:disabled]:cursor-default has-[:disabled]:opacity-80 motion-reduce:transition-none"
                htmlFor={choiceId}
                key={index}
              >
                <input
                  checked={selectedIndex === index}
                  className="mt-1 size-4 shrink-0 accent-primary"
                  disabled={checked}
                  id={choiceId}
                  name={groupName}
                  onChange={() => setSelectedIndex(index)}
                  type="radio"
                  value={index}
                />
                <span>{choice}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {block.answerIndex >= block.choices.length ? (
        <p
          className="mt-4 rounded-lg border border-rule bg-muted/45 p-4 text-sm"
          role="status"
        >
          This practice question cannot be checked yet.
        </p>
      ) : null}

      {!checked ? (
        <div className="mt-6">
          <Button
            className="h-11 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/40"
            disabled={!canCheck}
            onClick={checkAnswer}
            type="button"
          >
            Check
          </Button>
        </div>
      ) : (
        <div
          className="mt-6 rounded-lg border border-rule bg-muted/45 p-4"
          id={feedbackId}
          role="status"
        >
          <div className="flex gap-3 text-sm leading-6">
            {isCorrect ? (
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
                Practice check: {isCorrect ? "Correct" : "Not quite"}.
              </p>
              <p className="mt-1">{block.explanation}</p>
              <p className="mt-1 text-muted-foreground">
                This practice result is not recorded.
              </p>
              <Button
                className="mt-2 h-auto px-0 py-1"
                onClick={chooseAgain}
                type="button"
                variant="link"
              >
                <RotateCcwIcon aria-hidden="true" />
                Choose again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
