"use client";

import type {
  EveAuthorizationPart,
  EveDynamicToolPart,
  EveMessage,
  EveMessagePart,
} from "eve/react";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  FileIcon,
  ImageIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ModuleRenderer } from "@/components/module/ModuleRenderer";
import { Button } from "@/components/ui/button";
import type { GradeExerciseInput } from "@/lib/grading/contracts";
import type { GradeAttemptProjection } from "@/lib/grading/grading-events";
import { cn } from "@/lib/utils";

export type AgentInputResponse = {
  readonly optionId?: string;
  readonly requestId: string;
  readonly text?: string;
};

type EveFilePart = Extract<EveMessagePart, { type: "file" }>;

export function AgentMessage({
  canCompleteModule,
  canRespond,
  canSubmitExercise,
  gradeAttempts,
  isStreaming,
  message,
  onExerciseSubmit,
  onInputResponses,
  onModuleComplete,
}: {
  readonly canCompleteModule: boolean;
  readonly canRespond: boolean;
  readonly canSubmitExercise: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly isStreaming: boolean;
  readonly message: EveMessage;
  readonly onExerciseSubmit: (input: GradeExerciseInput) => Promise<void>;
  readonly onInputResponses: (
    responses: readonly AgentInputResponse[],
  ) => void | Promise<void>;
  readonly onModuleComplete: (moduleId: string) => Promise<void>;
}) {
  const lastTextIndex = message.parts.reduce(
    (last, part, index) => (part.type === "text" ? index : last),
    -1,
  );
  const workspaceWrites = collectWorkspaceWriteFiles(message.parts);

  return (
    <Message
      data-optimistic={message.metadata?.optimistic ? "true" : undefined}
      from={message.role}
    >
      <MessageContent>
        {message.role === "assistant" && workspaceWrites.length > 0 ? (
          <WorkspaceRouteUpdate files={workspaceWrites} />
        ) : null}
        {message.parts.map((part, index) => (
          <AgentMessagePart
            canCompleteModule={canCompleteModule}
            canRespond={canRespond}
            canSubmitExercise={canSubmitExercise}
            gradeAttempts={gradeAttempts}
            key={partKey(part, index)}
            onExerciseSubmit={onExerciseSubmit}
            onInputResponses={onInputResponses}
            onModuleComplete={onModuleComplete}
            part={part}
            showCaret={
              isStreaming &&
              message.role === "assistant" &&
              index === lastTextIndex
            }
          />
        ))}
      </MessageContent>
    </Message>
  );
}

function AgentMessagePart({
  canCompleteModule,
  canRespond,
  canSubmitExercise,
  gradeAttempts,
  onExerciseSubmit,
  onInputResponses,
  onModuleComplete,
  part,
  showCaret,
}: {
  readonly canCompleteModule: boolean;
  readonly canRespond: boolean;
  readonly canSubmitExercise: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly onExerciseSubmit: (input: GradeExerciseInput) => Promise<void>;
  readonly onInputResponses: (
    responses: readonly AgentInputResponse[],
  ) => void | Promise<void>;
  readonly onModuleComplete: (moduleId: string) => Promise<void>;
  readonly part: EveMessagePart;
  readonly showCaret: boolean;
}) {
  switch (part.type) {
    case "step-start":
      return null;
    case "text":
      return (
        <MessageResponse caret="block" isAnimating={showCaret}>
          {part.text}
        </MessageResponse>
      );
    case "reasoning":
      return (
        <Reasoning defaultOpen isStreaming={part.state === "streaming"}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );
    case "file":
      return <AttachmentPart part={part} />;
    case "authorization":
      return <AuthorizationPrompt part={part} />;
    case "dynamic-tool":
      if (part.toolName === "grade_exercise") {
        return null;
      }

      if (isInternalWorkspaceTool(part.toolName)) {
        return null;
      }

      if (part.toolName === "render_module") {
        return part.state === "input-streaming" ? (
          <div
            aria-label="Preparing lesson"
            className="h-80 w-full animate-pulse rounded-xl border border-rule bg-card/70 motion-reduce:animate-none"
            role="status"
          />
        ) : part.state === "output-error" ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
            role="alert"
          >
            <p className="font-medium">Lesson could not be prepared</p>
            <p className="mt-1 text-muted-foreground">
              {part.errorText ??
                "Please continue with the material already on screen."}
            </p>
          </div>
        ) : (
          <ModuleRenderer
            canCompleteModule={canCompleteModule}
            canSubmitExercise={canSubmitExercise}
            gradeAttempts={gradeAttempts}
            input={part.input}
            onExerciseSubmit={onExerciseSubmit}
            onModuleComplete={onModuleComplete}
          />
        );
      }

      return (
        <Tool
          defaultOpen={
            part.state === "approval-requested" ||
            part.state === "approval-responded"
          }
        >
          <ToolHeader
            state={part.state}
            title={part.toolName}
            toolName={part.toolName}
            type="dynamic-tool"
          />
          <ToolContent>
            <ToolInput input={part.input} />
            <InputRequestActions
              canRespond={canRespond}
              part={part}
              onInputResponses={onInputResponses}
            />
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      );
  }
}

