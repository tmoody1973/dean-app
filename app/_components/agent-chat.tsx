"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon } from "lucide-react";
import { Fragment, useMemo, useRef } from "react";
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
import { createDemoDisplay } from "@/lib/demo-display";
import { getTrackSpec, type TrackId } from "@/lib/track-spec";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import {
  AdaptationMoment,
  CurriculumBirth,
  DemoComposerPrompt,
  TrackPicker,
  TrackSignal,
} from "./demo-moments";

const AGENT_NAME = "dean";

type AgentStatus = ReturnType<typeof useEveAgent>["status"];

export function AgentChat() {
  const agent = useEveAgent();
  const completedModuleIds = useRef(new Set<string>());
  const completingModuleIds = useRef(new Set<string>());
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = agent.data.messages.length === 0;
  const gradeAttempts = useMemo(
    () => projectGradeAttempts(agent.events),
    [agent.events],
  );
  const demo = useMemo(() => createDemoDisplay(agent.data.messages), [agent.data.messages]);
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
    try {
      await agent.send({
        message: "Continue my current learning path.",
        clientContext: {
          type: "dean.module-completion.v1",
          moduleId,
        },
      });
      completedModuleIds.current.add(moduleId);
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
      <PromptInputTextarea placeholder="Send a message…" />
      <PromptInputSubmit onStop={agent.stop} status={agent.status} />
    </PromptInput>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {isEmpty ? null : (
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-black/5 border-b px-4 sm:px-6 dark:border-white/8">
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-semibold text-sm tracking-[-0.02em]">{AGENT_NAME}</span>
            <StatusDot status={agent.status} />
          </span>
          {selectedTrack ? <TrackSignal track={selectedTrack} /> : null}
        </header>
      )}

      {agent.error ? (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">Request failed</p>
              <p className="mt-0.5 text-muted-foreground">{agent.error.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {isEmpty ? null : (
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 sm:px-6">
            {agent.data.messages.map((message, index) => (
              <Fragment key={message.id}>
                {demo.birthMessageIndex === index ? <CurriculumBirth writes={demo.birthWrites} /> : null}
                {demo.adaptation?.messageIndex === index ? <AdaptationMoment adaptation={demo.adaptation} /> : null}
                <AgentMessage
                  canRespond={!isBusy}
                  canCompleteModule={!isBusy}
                  canSubmitExercise={!isBusy}
                  gradeAttempts={gradeAttempts}
                  isStreaming={
                    agent.status === "streaming" && index === agent.data.messages.length - 1
                  }
                  message={message}
                  onExerciseSubmit={handleExerciseSubmit}
                  onInputResponses={(inputResponses) => agent.send({ inputResponses })}
                  onModuleComplete={handleModuleComplete}
                />
              </Fragment>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          isEmpty
            ? "flex max-w-xl flex-1 flex-col items-center justify-center gap-8 pb-[10vh]"
            : "max-w-3xl shrink-0 pb-6",
        )}
      >
        {isEmpty ? (
          <TrackPicker disabled={isBusy} onSelect={handleTrackSelect} />
        ) : null}
        <div className="w-full">{composer}</div>
        {isEmpty ? <DemoComposerPrompt /> : null}
      </div>
    </main>
  );
}

function StatusDot({ status }: { readonly status: AgentStatus }) {
  const isLive = status === "submitted" || status === "streaming";
  const tone =
    status === "error"
      ? "bg-destructive"
      : isLive
        ? "bg-emerald-500"
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
      <span className={cn("relative inline-flex size-1 rounded-full transition-colors", tone)} />
    </span>
  );
}
