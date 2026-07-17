"use client";

import { InfoIcon, LightbulbIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LearningModuleT } from "@/lib/module-spec";

type CodeExercise = Extract<
  LearningModuleT["blocks"][number],
  { type: "codeExercise" }
>;

type CodeExerciseBlockProps = {
  readonly block: CodeExercise;
  readonly onCheckedChange: (checked: boolean) => void;
};

export function CodeExerciseBlock({
  block,
  onCheckedChange,
}: CodeExerciseBlockProps) {
  const [code, setCode] = useState(block.starterCode);
  const [checked, setChecked] = useState(false);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const editorId = useId();
  const feedbackId = useId();
  const canCheck = code.trim().length > 0;
  const hasMoreHints = visibleHintCount < block.hints.length;

  const resetCheck = () => {
    setChecked(false);
    onCheckedChange(false);
  };

  const checkCode = () => {
    if (!canCheck) return;

    setChecked(true);
    onCheckedChange(true);
  };

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        Code exercise
      </p>
      <p className="text-pretty text-lg leading-8">{block.prompt}</p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="font-medium text-sm" htmlFor={editorId}>
            Your {block.language} code
          </label>
          <span className="text-muted-foreground text-xs uppercase">
            {block.language}
          </span>
        </div>
        <textarea
          aria-describedby={checked ? feedbackId : undefined}
          className="min-h-56 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-[#2753c7] focus-visible:ring-[3px] focus-visible:ring-[#2753c7]/25 motion-reduce:transition-none dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/30"
          id={editorId}
          onChange={(event) => {
            setCode(event.target.value);
            if (checked) resetCheck();
          }}
          spellCheck={false}
          value={code}
        />
      </div>

      {visibleHintCount > 0 ? (
        <ol className="mt-5 space-y-3" data-testid="code-hints">
          {block.hints.slice(0, visibleHintCount).map((hint, index) => (
            <li
              className="flex gap-3 rounded-xl border border-[#2753c7]/20 bg-[#2753c7]/5 p-4 text-sm leading-6 dark:border-[#8aabff]/25 dark:bg-[#8aabff]/8"
              key={index}
            >
              <LightbulbIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[#2753c7] dark:text-[#8aabff]"
              />
              <span>
                <span className="font-medium">Hint {index + 1}: </span>
                {hint}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <p aria-live="polite" className="sr-only" role="status">
        {visibleHintCount > 0
          ? `Hint ${visibleHintCount}: ${block.hints[visibleHintCount - 1]}`
          : ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!checked ? (
          <Button
            className="h-11 rounded-xl bg-[#2753c7] px-6 text-white hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
            disabled={!canCheck}
            onClick={checkCode}
            type="button"
          >
            Check
          </Button>
        ) : null}

        {hasMoreHints ? (
          <Button
            className="h-11"
            onClick={() =>
              setVisibleHintCount((count) =>
                Math.min(count + 1, block.hints.length),
              )
            }
            type="button"
            variant="ghost"
          >
            Show hint {visibleHintCount + 1} of {block.hints.length}
          </Button>
        ) : null}
      </div>

      {checked ? (
        <div
          className="mt-5 rounded-xl border bg-muted/40 p-4"
          id={feedbackId}
          role="status"
        >
          <div className="flex gap-3 text-sm leading-6">
            <InfoIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#2753c7] dark:text-[#8aabff]"
            />
            <div>
              <p className="font-medium">
                Code captured. Execution verification is not connected yet.
              </p>
              <Button
                className="mt-2 h-auto px-0 py-1"
                onClick={resetCheck}
                type="button"
                variant="link"
              >
                Edit code
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