type WorkspaceRouteFile = {
  readonly basename: string;
  readonly description: string;
  readonly label: string;
  readonly path: string;
};

function WorkspaceRouteUpdate({
  files,
}: {
  readonly files: readonly WorkspaceRouteFile[];
}) {
  const previewFiles = files.slice(0, 4);
  const extraCount = Math.max(0, files.length - previewFiles.length);
  const hasLearnerWork = files.some((file) =>
    file.path.includes("/artifacts/"),
  );
  const hasLessons = files.some(
    (file) =>
      file.path.includes("/lessons/") || file.path.endsWith("/curriculum.md"),
  );
  const title = hasLearnerWork
    ? "Your work is saved"
    : hasLessons
      ? "Dean updated your learning route"
      : "Dean updated your workspace";
  const description = hasLearnerWork
    ? "Your explanation is attached to the course record so the next step can use it."
    : "Here is the learner-facing version of what changed, without the internal file log.";

  return (
    <section
      aria-label={title}
      className="not-prose overflow-hidden rounded-xl border border-rule bg-card"
      data-testid="workspace-route-update"
    >
      <div className="border-b bg-primary/5 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircleIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
        </div>
      </div>
      <ol className="divide-y">
        {previewFiles.map((file) => (
          <li
            className="flex items-start gap-3 px-4 py-3 sm:px-5"
            key={file.path}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <FileIcon aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-sm">{file.label}</span>
              <span className="mt-0.5 block text-muted-foreground text-sm">
                {file.description}
              </span>
            </span>
            <span className="mt-1 shrink-0 text-primary text-xs">Ready</span>
          </li>
        ))}
      </ol>
      {extraCount > 0 ? (
        <p className="border-t px-4 py-3 text-muted-foreground text-xs sm:px-5">
          Plus {extraCount} supporting workspace update
          {extraCount === 1 ? "" : "s"}.
        </p>
      ) : null}
    </section>
  );
}

function collectWorkspaceWriteFiles(
  parts: readonly EveMessagePart[],
): readonly WorkspaceRouteFile[] {
  const files = new Map<string, WorkspaceRouteFile>();

  for (const part of parts) {
    if (part.type !== "dynamic-tool" || part.toolName !== "write_file") {
      continue;
    }

    const file = safeWorkspaceFile(part.input);
    if (file.path === "/workspace/…") continue;
    files.set(file.path, file);
  }

  return [...files.values()];
}

