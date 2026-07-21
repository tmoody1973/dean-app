"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  FileTextIcon,
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
import {
  createTutorBlueprint,
  createTutorLaunchMessage,
  type TutorBlueprint,
  type TutorPlanStep,
} from "@/lib/tutor-builder";
import {
  getTrackSpec,
  TRACK_CATALOG,
  type TrackId,
  type TrackSpec,
} from "@/lib/track-spec";
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
type WorkspaceView = "current" | "build" | "library" | "profile";

type TutorDraft = TutorBlueprint & {
  readonly createdAt: string;
  readonly id: string;
};

const MODULE_COMPLETION_TIMEOUT_MS = 75_000;
const TUTOR_LIBRARY_STORAGE_KEY = "dean.tutor-library.v1";

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
  const didLoadTutorLibrary = useRef(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("current");
  const [tutorDrafts, setTutorDrafts] = useState<readonly TutorDraft[]>([]);
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

  useEffect(() => {
    const stored = window.localStorage.getItem(TUTOR_LIBRARY_STORAGE_KEY);
    if (stored !== null) {
      setTutorDrafts(parseTutorDrafts(stored));
    }
    didLoadTutorLibrary.current = true;
  }, []);

  useEffect(() => {
    if (!didLoadTutorLibrary.current) return;
    window.localStorage.setItem(
      TUTOR_LIBRARY_STORAGE_KEY,
      JSON.stringify(tutorDrafts),
    );
  }, [tutorDrafts]);

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
    setWorkspaceView("current");
    await agent.send({ message });
  };

  const createTutorDraft = (blueprint: TutorBlueprint): TutorDraft => {
    const createdDraft: TutorDraft = {
      ...blueprint,
      createdAt: new Date().toISOString(),
      id: createLocalId(),
    };
    setTutorDrafts((current) => [createdDraft, ...current].slice(0, 12));
    return createdDraft;
  };

  const handleCreateTutorDraft = (blueprint: TutorBlueprint) => {
    createTutorDraft(blueprint);
    setWorkspaceView("library");
  };

  const handleStartTutorDraft = async (blueprint: TutorBlueprint) => {
    if (isBusy) return;
    const draft = isSavedTutorDraft(blueprint)
      ? blueprint
      : createTutorDraft(blueprint);
    completedModuleIds.current = new Set<string>();
    completingModuleIds.current = new Set<string>();
    agent.reset();
    setWorkspaceView("current");
    await agent.send({
      message: createTutorLaunchMessage(draft),
      clientContext: {
        tutor: {
          goal: draft.goal,
          id: draft.id,
          name: draft.name,
          steps: draft.steps.map(({ evidence, title }) => ({
            evidence,
            title,
          })),
          trackId: draft.trackId,
          workContext: draft.workContext,
        },
        type: "dean.custom-tutor-launch.v1",
      },
    });
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
          draftTutors={tutorDrafts}
          error={agent.error?.message ?? null}
          isBusy={isBusy}
          onCreateTutorDraft={handleCreateTutorDraft}
          onStartTutorDraft={handleStartTutorDraft}
          onChangePasscode={onChangePasscode}
          routeItems={demo.routeItems}
          selectedTrack={selectedTrack}
          workspaceView={workspaceView}
          onWorkspaceViewChange={setWorkspaceView}
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
          {workspaceView === "build" ? (
            <BuildNewTutorPanel
              disabled={isBusy}
              onCancel={() => setWorkspaceView("current")}
              onCreateTutorDraft={handleCreateTutorDraft}
              onStartTutorDraft={handleStartTutorDraft}
            />
          ) : (
            <>
              <TrackPicker disabled={isBusy} onSelect={handleTrackSelect} />
              <Button
                className="gap-2"
                disabled={isBusy}
                onClick={() => setWorkspaceView("build")}
                type="button"
                variant="outline"
              >
                <PlusIcon aria-hidden="true" className="size-4" />
                Build a custom tutor
              </Button>
              <DemoCapabilities />
              <ScheduledReviewNotice />
              <div className="w-full">{composer}</div>
              <DemoComposerPrompt />
            </>
          )}
        </div>
      ) : null}
    </main>
  );
}

