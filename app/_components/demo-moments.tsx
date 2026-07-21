"use client";

import {
  ArrowRightIcon,
  BookCheckIcon,
  CheckCircle2Icon,
  FileCode2Icon,
  FileTextIcon,
  GitCompareArrowsIcon,
  GraduationCapIcon,
  ListChecksIcon,
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
  onBuildTutor,
  onSelect,
}: {
  readonly disabled: boolean;
  readonly onBuildTutor: () => void;
  readonly onSelect: (trackId: TrackId, message: string) => Promise<void>;
}) {
  return (
    <section aria-labelledby="track-picker-title" className="w-full max-w-6xl">
      <header className="flex items-center justify-between gap-4 border-b border-rule pb-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCapIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold tracking-[-0.03em]">Dean</p>
            <p className="text-muted-foreground text-xs">
              Professional learning, with evidence
            </p>
          </div>
        </div>
        <a
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href="#how-dean-works"
        >
          How it works
        </a>
      </header>

      <div className="grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            OpenAI Build Week · Education
          </p>
          <h1
            className="mt-5 max-w-3xl text-balance font-semibold text-5xl leading-[0.93] tracking-[-0.06em] sm:text-7xl"
            id="track-picker-title"
          >
            Turn a work goal into a tutor that shows its work.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Dean builds a focused learning path, teaches it one step at a time,
            and checks the kinds of work a person can actually verify. It is
            more than a chat answer—it is a tutor with a visible plan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
              disabled={disabled}
              onClick={() =>
                void onSelect(
                  "data-to-decision",
                  createTrackSelectionMessage("data-to-decision"),
                )
              }
              type="button"
            >
              See the full tutor flow{" "}
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </button>
            <button
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={disabled}
              onClick={onBuildTutor}
              type="button"
            >
              Build a tutor from a goal
            </button>
          </div>
          <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">
            For judges: choose the full tutor flow to see calibration,
            curriculum files, interactive lessons, checked practice, and an
            evidence-based lesson rebuild after a mistake.
          </p>
        </div>

        <aside className="relative overflow-hidden rounded-2xl border border-rule bg-card p-5 shadow-[0_24px_70px_-40px_color-mix(in_oklch,var(--primary)_70%,transparent)] sm:p-7">
          <div className="absolute -top-24 -right-24 size-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              The Dean loop
            </p>
            <p className="mt-3 max-w-md font-semibold text-2xl tracking-[-0.035em]">
              A small, visible learning system—not a blank chat window.
            </p>
            <ol className="mt-7 grid gap-3">
              <LandingProofStep
                detail="A real work goal and three short calibration answers."
                number="01"
                title="Start with context"
              />
              <LandingProofStep
                detail="Dean writes the plan into workspace files you can see."
                number="02"
                title="Compile a tutor"
              />
              <LandingProofStep
                detail="You practice, get feedback, and see what was checked."
                number="03"
                title="Learn with evidence"
              />
            </ol>
            <div className="mt-6 border-rule border-t pt-4 text-sm text-muted-foreground">
              The strongest path uses machine and structural checks; other paths
              clearly label weaker, judgment-supported feedback.
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-rule pt-8" id="dean-paths">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
              Choose a tutor
            </p>
            <h2 className="mt-2 text-balance font-semibold text-3xl tracking-[-0.045em]">
              Three paths with clear evidence boundaries
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Start with Data to Decision for the complete Build Week experience.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_0.875fr_0.875fr]">
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
        <p className="mt-4 text-sm text-muted-foreground">
          Three prepared paths for the Build Week demo. No freeform subject
          generation yet.
        </p>
      </div>
    </section>
  );
}

function LandingProofStep({
  detail,
  number,
  title,
}: {
  readonly detail: string;
  readonly number: string;
  readonly title: string;
}) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-xl border border-rule bg-background/58 p-4">
      <span className="font-mono text-xs text-primary">{number}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function DemoCapabilities() {
  return (
    <section
      aria-labelledby="dean-capabilities-title"
      className="grid w-full max-w-6xl gap-3 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div className="rounded-xl border border-rule bg-card/88 p-5 lg:row-span-2 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCapIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p
              className="font-semibold tracking-[-0.02em]"
              id="dean-capabilities-title"
            >
              What you can do in Dean today
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground text-sm leading-6">
              <CapabilityItem text="Pick one of three prepared tutor paths." />
              <CapabilityItem text="Build a custom tutor plan from a work goal." />
              <CapabilityItem text="Answer calibration questions so Dean can build a route." />
              <CapabilityItem text="Try the AI Study Partner prototype to talk through and rehearse a lesson." />
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rule bg-card/88 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <BookCheckIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold tracking-[-0.02em]">
              What Dean can check
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground text-sm leading-6">
              <CapabilityItem text="Grade bounded SQL and code-style exercises." />
              <CapabilityItem text="Unlock lesson completion only after required practice." />
              <CapabilityItem text="Save final recommendations or explanations as artifacts." />
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-rule bg-muted/35 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
            <ListChecksIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold tracking-[-0.02em]">
              Prototype boundary
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground text-sm leading-6">
              <CapabilityItem text="No open-ended 'teach me anything' generation yet." />
              <CapabilityItem text="Custom tutor plans launch through the three verified MVP paths." />
              <CapabilityItem text="Session work is demo-scoped, not a full account system." />
            </ul>
            <p className="mt-4 border-rule border-t pt-4 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">
                Future direction:
              </span>{" "}
              add more professional courses only when each one has a clear
              evidence and verification plan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilityItem({ text }: { readonly text: string }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2Icon
        aria-hidden="true"
        className="mt-1 size-3.5 shrink-0 text-primary"
      />
      <span>{text}</span>
    </li>
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
        "group relative flex min-h-64 flex-col overflow-hidden rounded-xl border bg-card p-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none",
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

export function TrackSignal({ track }: { readonly track: TrackSpec }) {
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
