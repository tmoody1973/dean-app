"use client";

import { useId, useState } from "react";

import type { LearningModuleT } from "@/lib/module-spec";

type ParameterSliderBlockData = Extract<
  LearningModuleT["blocks"][number],
  { type: "parameterSlider" }
>;

export function ParameterSliderBlock({
  block,
}: {
  readonly block: ParameterSliderBlockData;
}) {
  const [value, setValue] = useState(block.slider.initial);
  const sliderId = useId();
  const boundsAreCoherent =
    Number.isFinite(block.slider.min) &&
    Number.isFinite(block.slider.max) &&
    Number.isFinite(block.slider.step) &&
    Number.isFinite(block.slider.initial) &&
    block.slider.max > block.slider.min &&
    block.slider.step > 0 &&
    block.slider.initial >= block.slider.min &&
    block.slider.initial <= block.slider.max;
  const displayedValue = boundsAreCoherent ? value : block.slider.initial;
  const preview = block.codeTemplate.replaceAll("{{value}}", String(displayedValue));

  return (
    <section className="max-w-2xl" aria-labelledby={`${sliderId}-prompt`}>
      <p className="text-pretty text-lg leading-8" id={`${sliderId}-prompt`}>
        {block.prompt}
      </p>

      {boundsAreCoherent ? (
        <div className="mt-7 rounded-xl border border-black/8 bg-background p-5 dark:border-white/10">
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium" htmlFor={sliderId}>
              {block.slider.label}
            </label>
            <output
              className="min-w-16 rounded-lg bg-[#2753c7]/8 px-3 py-1.5 text-center font-mono font-semibold text-[#2753c7] tabular-nums dark:bg-[#8aabff]/12 dark:text-[#8aabff]"
              htmlFor={sliderId}
            >
              {value}
            </output>
          </div>
          <input
            aria-valuetext={`${block.slider.label}: ${value}`}
            className="mt-4 h-11 w-full cursor-pointer accent-[#2753c7] dark:accent-[#8aabff]"
            id={sliderId}
            max={block.slider.max}
            min={block.slider.min}
            onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
            step={block.slider.step}
            type="range"
            value={value}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{block.slider.min}</span>
            <span>{block.slider.max}</span>
          </div>
        </div>
      ) : (
        <p
          className="mt-7 rounded-xl border border-black/8 bg-black/[0.025] px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]"
          role="status"
        >
          This parameter control is unavailable because its range is incomplete.
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          <span>{block.language} preview</span>
          <span>Not executed</span>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-black/8 bg-black/[0.025] p-4 font-mono text-sm leading-6 dark:border-white/10 dark:bg-white/[0.04]">
          <code>{preview}</code>
        </pre>
        <p className="mt-2 text-sm text-muted-foreground">
          The preview updates with the control. It does not run code.
        </p>
      </div>
    </section>
  );
}
