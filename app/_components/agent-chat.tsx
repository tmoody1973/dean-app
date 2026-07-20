"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  GraduationCapIcon,
  KeyRoundIcon,
  LibraryIcon,
  MessageCircleIcon,
  PlusIcon,
  RouteIcon,
  UserIcon,
} from "lucide-react";
import {
  Fragment,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import type { GradeExerciseInput } from "@/lib/grading/contracts";
import { projectGradeAttempts } from "@/lib/grading/grading-events";
import {
  DEMO_ACCESS_REQUIRED,
  DEMO_ACCESS_STORAGE_KEY,
  DEMO_PASSCODE_HEADER,
} from "@/lib/demo-access";
import {
  createDemoDisplay,
  type CurriculumRouteItem,
} from "@/lib/demo-display";
import { getTrackSpec, type TrackId, type TrackSpec } from "@/lib/track-spec";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentMessage } from "./agent-message";
import {
  AdaptationMoment,
  CurriculumBirth,
  DemoCapabilities,
  DemoComposerPrompt,
  TrackPicker,
  TrackSignal,
} from "./demo-moments";

type AgentStatus = ReturnType<typeof useEveAgent>["status"];

const MODULE_COMPLETION_TIMEOUT_MS = 75_000;

export function AgentChat() {
  const [accessCode, setAccessCode] = useState<string | null>(null);

  useEffect(() => {
    if (!DEMO_ACCESS_REQUIRED) return;
    setAccessCode(window.sessionStorage.getItem(DEMO_ACCESS_STORAGE_KEY));
  }, []);

  const unlock = (passcode: string) => {
    const trimmed = passcode.trim();
    if (trimmed.length === 0) return;

    window.sessionStorage.setItem(DEMO_ACCESS_STORAGE_KEY, trimmed);
    setAccessCode(trimmed);
  };

  const lock = () => {
    window.sessionStorage.removeItem(DEMO_ACCESS_STORAGE_KEY);
    setAccessCode(null);
  };

  if (DEMO_ACCESS_REQUIRED && accessCode === null) {
    return <DemoAccessGate onUnlock={unlock} />;
  }

  return <LearningSession accessCode={accessCode} onChangePasscode={lock} />;
}

