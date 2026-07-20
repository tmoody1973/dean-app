"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";

import type { LearningModuleT } from "@/lib/module-spec";
import { cn } from "@/lib/utils";

type ConceptDiagramBlockData = Extract<
  LearningModuleT["blocks"][number],
  { type: "conceptDiagram" }
>;

export function ConceptDiagramBlock({
  block,
}: {
  readonly block: ConceptDiagramBlockData;
}) {
  const [expandedNodes, setExpandedNodes] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const detailBaseId = useId();
  const labelsById = useMemo(() => {
    const labels = new Map<string, string>();

    for (const node of block.nodes) {
      if (!labels.has(node.id)) labels.set(node.id, node.label);
    }

    return labels;
  }, [block.nodes]);

  const toggleNode = (index: number) => {
    setExpandedNodes((current) => {
      const next = new Set(current);

      if (next.has(index)) next.delete(index);
      else next.add(index);

      return next;
    });
  };

  return (
    <figure className="max-w-2xl">
      <figcaption className="text-pretty text-lg leading-8">
        {block.caption}
      </figcaption>

      <ul className="mt-7 grid gap-3 sm:grid-cols-2" aria-label="Concepts">
        {block.nodes.map((node, index) => {
          const isExpanded = expandedNodes.has(index);
          const detailId = `${detailBaseId}-detail-${index}`;

          return (
            <li
              className="overflow-hidden rounded-lg border border-rule bg-background"
              key={`${node.id}:${index}`}
            >
              {node.detail ? (
                <>
                  <button
                    aria-controls={detailId}
                    aria-expanded={isExpanded}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium outline-none transition-colors hover:bg-accent/45 focus-visible:ring-3 focus-visible:ring-ring/30"
                    onClick={() => toggleNode(index)}
                    type="button"
                  >
                    <span>{node.label}</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 text-primary transition-transform ",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                  {isExpanded ? (
                    <p
                      className="border-rule border-t px-4 py-3 text-sm leading-6 text-muted-foreground"
                      id={detailId}
                    >
                      {node.detail}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="flex min-h-11 items-center px-4 py-3 font-medium">
                  {node.label}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {block.edges.length > 0 ? (
        <div className="mt-8 border-rule border-t pt-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            How these ideas connect
          </p>
          <ul className="mt-3 space-y-2" aria-label="How these ideas connect">
            {block.edges.map((edge, index) => (
              <li
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted/35 px-4 py-2.5 text-sm"
                key={`${edge.from}:${edge.to}:${index}`}
              >
                <span className="font-medium">
                  {labelsById.get(edge.from) ?? edge.from}
                </span>
                <span aria-hidden="true" className="text-primary">
                  →
                </span>
                <span className="font-medium">
                  {labelsById.get(edge.to) ?? edge.to}
                </span>
                {edge.label ? (
                  <span className="text-muted-foreground">— {edge.label}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </figure>
  );
}
