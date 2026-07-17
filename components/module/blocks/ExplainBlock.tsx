"use client";

import { Fragment, type ReactNode } from "react";

import type { LearningModuleT } from "@/lib/module-spec";

type ExplainBlockData = Extract<
  LearningModuleT["blocks"][number],
  { type: "explain"; }
>;

export function ExplainBlock({ block }: { readonly block: ExplainBlockData; }) {
  const paragraphs = block.markdown.split(/\n{2,}/);

  return (
    <article className="max-w-2xl" aria-label="Explanation">
      <p className="mb-5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
        Explanation
      </p>
      <div className="space-y-5 text-pretty text-lg leading-8 text-foreground">
        {paragraphs.map((paragraph, paragraphIndex) => (
          <p className="whitespace-pre-wrap break-words" key={paragraphIndex}>
            {renderLines(paragraph)}
          </p>
        ))}
      </div>
    </article>
  );
}

function renderLines(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, lineIndex, lines) => {
    const content = renderInline(line, lineIndex);

    return lineIndex < lines.length - 1
      ? [...content, <br key={`break-${lineIndex}`} />]
      : content;
  });
}

function renderInline(value: string, lineIndex: number): ReactNode[] {
  const tokens = value.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g);

  return tokens.map((token, tokenIndex) => {
    const key = `${lineIndex}:${tokenIndex}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          className="rounded-md border border-rule bg-muted/45 px-1.5 py-0.5 font-mono text-[0.88em]"
          key={key}
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={key}>{token}</Fragment>;
  });
}