function parseTutorDrafts(value: string): readonly TutorDraft[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item) => {
        const draft = normalizeTutorDraft(item);
        return draft === null ? [] : [draft];
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

function normalizeTutorDraft(value: unknown): TutorDraft | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.createdAt !== "string" ||
    typeof value.goal !== "string" ||
    typeof value.id !== "string" ||
    !isTrackId(value.trackId) ||
    typeof value.workContext !== "string"
  ) {
    return null;
  }

  const blueprint = createTutorBlueprint({
    goal: value.goal,
    trackId: value.trackId,
    workContext: value.workContext,
  });

  return {
    ...blueprint,
    createdAt: value.createdAt,
    id: value.id,
  };
}

function isTrackId(value: unknown): value is TrackId {
  return (
    value === "data-to-decision" ||
    value === "build-work-tool-codex" ||
    value === "executive-communication"
  );
}

function isSavedTutorDraft(value: TutorBlueprint): value is TutorDraft {
  return (
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "id" in value &&
    typeof value.id === "string"
  );
}

function createLocalId(): string {
  return window.crypto?.randomUUID?.() ?? `draft-${Date.now()}`;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function LearningWorkspace({
  agentStatus,
  children,
  composer,
  draftTutors,
  error,
  isBusy,
  onCreateTutorDraft,
  onStartTutorDraft,
  onChangePasscode,
  routeItems,
  selectedTrack,
  workspaceView,
  onWorkspaceViewChange,
}: {
  readonly agentStatus: AgentStatus;
  readonly children: ReactNode;
  readonly composer: ReactNode;
  readonly draftTutors: readonly TutorDraft[];
  readonly error: string | null;
  readonly isBusy: boolean;
  readonly onCreateTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly onStartTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly onChangePasscode: () => void;
  readonly routeItems: readonly CurriculumRouteItem[];
  readonly selectedTrack: TrackSpec | null;
  readonly workspaceView: WorkspaceView;
  readonly onWorkspaceViewChange: (view: WorkspaceView) => void;
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
            active={workspaceView === "current"}
            icon={<BookOpenIcon />}
            label="Current Tutor"
            onClick={() => onWorkspaceViewChange("current")}
          />
          <WorkspaceNavItem
            active={workspaceView === "build"}
            icon={<PlusIcon />}
            label="Build New Tutor"
            onClick={() => onWorkspaceViewChange("build")}
          />
          <WorkspaceNavItem
            active={workspaceView === "library"}
            badge={draftTutors.length > 0 ? String(draftTutors.length) : null}
            icon={<LibraryIcon />}
            label="Tutor Library"
            onClick={() => onWorkspaceViewChange("library")}
          />
          <WorkspaceNavItem
            active={workspaceView === "profile"}
            icon={<UserIcon />}
            label="Profile"
            onClick={() => onWorkspaceViewChange("profile")}
          />
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

        {workspaceView === "current" ? (
          children
        ) : (
          <WorkspacePanel
            draftTutors={draftTutors}
            isBusy={isBusy}
            onCreateTutorDraft={onCreateTutorDraft}
            onStartTutorDraft={onStartTutorDraft}
            onShowCurrentTutor={() => onWorkspaceViewChange("current")}
            routeSummary={routeSummary}
            selectedTrack={selectedTrack}
            view={workspaceView}
          />
        )}

        <div
          className={cn(
            "shrink-0 border-t border-rule bg-background/92 px-4 py-4 backdrop-blur sm:px-6",
            workspaceView !== "current" && "hidden",
          )}
        >
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

function WorkspacePanel({
  draftTutors,
  isBusy,
  onCreateTutorDraft,
  onStartTutorDraft,
  onShowCurrentTutor,
  routeSummary,
  selectedTrack,
  view,
}: {
  readonly draftTutors: readonly TutorDraft[];
  readonly isBusy: boolean;
  readonly onCreateTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly onStartTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly onShowCurrentTutor: () => void;
  readonly routeSummary: RouteSummary;
  readonly selectedTrack: TrackSpec | null;
  readonly view: WorkspaceView;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        {view === "build" ? (
          <BuildNewTutorPanel
            disabled={isBusy}
            onCreateTutorDraft={onCreateTutorDraft}
            onStartTutorDraft={onStartTutorDraft}
          />
        ) : null}
        {view === "library" ? (
          <TutorLibraryPanel
            draftTutors={draftTutors}
            onShowCurrentTutor={onShowCurrentTutor}
            onStartTutorDraft={onStartTutorDraft}
            routeSummary={routeSummary}
            selectedTrack={selectedTrack}
          />
        ) : null}
        {view === "profile" ? (
          <ProfilePanel
            draftCount={draftTutors.length}
            routeSummary={routeSummary}
            selectedTrack={selectedTrack}
          />
        ) : null}
      </div>
    </div>
  );
}

function BuildNewTutorPanel({
  disabled,
  onCancel,
  onCreateTutorDraft,
  onStartTutorDraft,
}: {
  readonly disabled: boolean;
  readonly onCancel?: () => void;
  readonly onCreateTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly onStartTutorDraft: (blueprint: TutorBlueprint) => void;
}) {
  const [trackId, setTrackId] = useState<TrackId | "auto">("auto");
  const [goal, setGoal] = useState("");
  const [workContext, setWorkContext] = useState("");
  const [blueprint, setBlueprint] = useState<TutorBlueprint | null>(null);

  const resetPreview = () => {
    setBlueprint(null);
  };

  const generatePlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedGoal = goal.trim();
    if (trimmedGoal.length === 0) return;

    setBlueprint(
      createTutorBlueprint({
        goal: trimmedGoal,
        trackId: trackId === "auto" ? undefined : trackId,
        workContext,
      }),
    );
  };

  const savePlan = () => {
    if (blueprint === null) return;
    onCreateTutorDraft(blueprint);
    setBlueprint(null);
    setGoal("");
    setWorkContext("");
    setTrackId("auto");
  };

  const startPlan = () => {
    if (blueprint === null) return;
    onStartTutorDraft(blueprint);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-card">
      <div className="border-b bg-primary/5 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              Build New Tutor
            </p>
            <h2 className="mt-2 font-semibold text-2xl tracking-[-0.035em]">
              Generate a tutor plan from a goal
            </h2>
          </div>
          {onCancel ? (
            <Button onClick={onCancel} type="button" variant="outline">
              Back to paths
            </Button>
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
          Dean turns the learner goal into a concrete roadmap, saves it to the
          Library, then launches the closest verified Build Week tutor path.
          This keeps the demo honest while making the product loop feel real.
        </p>
      </div>

      <form className="grid gap-5 p-5 sm:p-7" onSubmit={generatePlan}>
        <div className="grid gap-2">
          <label className="font-medium text-sm" htmlFor="new-tutor-goal">
            What should this tutor help with?
          </label>
          <Input
            disabled={disabled}
            id="new-tutor-goal"
            onChange={(event) => {
              setGoal(event.target.value);
              resetPreview();
            }}
            placeholder="Example: Help me turn campaign data into a budget recommendation"
            value={goal}
          />
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-sm" htmlFor="new-tutor-context">
            Work context
          </label>
          <textarea
            className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            id="new-tutor-context"
            onChange={(event) => {
              setWorkContext(event.target.value);
              resetPreview();
            }}
            placeholder="Who is learning, what work do they do, and what result should they produce?"
            value={workContext}
          />
        </div>

        <fieldset className="grid gap-3">
          <legend className="font-medium text-sm">
            Choose how Dean should route it
          </legend>
          <div className="grid gap-2 md:grid-cols-4">
            <button
              className={cn(
                "rounded-xl border p-4 text-left text-sm transition-[border-color,background-color] hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
                trackId === "auto"
                  ? "border-primary/45 bg-primary/8"
                  : "border-rule bg-background/62",
              )}
              disabled={disabled}
              onClick={() => {
                setTrackId("auto");
                resetPreview();
              }}
              type="button"
            >
              <span className="block font-medium">Let Dean choose</span>
              <span className="mt-2 block text-muted-foreground leading-5">
                Route by the words in the goal and context.
              </span>
            </button>
            {TRACK_CATALOG.map((track) => (
              <button
                className={cn(
                  "rounded-xl border p-4 text-left text-sm transition-[border-color,background-color] hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
                  track.id === trackId
                    ? "border-primary/45 bg-primary/8"
                    : "border-rule bg-background/62",
                )}
                disabled={disabled}
                key={track.id}
                onClick={() => {
                  setTrackId(track.id);
                  resetPreview();
                }}
                type="button"
              >
                <span className="block font-medium">{track.name}</span>
                <span className="mt-2 block text-muted-foreground leading-5">
                  {track.outcome}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="max-w-xl text-muted-foreground text-xs">
            Build Week boundary: Dean can create a plan for any goal, but the
            live tutor runs through one of the three verified paths.
          </p>
          <Button disabled={disabled || goal.trim().length === 0} type="submit">
            Generate tutor plan
          </Button>
        </div>
      </form>

      {blueprint ? (
        <TutorPlanPreview
          blueprint={blueprint}
          disabled={disabled}
          onSave={savePlan}
          onStart={startPlan}
        />
      ) : null}
    </section>
  );
}

function TutorPlanPreview({
  blueprint,
  disabled,
  onSave,
  onStart,
}: {
  readonly blueprint: TutorBlueprint;
  readonly disabled: boolean;
  readonly onSave: () => void;
  readonly onStart: () => void;
}) {
  return (
    <div className="border-t bg-background/48 p-5 sm:p-7">
      <div className="rounded-xl border border-rule bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              Generated plan
            </p>
            <h3 className="mt-2 font-semibold text-xl tracking-[-0.025em]">
              {blueprint.name}
            </h3>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              {blueprint.fitReason}
            </p>
          </div>
          <span className="rounded-full border bg-primary/8 px-3 py-1 text-primary text-xs">
            {blueprint.verificationLabel}
          </span>
        </div>

        <ol className="mt-5 grid gap-3">
          {blueprint.steps.map((step, index) => (
            <TutorPlanStepCard index={index} key={step.title} step={step} />
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="max-w-xl text-muted-foreground text-xs leading-5">
            Start tutor saves this plan, clears the current chat, and launches a
            clean Dean session using the selected verified path.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={disabled}
              onClick={onSave}
              type="button"
              variant="outline"
            >
              Save to Library
            </Button>
            <Button disabled={disabled} onClick={onStart} type="button">
              Start tutor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorPlanStepCard({
  index,
  step,
}: {
  readonly index: number;
  readonly step: TutorPlanStep;
}) {
  return (
    <li className="rounded-lg border border-rule bg-background/62 p-4">
      <div className="flex gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {index + 1}
        </span>
        <div>
          <p className="font-medium">{step.title}</p>
          <p className="mt-1 text-muted-foreground text-sm leading-6">
            {step.plainEnglish}
          </p>
          <p className="mt-2 text-primary text-xs">Evidence: {step.evidence}</p>
        </div>
      </div>
    </li>
  );
}

function TutorLibraryPanel({
  draftTutors,
  onShowCurrentTutor,
  onStartTutorDraft,
  routeSummary,
  selectedTrack,
}: {
  readonly draftTutors: readonly TutorDraft[];
  readonly onShowCurrentTutor: () => void;
  readonly onStartTutorDraft: (blueprint: TutorBlueprint) => void;
  readonly routeSummary: RouteSummary;
  readonly selectedTrack: TrackSpec | null;
}) {
  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-rule bg-card p-5 sm:p-7">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
          Tutor Library
        </p>
        <h2 className="mt-2 font-semibold text-2xl tracking-[-0.035em]">
          Your Dean tutors
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          This MVP keeps the active tutor plus saved local drafts visible in one
          place.
        </p>
      </div>

      {selectedTrack ? (
        <TutorCard
          actionLabel="Resume current tutor"
          description={selectedTrack.outcome}
          kicker={`${routeSummary.doneCount}/${routeSummary.totalCount} steps complete`}
          name={selectedTrack.name}
          onAction={onShowCurrentTutor}
          status={routeSummary.isComplete ? "Complete" : "Active"}
        />
      ) : null}

      {draftTutors.length > 0 ? (
        <div className="grid gap-3">
          {draftTutors.map((draft) => {
            const track = getTrackSpec(draft.trackId);
            return (
              <TutorCard
                actionLabel="Start tutor"
                description={draft.goal}
                key={draft.id}
                kicker={formatDraftDate(draft.createdAt)}
                name={draft.name}
                onAction={() => onStartTutorDraft(draft)}
                status="Draft"
                subtext={track?.verificationLabel ?? draft.verificationLabel}
                steps={draft.steps}
              />
            );
          })}
        </div>
      ) : selectedTrack ? null : (
        <EmptyLibraryState />
      )}
    </section>
  );
}

function TutorCard({
  actionLabel,
  description,
  kicker,
  name,
  onAction,
  steps,
  status,
  subtext,
}: {
  readonly actionLabel: string;
  readonly description: string;
  readonly kicker: string;
  readonly name: string;
  readonly onAction: () => void;
  readonly steps?: readonly TutorPlanStep[];
  readonly status: string;
  readonly subtext?: string;
}) {
  return (
    <article className="rounded-xl border border-rule bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            <FileTextIcon aria-hidden="true" className="size-3.5" />
            {status}
          </p>
          <h3 className="mt-2 font-semibold text-xl tracking-[-0.025em]">
            {name}
          </h3>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            {description}
          </p>
          {subtext ? (
            <p className="mt-2 text-primary text-xs">{subtext}</p>
          ) : null}
          {steps ? (
            <ol className="mt-4 grid gap-2">
              {steps.slice(0, 4).map((step, index) => (
                <li
                  className="flex gap-2 text-muted-foreground text-xs leading-5"
                  key={step.title}
                >
                  <span className="text-primary tabular-nums">
                    {index + 1}.
                  </span>
                  <span>{step.title}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground text-xs">
          {kicker}
        </span>
      </div>
      <Button
        className="mt-5"
        onClick={onAction}
        type="button"
        variant="outline"
      >
        {actionLabel}
      </Button>
    </article>
  );
}

function EmptyLibraryState() {
  return (
    <div className="rounded-xl border border-dashed border-rule bg-muted/30 p-8 text-center">
      <LibraryIcon
        aria-hidden="true"
        className="mx-auto size-8 text-muted-foreground"
      />
      <p className="mt-3 font-medium">No tutor drafts yet</p>
      <p className="mt-1 text-muted-foreground text-sm">
        Build New Tutor saves drafts here.
      </p>
    </div>
  );
}

function ProfilePanel({
  draftCount,
  routeSummary,
  selectedTrack,
}: {
  readonly draftCount: number;
  readonly routeSummary: RouteSummary;
  readonly selectedTrack: TrackSpec | null;
}) {
  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-rule bg-card p-5 sm:p-7">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
          Profile
        </p>
        <h2 className="mt-2 font-semibold text-2xl tracking-[-0.035em]">
          Demo learner profile
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Dean uses the calibration answers inside the active session as the
          learning profile. Account-level profiles are the next product layer.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ProfileStat
          label="Active tutor"
          value={selectedTrack?.name ?? "None yet"}
        />
        <ProfileStat
          label="Route progress"
          value={`${routeSummary.doneCount}/${routeSummary.totalCount}`}
        />
        <ProfileStat label="Saved drafts" value={String(draftCount)} />
      </div>
      <div className="rounded-xl border border-rule bg-card p-5 text-sm leading-6">
        <p className="font-medium">What is saved today</p>
        <p className="mt-1 text-muted-foreground">
          Tutor drafts are saved locally in this browser. The active learning
          path is managed by the current Eve session.
        </p>
      </div>
    </section>
  );
}

function ProfileStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-xl border border-rule bg-card p-5">
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="mt-2 font-semibold text-lg">{value}</p>
    </div>
  );
}

function formatDraftDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved draft";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
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
  badge = null,
  icon,
  label,
  onClick,
}: {
  readonly active?: boolean;
  readonly badge?: string | null;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded-full border border-current/20 px-1.5 py-0.5 text-[0.65rem] leading-none">
          {badge}
        </span>
      ) : null}
    </button>
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
