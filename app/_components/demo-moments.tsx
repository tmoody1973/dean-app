"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileCode2Icon,
  FileTextIcon,
  GitCompareArrowsIcon,
  SparklesIcon,
} from "lucide-react";
import type { AdaptationDisplay, WorkspaceWrite } from "@/lib/demo-display";
import {
  createTrackSelectionMessage,
  TRACK_CATALOG,
  type TrackId,
  type TrackSpec,
} from "@/lib/track-spec";
import { cn } from "@/lib/utils";

export function TrackPicker({
  disabled,
  onSelect,
}: {
  readonly disabled: boolean;
  readonly onSelect: (trackId: TrackId, message: string) => Promise<void>;
}) {
  return (
    <section aria-labelledby="track-picker-title" className="w-full max-w-4xl">
      <div className="grid gap-4 rounded-xl border border-rule bg-card/88 p-3 backdrop-blur sm:p-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex min-h-[26rem] flex-col rounded-xl border border-rule bg-background/72 p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Dean / Build Week
          </p>
          <h1
            className="mt-5 max-w-xl text-balance font-semibold text-4xl leading-[0.95] tracking-[-0.055em] sm:text-6xl"
            id="track-picker-title"
          >
            Build a teacher for the work you do next.
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Choose a focused professional path. Dean compiles a visible,
            interactive learning plan and adapts as you work.
          </p>
          <div className="mt-auto grid gap-2 pt-10 text-sm">
            <WorkbenchStat label="Visible curriculum" value="Workspace files" />
            <WorkbenchStat label="Practice loop" value="Checks + feedback" />
            <WorkbenchStat label="Adaptation" value="Path rebuilds" />
          </div>
        </div>
        <div className="grid gap-2">
          {TRACK_CATALOG.map((track, index) => (
            <TrackCard
              disabled={disabled}
              index={index}
              key={track.id}
              onSelect={onSelect}
              track={track}
            />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Three prepared paths for the Build Week demo. No freeform subject
        generation yet.
      </p>
    </section>
  );
}

function WorkbenchStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-rule py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TrackCard({
  disabled,
  index,
  onSelect,
  track,
}: {
  readonly disabled: boolean;
  readonly index: number;
  readonly onSelect: (trackId: TrackId, message: string) => Promise<void>;
  readonly track: TrackSpec;
}) {
  const isHero = track.id === "data-to-decision";

  return (
    <button
      className={cn(
        "group relative flex min-h-36 flex-col overflow-hidden rounded-xl border bg-card p-5 text-left transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/45 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        isHero ? "border-primary/35 bg-primary/5" : "border-rule",
      )}
      disabled={disabled}
      onClick={() =>
        void onSelect(track.id, createTrackSelectionMessage(track.id))
      }
      style={{ animationDelay: `${index * 90}ms` }}
      type="button"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        <span>{isHero ? "Complete hero" : "Focused preview"}</span>
        <span className="rounded-full border border-rule px-2 py-1 text-[0.65rem] tracking-[0.12em]">
          {isHero ? "01" : index === 1 ? "02" : "03"}
        </span>
      </span>
      <span className="mt-7 block text-balance font-semibold text-2xl leading-tight tracking-[-0.035em]">
        {track.name}
      </span>
      <span className="mt-3 block text-pretty text-sm leading-6 text-muted-foreground">
        {track.outcome}
      </span>
      <span className="mt-auto block border-rule border-t pt-5">
        <span className="block text-xs font-medium text-primary">
          {track.verificationLabel}
        </span>
        <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
          Start this path{" "}
          <ArrowRightIcon
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </span>
      </span>
    </button>
  );
}

export function TrackSignal({ track }: { readonly track: TrackSpec; }) {
  return (
    <span className="hidden min-w-0 items-center gap-2 sm:flex">
      <span className="truncate text-xs font-medium text-foreground">
        {track.name}
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="truncate text-xs text-muted-foreground">
        {track.verificationLabel}
      </span>
    </span>
  );
}

export function CurriculumBirth({
  writes,
}: {
  readonly writes: readonly WorkspaceWrite[];
}) {
  if (writes.length === 0) return null;

  return (
    <section
      className="dean-moment-in mb-6 overflow-hidden rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6"
      data-testid="curriculum-birth"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <SparklesIcon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            Dean is compiling your teacher
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A durable curriculum is appearing in the workspace, one file at a
            time.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-primary/15 bg-card/80 p-3 font-mono text-xs">
        <div className="flex items-center gap-2 px-2 pb-2 text-muted-foreground">
          <FileCode2Icon aria-hidden="true" className="size-3.5" />
          <span>/workspace</span>
        </div>
        <div className="space-y-1 border-primary/15 border-l pl-3">
          {writes.map((write, index) => (
            <div
              className="dean-file-in flex items-center gap-2 rounded-lg px-2 py-1.5"
              key={`${write.path}:${index}`}
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <FileTextIcon
                aria-hidden="true"
                className="size-3.5 text-primary"
              />
              <span className="truncate">
                {write.path.replace("/workspace/", "")}
              </span>
              <CheckCircle2Icon
                aria-hidden="true"
                className="ml-auto size-3.5 text-success"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdaptationMoment({
  adaptation,
}: {
  readonly adaptation: AdaptationDisplay;
}) {
  return (
    <section
      className="dean-moment-in mb-6 overflow-hidden rounded-xl border border-primary/25 bg-card"
      data-testid="adaptation-diff"
    >
      <div className="border-primary/15 border-b bg-primary/5 px-5 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GitCompareArrowsIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold">Rebuilding this a different way</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Dean preserved the original lesson, carried the executed mistake
              forward, and rewrote the teaching plan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-2">
        <DiffSummary
          label="Before"
          modality={adaptation.beforeModality}
          tone="before"
        />
        <DiffSummary
          label="After"
          modality={adaptation.afterModality}
          tone="after"
        />
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Lesson-file diff
        </p>
        <pre className="overflow-x-auto rounded-lg border border-rule bg-code p-3.5 font-mono text-code-foreground text-xs leading-6 sm:p-4">
          <code>
            {adaptation.diff.map((line, index) => (
              <span
                className={cn(
                  "block -mx-1 rounded px-1",
                  line.kind === "added" && "bg-success/15 text-success",
                  line.kind === "removed" &&
                  "bg-destructive/15 text-destructive",
                )}
                key={`${line.kind}:${line.text}:${index}`}
              >
                <span className="mr-2 select-none text-muted-foreground">
                  {line.kind === "added"
                    ? "+"
                    : line.kind === "removed"
                      ? "−"
                      : " "}
                </span>
                {line.text || " "}
              </span>
            ))}
          </code>
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          {adaptation.caption}
        </p>
      </div>
    </section>
  );
}

function DiffSummary({
  label,
  modality,
  tone,
}: {
  readonly label: string;
  readonly modality: string | null;
  readonly tone: "after" | "before";
}) {
  return (
    <div className="bg-card px-5 py-4 sm:px-7">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-semibold text-sm",
          tone === "after" && "text-primary",
        )}
      >
        {modality ?? "preserved lesson"}
      </p>
    </div>
  );
}

export function DemoComposerPrompt() {
  return (
    <p className="mt-3 text-center text-xs text-muted-foreground">
      Or describe a supported track in your own words.
    </p>
  );
}