function safeWorkspaceFile(input: unknown): WorkspaceRouteFile {
  if (!isRecord(input) || typeof input.filePath !== "string") {
    return {
      basename: "Workspace file",
      description: "A supporting workspace file changed.",
      label: "Workspace update",
      path: "/workspace/…",
    };
  }

  const rawPath = input.filePath.trim();
  if (
    !rawPath.startsWith("/workspace/") ||
    /[\\\u0000-\u001f\u007f]/u.test(rawPath)
  ) {
    return {
      basename: "Workspace file",
      description: "A supporting workspace file changed.",
      label: "Workspace update",
      path: "/workspace/…",
    };
  }

  const segments: string[] = [];
  for (const segment of rawPath.slice("/workspace/".length).split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (segments.length === 0) {
        return {
          basename: "Workspace file",
          description: "A supporting workspace file changed.",
          label: "Workspace update",
          path: "/workspace/…",
        };
      }
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  if (segments.length === 0) {
    return {
      basename: "Workspace file",
      description: "A supporting workspace file changed.",
      label: "Workspace update",
      path: "/workspace/…",
    };
  }

  const path = `/workspace/${segments.join("/")}`;
  const basename = segments.at(-1) ?? "Workspace file";

  return {
    basename,
    description: workspaceFileDescription(path, basename),
    label: workspaceFileLabel(path, basename),
    path,
  };
}

function workspaceFileLabel(path: string, basename: string): string {
  if (path.endsWith("/curriculum.md")) return "Learning route";
  if (path.endsWith("/session.md")) return "Session memory";
  if (path.endsWith("/learner-profile.md")) return "Learner profile";
  if (path.includes("/lessons/")) return readableName(basename);
  if (path.includes("/revisions/")) return "Adaptation record";
  if (path.includes("/artifacts/") && basename === "LEARNER-EXPLANATION.md") {
    return "Learner explanation";
  }
  if (path.includes("/artifacts/")) return readableName(basename);
  return readableName(basename);
}

function workspaceFileDescription(path: string, basename: string): string {
  if (path.endsWith("/curriculum.md")) {
    return "The course map, current lesson, and completion state.";
  }
  if (path.endsWith("/session.md")) {
    return "The state Dean uses to choose the next useful step.";
  }
  if (path.endsWith("/learner-profile.md")) {
    return "Your goal, context, and learning preferences.";
  }
  if (path.includes("/lessons/")) {
    return "A learner-facing lesson Dean can render and check.";
  }
  if (path.includes("/revisions/")) {
    return "Evidence for how Dean adapted the route.";
  }
  if (path.includes("/artifacts/") && basename === "LEARNER-EXPLANATION.md") {
    return "Your explanation, saved verbatim for the course record.";
  }
  if (path.includes("/artifacts/")) {
    return "A saved output from your work in this path.";
  }
  return "A supporting workspace file changed.";
}

function readableName(value: string): string {
  return value
    .replace(/\.md$/u, "")
    .split(/[-_]/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isInternalWorkspaceTool(toolName: string): boolean {
  return (
    toolName === "write_file" ||
    toolName === "read_file" ||
    toolName === "list_files" ||
    toolName === "list_directory"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function AttachmentPart({ part }: { readonly part: EveFilePart }) {
  const label = part.filename ?? "Attachment";
  const detail = [part.mediaType, formatBytes(part.size)]
    .filter(Boolean)
    .join(" - ");
  const isImage = part.mediaType.startsWith("image/") && part.url !== undefined;
  const Icon = isImage ? ImageIcon : FileIcon;
  const body = (
    <span className="flex max-w-sm items-center gap-3 rounded-md border bg-background/60 p-2 text-sm">
      {isImage ? (
        <img
          alt={label}
          className="size-12 shrink-0 rounded-sm object-cover"
          src={part.url}
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {detail ? (
          <span className="block truncate text-muted-foreground">{detail}</span>
        ) : null}
      </span>
      {part.url ? (
        <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </span>
  );

  return part.url ? (
    <a href={part.url} rel="noreferrer" target="_blank">
      {body}
    </a>
  ) : (
    body
  );
}

function AuthorizationPrompt({
  part,
}: {
  readonly part: EveAuthorizationPart;
}) {
  const isAuthorized =
    part.state === "completed" && part.outcome === "authorized";
  const isCompleted = part.state === "completed";
  const Icon = isAuthorized
    ? CheckCircleIcon
    : isCompleted
      ? XCircleIcon
      : KeyRoundIcon;
  const instructions = part.authorization?.instructions;
  const shouldShowInstructions =
    instructions !== undefined && instructions !== part.description;

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border p-3",
        isAuthorized
          ? "border-success/30 bg-success/5"
          : isCompleted
            ? "border-destructive/30 bg-destructive/5"
            : "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            isAuthorized
              ? "bg-success/10 text-success"
              : isCompleted
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium text-sm">{authorizationTitle(part)}</p>
          <p className="text-muted-foreground text-sm">
            {authorizationDescription(part)}
          </p>
          {shouldShowInstructions ? (
            <p className="text-muted-foreground text-sm">{instructions}</p>
          ) : null}
          {part.state === "required" && part.authorization?.userCode ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Code</span>
              <code className="rounded-md bg-background px-2 py-1 font-mono">
                {part.authorization.userCode}
              </code>
            </div>
          ) : null}
          {part.state === "required" && part.authorization?.url ? (
            <Button asChild size="sm">
              <a href={part.authorization.url} rel="noreferrer" target="_blank">
                <ExternalLinkIcon className="size-4" />
                Sign in with {part.displayName}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function authorizationTitle(part: EveAuthorizationPart): string {
  if (part.state === "required") {
    return `Connect ${part.displayName}`;
  }
  if (part.outcome === "authorized") {
    return `${part.displayName} connected`;
  }
  return `${part.displayName} authorization ${formatAuthorizationOutcome(part.outcome)}`;
}

function authorizationDescription(part: EveAuthorizationPart): string {
  if (part.state === "required") {
    return part.description;
  }
  if (part.outcome === "authorized") {
    return `${part.displayName} connected.`;
  }
  const tail = part.reason !== undefined ? ` (${part.reason})` : "";
  return `${part.displayName} authorization ${formatAuthorizationOutcome(part.outcome)}${tail}.`;
}

function formatAuthorizationOutcome(
  outcome: NonNullable<EveAuthorizationPart["outcome"]>,
): string {
  switch (outcome) {
    case "authorized":
      return "authorized";
    case "declined":
      return "declined";
    case "failed":
      return "failed";
    case "timed-out":
      return "timed out";
  }
}

function formatBytes(size: number | undefined): string | undefined {
  if (size === undefined) {
    return undefined;
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function InputRequestActions({
  canRespond,
  onInputResponses,
  part,
}: {
  readonly canRespond: boolean;
  readonly onInputResponses: (
    responses: readonly AgentInputResponse[],
  ) => void | Promise<void>;
  readonly part: EveDynamicToolPart;
}) {
  const inputRequest = part.toolMetadata?.eve?.inputRequest;
  if (!inputRequest) {
    return null;
  }

  const inputResponse = part.toolMetadata?.eve?.inputResponse;
  const selectedOption = inputRequest.options?.find(
    (option) => option.id === inputResponse?.optionId,
  );

  return (
    <div className="space-y-3 rounded-md border border-warning/30 bg-warning/10 p-3">
      <p className="text-muted-foreground text-sm">{inputRequest.prompt}</p>
      {inputResponse ? (
        <p className="font-medium text-sm">
          Responded:{" "}
          {selectedOption?.label ??
            inputResponse.text ??
            inputResponse.optionId}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {inputRequest.options?.map((option) => (
            <Button
              disabled={!canRespond}
              key={option.id}
              onClick={() => {
                void onInputResponses([
                  {
                    optionId: option.id,
                    requestId: inputRequest.requestId,
                  },
                ]);
              }}
              size="sm"
              type="button"
              variant={option.style === "danger" ? "destructive" : "default"}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function partKey(part: EveMessagePart, index: number): string {
  switch (part.type) {
    case "authorization":
      return `authorization:${part.turnId}:${part.stepIndex}:${part.name}`;
    case "dynamic-tool":
      return part.toolCallId;
    default:
      return `${part.type}:${index}`;
  }
}
