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

type EveFilePart = Extract<EveMessagePart, { type: "file"; }>;

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

  return (
    <Message
      data-optimistic={message.metadata?.optimistic ? "true" : undefined}
      from={message.role}
    >
      <MessageContent>
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

      if (part.toolName === "write_file") {
        return <WorkspaceFileWrite part={part} />;
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

function WorkspaceFileWrite({ part }: { readonly part: EveDynamicToolPart; }) {
  const file = safeWorkspaceFile(part.input);
  const state = workspaceWriteState(part.state);
  const Icon =
    state.kind === "completed"
      ? CheckCircleIcon
      : state.kind === "error"
        ? XCircleIcon
        : LoaderCircleIcon;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm",
        state.kind === "completed"
          ? "border-success/25 bg-success/5"
          : state.kind === "error"
            ? "border-destructive/25 bg-destructive/5"
            : "border-primary/25 bg-primary/5",
      )}
      data-testid="workspace-file-write"
      role="status"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background/70">
        <FileIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{file.basename}</span>
        <code
          className="block truncate text-muted-foreground text-xs"
          title={file.path}
        >
          {file.path}
        </code>
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-xs",
          state.kind === "completed"
            ? "text-success"
            : state.kind === "error"
              ? "text-destructive"
              : "text-primary",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5",
            state.kind === "streaming" &&
            "animate-spin motion-reduce:animate-none",
          )}
        />
        {state.label}
      </span>
    </div>
  );
}

function safeWorkspaceFile(input: unknown): {
  readonly basename: string;
  readonly path: string;
} {
  if (!isRecord(input) || typeof input.filePath !== "string") {
    return { basename: "Workspace file", path: "/workspace/…" };
  }

  const rawPath = input.filePath.trim();
  if (
    !rawPath.startsWith("/workspace/") ||
    /[\\\u0000-\u001f\u007f]/u.test(rawPath)
  ) {
    return { basename: "Workspace file", path: "/workspace/…" };
  }

  const segments: string[] = [];
  for (const segment of rawPath.slice("/workspace/".length).split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (segments.length === 0) {
        return { basename: "Workspace file", path: "/workspace/…" };
      }
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  if (segments.length === 0) {
    return { basename: "Workspace file", path: "/workspace/…" };
  }

  return {
    basename: segments.at(-1) ?? "Workspace file",
    path: `/workspace/${segments.join("/")}`,
  };
}

function workspaceWriteState(state: EveDynamicToolPart["state"]): {
  readonly kind: "streaming" | "completed" | "error";
  readonly label: string;
} {
  if (state === "output-available")
    return { kind: "completed", label: "Written" };
  if (state === "output-error" || state === "output-denied") {
    return { kind: "error", label: "Write failed" };
  }
  return { kind: "streaming", label: "Writing" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function AttachmentPart({ part }: { readonly part: EveFilePart; }) {
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