function LearningSession({
  accessCode,
  onChangePasscode,
}: {
  readonly accessCode: string | null;
  readonly onChangePasscode: () => void;
}) {
  const agent = useEveAgent({
    headers: accessCode
      ? () => ({ [DEMO_PASSCODE_HEADER]: accessCode })
      : undefined,
  });
  const completedModuleIds = useRef(new Set<string>());
  const completingModuleIds = useRef(new Set<string>());
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = agent.data.messages.length === 0;
  const gradeAttempts = useMemo(
    () => projectGradeAttempts(agent.events),
    [agent.events],
  );
  const demo = useMemo(
    () => createDemoDisplay(agent.data.messages),
    [agent.data.messages],
  );
  const selectedTrack = getTrackSpec(demo.selectedTrackId);

  const handleExerciseSubmit = async (submission: GradeExerciseInput) => {
    await agent.send({
      message: "Check my current exercise.",
      clientContext: {
        type: "dean.exercise-submission.v1",
        submission,
      },
    });
  };

  const handleModuleComplete = async (moduleId: string) => {
    if (completedModuleIds.current.has(moduleId)) return;
    if (isBusy || completingModuleIds.current.has(moduleId)) {
      throw new Error("A request is already in progress.");
    }

    completingModuleIds.current.add(moduleId);
    const request = agent.send({
      message: "Continue my current learning path.",
      clientContext: {
        type: "dean.module-completion.v1",
        moduleId,
      },
    });
    request.catch(() => undefined);

    try {
      await withTimeout(request, MODULE_COMPLETION_TIMEOUT_MS);
      completedModuleIds.current.add(moduleId);
    } catch (error) {
      if (isTimeoutError(error)) {
        agent.stop();
        throw new Error(
          "Dean took too long to advance. I stopped the request so you can try again.",
        );
      }
      throw error;
    } finally {
      completingModuleIds.current.delete(moduleId);
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isBusy) return;

    if (message.files.length === 0) {
      await agent.send({ message: text });
      return;
    }

    const parts: UserContent = [];
    if (text.length > 0) {
      parts.push({ text, type: "text" });
    }
    for (const file of message.files) {
      parts.push({
        data: file.url,
        filename: file.filename,
        mediaType: file.mediaType,
        type: "file",
      });
    }

    await agent.send({ message: parts });
  };

  const handleTrackSelect = async (trackId: TrackId, message: string) => {
    if (isBusy) return;
    await agent.send({ message });
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea placeholder="Ask Dean to explain, quiz, adapt, or continue…" />
      <PromptInputSubmit onStop={agent.stop} status={agent.status} />
    </PromptInput>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {isEmpty ? null : (
        <LearningWorkspace
          agentStatus={agent.status}
          composer={composer}
          error={agent.error?.message ?? null}
          onChangePasscode={onChangePasscode}
          routeItems={demo.routeItems}
          selectedTrack={selectedTrack}
        >
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-4xl gap-6 px-4 py-6 sm:px-6">
              {agent.data.messages.map((message, index) => (
                <Fragment key={message.id}>
                  {demo.birthMessageIndex === index ? (
                    <CurriculumBirth writes={demo.birthWrites} />
                  ) : null}
                  {demo.adaptation?.messageIndex === index ? (
                    <AdaptationMoment adaptation={demo.adaptation} />
                  ) : null}
                  <AgentMessage
                    canRespond={!isBusy}
                    canCompleteModule={!isBusy}
                    canSubmitExercise={!isBusy}
                    gradeAttempts={gradeAttempts}
                    isStreaming={
                      agent.status === "streaming" &&
                      index === agent.data.messages.length - 1
                    }
                    message={message}
                    onExerciseSubmit={handleExerciseSubmit}
                    onInputResponses={(inputResponses) =>
                      agent.send({ inputResponses })
                    }
                    onModuleComplete={handleModuleComplete}
                  />
                </Fragment>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </LearningWorkspace>
      )}

      {isEmpty ? (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:px-6 sm:py-12">
          <>
            <TrackPicker disabled={isBusy} onSelect={handleTrackSelect} />
            <DemoCapabilities />
            <ScheduledReviewNotice />
          </>
          <div className="w-full">{composer}</div>
          <DemoComposerPrompt />
        </div>
      ) : null}
    </main>
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new TimeoutError());
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

class TimeoutError extends Error {
  constructor() {
    super("Timed out while advancing the lesson.");
    this.name = "TimeoutError";
  }
}

function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

function LearningWorkspace({
  agentStatus,
  children,
  composer,
  error,
  onChangePasscode,
  routeItems,
  selectedTrack,
}: {
  readonly agentStatus: AgentStatus;
  readonly children: ReactNode;
  readonly composer: ReactNode;
  readonly error: string | null;
  readonly onChangePasscode: () => void;
  readonly routeItems: readonly CurriculumRouteItem[];
  readonly selectedTrack: TrackSpec | null;
}) {
  const routeSummary = summarizeRoute(routeItems);

  return (
    <section className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem]">
      <aside className="hidden border-r border-rule bg-card/72 px-3 py-4 lg:flex lg:flex-col">
        <div className="mb-7 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCapIcon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="font-semibold tracking-[-0.02em]">Dean</p>
            <p className="text-muted-foreground text-xs">Tutor workspace</p>
          </div>
        </div>
        <nav className="grid gap-1 text-sm">
          <WorkspaceNavItem
            active
            icon={<BookOpenIcon />}
            label="Current Tutor"
          />
          <WorkspaceNavItem icon={<PlusIcon />} label="Build New Tutor" />
          <WorkspaceNavItem icon={<LibraryIcon />} label="Tutor Library" />
          <WorkspaceNavItem icon={<UserIcon />} label="Profile" />
        </nav>
        <div className="mt-auto rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <p className="font-medium">Adaptive route</p>
          <p className="mt-1 text-muted-foreground text-xs leading-5">
            Dean updates the path from your answers, checks, and saved work.
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-rule bg-background/82 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                <StatusDot status={agentStatus} />
                Current path
              </p>
              <h1 className="mt-1 truncate font-semibold text-xl tracking-[-0.03em] sm:text-2xl">
                {selectedTrack?.name ?? "Dean tutor"}
              </h1>
            </div>
            {selectedTrack ? <TrackSignal track={selectedTrack} /> : null}
          </div>
          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border bg-card text-center text-sm">
            <span className="border-r px-3 py-2 font-medium text-primary">
              Learn
            </span>
            <span className="border-r px-3 py-2 text-muted-foreground">
              Explain differently
            </span>
            <span className="px-3 py-2 text-muted-foreground">Practice</span>
          </div>
          <CompactRouteSummary summary={routeSummary} />
        </header>

        {error ? (
          <div className="shrink-0 px-4 pt-3 sm:px-6">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Request failed</p>
                <p className="mt-0.5 text-muted-foreground">{error}</p>
                {DEMO_ACCESS_REQUIRED ? (
                  <Button
                    className="mt-2"
                    onClick={onChangePasscode}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Enter a different passcode
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {children}

        <div className="shrink-0 border-t border-rule bg-background/92 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <MessageCircleIcon aria-hidden="true" className="size-3.5" />
              Ask Dean to adapt the lesson, simplify the idea, or quiz you.
            </div>
            {composer}
          </div>
        </div>
      </section>

      <aside className="hidden min-w-0 border-l border-rule bg-card/72 xl:flex xl:flex-col">
        <div className="border-b px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              <RouteIcon aria-hidden="true" className="size-3.5" />
              Learning route
            </p>
            <span className="rounded-full border bg-background px-2 py-1 text-muted-foreground text-xs tabular-nums">
              {routeSummary.doneCount}/{routeSummary.totalCount}
            </span>
          </div>
          <h2 className="mt-2 text-pretty font-semibold leading-6">
            {selectedTrack?.outcome ??
              "A generated path that adapts as you work"}
          </h2>
        </div>
        <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {routeItems.map((item) => (
            <li
              className={cn(
                "rounded-lg border p-3 text-sm",
                item.state === "active"
                  ? "border-primary/35 bg-primary/5"
                  : "bg-background/62",
              )}
              key={item.title}
            >
              <div className="flex items-start gap-2">
                {item.state === "done" ? (
                  <CheckCircle2Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-success"
                  />
                ) : item.state === "active" ? (
                  <CircleIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 fill-primary text-primary"
                  />
                ) : (
                  <CircleIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground/45"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground text-xs leading-5">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

type RouteSummary = {
  readonly activeDescription: string;
  readonly activeTitle: string;
  readonly doneCount: number;
  readonly isComplete: boolean;
  readonly locationPercent: number;
  readonly stepNumber: number;
  readonly totalCount: number;
};

function CompactRouteSummary({ summary }: { readonly summary: RouteSummary }) {
  return (
    <section className="mt-3 rounded-lg border border-rule bg-card/72 p-3 xl:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            <RouteIcon aria-hidden="true" className="size-3.5" />
            Route progress
          </p>
          <p className="mt-1 truncate font-medium">{summary.activeTitle}</p>
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-5">
            {summary.activeDescription}
          </p>
        </div>
        <span className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-muted-foreground text-xs tabular-nums">
          {summary.isComplete
            ? "Complete"
            : `Step ${summary.stepNumber}/${summary.totalCount}`}
        </span>
      </div>
      <div
        aria-label={
          summary.isComplete
            ? "Learning route complete"
            : `Learning route progress: step ${summary.stepNumber} of ${summary.totalCount}`
        }
        aria-valuemax={summary.totalCount}
        aria-valuemin={1}
        aria-valuenow={summary.stepNumber}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out motion-reduce:transition-none"
          style={{ width: `${summary.locationPercent}%` }}
        />
      </div>
      <p className="mt-2 text-muted-foreground text-xs">
        {summary.doneCount} of {summary.totalCount} route steps complete.
      </p>
    </section>
  );
}

function summarizeRoute(
  routeItems: readonly CurriculumRouteItem[],
): RouteSummary {
  const totalCount = Math.max(routeItems.length, 1);
  const doneCount = routeItems.filter((item) => item.state === "done").length;
  const isComplete = routeItems.length > 0 && doneCount === routeItems.length;
  const activeIndex = routeItems.findIndex((item) => item.state === "active");
  const resolvedIndex = isComplete
    ? routeItems.length - 1
    : activeIndex >= 0
      ? activeIndex
      : 0;
  const activeItem = routeItems[resolvedIndex] ?? {
    description: "Dean turns your goal into a visible route.",
    state: "active",
    title: "Tutor route",
  };
  const stepNumber = Math.min(totalCount, Math.max(1, resolvedIndex + 1));

  return {
    activeDescription: activeItem.description,
    activeTitle: activeItem.title,
    doneCount,
    isComplete,
    locationPercent: isComplete ? 100 : (stepNumber / totalCount) * 100,
    stepNumber,
    totalCount,
  };
}

function WorkspaceNavItem({
  active = false,
  icon,
  label,
}: {
  readonly active?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      {label}
    </span>
  );
}

function DemoAccessGate({
  onUnlock,
}: {
  readonly onUnlock: (passcode: string) => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passcode.trim().length === 0) {
      setMessage("Enter the shared demo passcode to continue.");
      return;
    }

    setMessage(null);
    onUnlock(passcode);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <form
        className="w-full max-w-sm space-y-5 rounded-xl border border-rule bg-card p-6"
        onSubmit={handleSubmit}
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRoundIcon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="font-semibold text-xl tracking-tight">
            Dean demo access
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the shared passcode supplied with this demo.
          </p>
        </div>
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="dean-demo-passcode">
            Passcode
          </label>
          <Input
            autoComplete="current-password"
            id="dean-demo-passcode"
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
            value={passcode}
          />
          {message ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </div>
        <Button className="w-full" type="submit">
          Open Dean
        </Button>
        <p className="text-xs text-muted-foreground">
          The passcode stays only in this browser tab and is sent directly to
          Dean’s protected session route.
        </p>
      </form>
    </main>
  );
}

function ScheduledReviewNotice() {
  return (
    <aside
      className="flex w-full max-w-3xl items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-left text-sm"
      role="status"
    >
      <Clock3Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <div>
        <p className="font-medium">Review check-in is scheduled</p>
        <p className="mt-0.5 text-muted-foreground">
          Eve prepares the same follow-up prompt every 30 minutes. This browser
          demo does not push into a parked tab, so the schedule is intentionally
          shown as a triggerable simulation rather than a claimed delivery.
        </p>
      </div>
    </aside>
  );
}

function StatusDot({ status }: { readonly status: AgentStatus }) {
  const isLive = status === "submitted" || status === "streaming";
  const tone =
    status === "error"
      ? "bg-destructive"
      : isLive
        ? "bg-success"
        : status === "ready"
          ? "bg-muted-foreground"
          : "bg-muted-foreground/50";

  return (
    <span className="relative flex size-1">
      {isLive ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            tone,
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-1 rounded-full transition-colors",
          tone,
        )}
      />
    </span>
  );
}
