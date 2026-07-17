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
      <div className="mb-7 text-center sm:mb-9">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#2753c7] uppercase">Dean / Build Week</p>
        <h1 className="mt-3 text-balance font-semibold text-4xl tracking-[-0.045em] sm:text-6xl" id="track-picker-title">
          Build a teacher for the work you do next.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          Choose one focused professional path. Dean will compile a visible, interactive learning plan around it.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
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
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Three prepared paths for the Build Week demo. No freeform subject generation yet.
      </p>
    </section>
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
        "group relative flex min-h-72 flex-col overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-1 hover:border-[#2753c7]/45 hover:shadow-[0_24px_58px_-38px_rgba(39,83,199,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2753c7] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none",
        isHero ? "border-[#2753c7]/35" : "border-black/8 dark:border-white/10",
      )}
      disabled={disabled}
      onClick={() => void onSelect(track.id, createTrackSelectionMessage(track.id))}
      style={{ animationDelay: `${index * 90}ms` }}
      type="button"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-[#2753c7] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        <span>{isHero ? "Complete hero" : "Focused preview"}</span>
        <span className="rounded-full border border-black/8 px-2 py-1 text-[0.65rem] tracking-[0.12em] dark:border-white/10">
          {isHero ? "01" : index === 1 ? "02" : "03"}
        </span>
      </span>
      <span className="mt-9 block text-balance font-semibold text-2xl leading-tight tracking-[-0.035em]">{track.name}</span>
      <span className="mt-3 block text-pretty text-sm leading-6 text-muted-foreground">{track.outcome}</span>
      <span className="mt-auto block border-black/8 border-t pt-5 dark:border-white/10">
        <span className="block text-xs font-medium text-[#2753c7] dark:text-[#8aabff]">{track.verificationLabel}</span>
        <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
          Start this path <ArrowRightIcon aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
        </span>
      </span>
    </button>
  );
}

export function TrackSignal({ track }: { readonly track: TrackSpec }) {
  return (
    <span className="hidden min-w-0 items-center gap-2 sm:flex">
      <span className="truncate text-xs font-medium text-foreground">{track.name}</span>
      <span className="h-3 w-px bg-border" />
      <span className="truncate text-xs text-muted-foreground">{track.verificationLabel}</span>
    </span>
  );
}

export function CurriculumBirth({ writes }: { readonly writes: readonly WorkspaceWrite[] }) {
  if (writes.length === 0) return null;

  return (
    <section className="dean-moment-in mb-6 overflow-hidden rounded-2xl border border-[#2753c7]/25 bg-[#f7f9ff] p-5 shadow-[0_18px_50px_-42px_rgba(39,83,199,0.45)] dark:bg-[#15203d]/35 sm:p-6" data-testid="curriculum-birth">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2753c7] text-white dark:bg-[#8aabff] dark:text-slate-950">
          <SparklesIcon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm">Dean is compiling your teacher</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">A durable curriculum is appearing in the workspace, one file at a time.</p>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-[#2753c7]/15 bg-card/75 p-3 font-mono text-xs shadow-sm">
        <div className="flex items-center gap-2 px-2 pb-2 text-muted-foreground">
          <FileCode2Icon aria-hidden="true" className="size-3.5" />
          <span>/workspace</span>
        </div>
        <div className="space-y-1 border-[#2753c7]/15 border-l pl-3">
          {writes.map((write, index) => (
            <div
              className="dean-file-in flex items-center gap-2 rounded-lg px-2 py-1.5"
              key={`${write.path}:${index}`}
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <FileTextIcon aria-hidden="true" className="size-3.5 text-[#2753c7] dark:text-[#8aabff]" />
              <span className="truncate">{write.path.replace("/workspace/", "")}</span>
              <CheckCircle2Icon aria-hidden="true" className="ml-auto size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdaptationMoment({ adaptation }: { readonly adaptation: AdaptationDisplay }) {
  return (
    <section className="dean-moment-in mb-6 overflow-hidden rounded-2xl border border-[#2753c7]/30 bg-card shadow-[0_24px_65px_-42px_rgba(39,83,199,0.46)]" data-testid="adaptation-diff">
      <div className="border-[#2753c7]/15 border-b bg-[#f7f9ff] px-5 py-5 dark:bg-[#15203d]/35 sm:px-7">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2753c7] text-white dark:bg-[#8aabff] dark:text-slate-950">
            <GitCompareArrowsIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold">Rebuilding this a different way</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Dean preserved the original lesson, carried the executed mistake forward, and rewrote the teaching plan.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-2">
        <DiffSummary label="Before" modality={adaptation.beforeModality} tone="before" />
        <DiffSummary label="After" modality={adaptation.afterModality} tone="after" />
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Lesson-file diff</p>
        <pre className="overflow-x-auto rounded-xl border bg-[#101a33] p-3.5 font-mono text-xs leading-6 text-slate-100 sm:p-4">
          <code>{adaptation.diff.map((line, index) => (
            <span
              className={cn(
                "block -mx-1 rounded px-1",
                line.kind === "added" && "bg-emerald-400/15 text-emerald-200",
                line.kind === "removed" && "bg-rose-400/15 text-rose-200",
              )}
              key={`${line.kind}:${line.text}:${index}`}
            >
              <span className="mr-2 select-none text-slate-500">{line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}</span>
              {line.text || " "}
            </span>
          ))}</code>
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">{adaptation.caption}</p>
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
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-1.5 font-semibold text-sm", tone === "after" && "text-[#2753c7] dark:text-[#8aabff]")}>{modality ?? "preserved lesson"}</p>
    </div>
  );
}

export function DemoComposerPrompt() {
  return <p className="mt-3 text-center text-xs text-muted-foreground">Or describe a supported track in your own words.</p>;
}
