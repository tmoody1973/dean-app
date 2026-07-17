"use client";

import { CheckCircleIcon, CircleXIcon, RotateCcwIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LearningModuleT } from "@/lib/module-spec";

type Quiz = Extract<
  LearningModuleT["blocks"][number],
  { type: "quiz" }
>;

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
        <legend className="text-pretty text-lg leading-8">{block.question}</legend>
        <div className="mt-6 space-y-3">
          {block.choices.map((choice, index) => {
            const choiceId = `${groupName}-${index}`;

            return (
              <label
                className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow,background-color] has-[:checked]:border-[#2753c7]/60 has-[:checked]:bg-[#2753c7]/5 has-[:focus-visible]:border-[#2753c7] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-[#2753c7]/25 has-[:disabled]:cursor-default has-[:disabled]:opacity-80 motion-reduce:transition-none dark:has-[:checked]:border-[#8aabff]/60 dark:has-[:checked]:bg-[#8aabff]/8 dark:has-[:focus-visible]:border-[#8aabff] dark:has-[:focus-visible]:ring-[#8aabff]/30"
                htmlFor={choiceId}
                key={index}
              >
                <input
                  checked={selectedIndex === index}
                  className="mt-1 size-4 shrink-0 accent-[#2753c7] dark:accent-[#8aabff]"
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
        <p className="mt-4 rounded-xl border bg-muted/40 p-4 text-sm" role="status">
          This practice question cannot be checked yet.
        </p>
      ) : null}

      {!checked ? (
        <div className="mt-6">
          <Button
            className="h-11 rounded-xl bg-[#2753c7] px-6 text-white hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
            disabled={!canCheck}
            onClick={checkAnswer}
            type="button"
          >
            Check
          </Button>
        </div>
      ) : (
        <div
          className="mt-6 rounded-xl border bg-muted/40 p-4"
          id={feedbackId}
          role="status"
        >
          <div className="flex gap-3 text-sm leading-6">
            {isCorrect ? (
              <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleXIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
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
