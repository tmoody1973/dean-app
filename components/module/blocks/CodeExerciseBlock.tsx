"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  CircleXIcon,
  InfoIcon,
  LightbulbIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { GradeExerciseInput } from "@/lib/grading/contracts";
import {
  findExactGradeAttempt,
  type GradeAttemptProjection,
} from "@/lib/grading/grading-events";
import type { LearningModuleT } from "@/lib/module-spec";

type CodeExercise = Extract<
  LearningModuleT["blocks"][number],
  { type: "codeExercise" }
>;

type CodeExerciseBlockProps = {
  readonly block: CodeExercise;
  readonly blockIndex: number;
  readonly canSubmit: boolean;
  readonly gradeAttempts: GradeAttemptProjection;
  readonly moduleId: string;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly onSubmit: (input: GradeExerciseInput) => Promise<void>;
};

const ARTIFACT_PROFILE_ID = "codex-node-tool-v1" as const;
const ARTIFACT_CRITERIA = [
  "README marker",
  "Exact prepared test file",
  "Node syntax",
  "Node behavior tests",
] as const;

export function CodeExerciseBlock(props: CodeExerciseBlockProps) {
  if (props.block.language === "sql") {
    return <SqlCodeExercise {...props} block={props.block} />;
  }

  if (isCanonicalArtifactBlock(props.block)) {
    return <ArtifactCodeExercise {...props} />;
  }

  return <UnverifiedCodeExercise {...props} />;
}

function isCanonicalArtifactBlock(block: CodeExercise): boolean {
  return (
    block.language === "typescript" &&
    block.grading.mode === "exactOutput" &&
    block.grading.expected === ARTIFACT_PROFILE_ID
  );
}

function SqlCodeExercise({
  block,
  blockIndex,
  canSubmit,
  gradeAttempts,
  moduleId,
  onCheckedChange,
  onSubmit,
}: CodeExerciseBlockProps & {
  readonly block: CodeExercise;
}) {
  const [code, setCode] = useState(block.starterCode);
  const [activeAttempt, setActiveAttempt] = useState<GradeExerciseInput | null>(
    null,
  );
  const [sendSettled, setSendSettled] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const handledFailures = useRef(new Set<string>());
  const editorId = useId();
  const feedbackId = useId();
  const attempt = activeAttempt
    ? findExactGradeAttempt(gradeAttempts, activeAttempt)
    : undefined;
  const result = attempt?.status === "completed" ? attempt.result : null;
  const verifiedPass = result?.error === null && result.passed;
  const deterministicFail = result?.error === null && !result.passed;
  const isSending =
    activeAttempt !== null && !sendSettled && !sendFailed;
  const isWaiting =
    isSending &&
    result === null &&
    attempt?.status !== "error";
  const retryMessage = getRetryMessage({
    activeAttempt,
    attempt,
    result,
    sendFailed,
    sendSettled,
  });
  const canCheck = code.trim().length > 0 && canSubmit && activeAttempt === null;

  useEffect(() => {
    onCheckedChange(verifiedPass === true);
  }, [onCheckedChange, verifiedPass]);

  useEffect(() => {
    if (
      !deterministicFail ||
      activeAttempt === null ||
      handledFailures.current.has(activeAttempt.attemptId)
    ) {
      return;
    }

    handledFailures.current.add(activeAttempt.attemptId);
    setVisibleHintCount((count) => Math.min(count + 1, block.hints.length));
  }, [activeAttempt, block.hints.length, deterministicFail]);

  const clearAttempt = () => {
    setActiveAttempt(null);
    setSendSettled(false);
    setSendFailed(false);
    onCheckedChange(false);
  };

  const checkCode = async () => {
    if (!canCheck) return;

    const submission = {
      attemptId: crypto.randomUUID(),
      blockIndex,
      expectedOutput: block.grading.expected,
      kind: "sql",
      mode: block.grading.mode,
      moduleId,
      setupScript: block.setupScript,
      submission: code,
    } satisfies GradeExerciseInput;

    setActiveAttempt(submission);
    setSendSettled(false);
    setSendFailed(false);
    onCheckedChange(false);

    try {
      await onSubmit(submission);
    } catch {
      setSendFailed(true);
    } finally {
      setSendSettled(true);
    }
  };

  return (
    <div className="max-w-2xl">
      <ExerciseHeading block={block} />

      <div className="mt-6">
        <EditorLabel block={block} editorId={editorId} />
        <textarea
          aria-describedby={activeAttempt ? feedbackId : undefined}
          className="min-h-56 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-[#2753c7] focus-visible:ring-[3px] focus-visible:ring-[#2753c7]/25 disabled:cursor-wait disabled:opacity-75 motion-reduce:transition-none dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/30"
          disabled={isSending}
          id={editorId}
          onChange={(event) => {
            setCode(event.target.value);
            if (activeAttempt !== null) clearAttempt();
          }}
          spellCheck={false}
          value={code}
        />
      </div>

      <HintList block={block} visibleHintCount={visibleHintCount} />

      {activeAttempt === null ? (
        <div className="mt-6">
          <Button
            className="h-11 rounded-xl bg-[#2753c7] px-6 text-white hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
            disabled={!canCheck}
            onClick={() => void checkCode()}
            type="button"
          >
            Check
          </Button>
        </div>
      ) : null}

      {activeAttempt ? (
        <div
          aria-live="polite"
          className="mt-5 rounded-xl border bg-muted/40 p-4"
          id={feedbackId}
          role="status"
        >
          {isWaiting ? (
            <FeedbackLine
              icon={<LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />}
              title="Checking your SQL with the deterministic grader…"
            />
          ) : verifiedPass ? (
            <ResultFeedback
              actualOutput={result.actualOutput}
              expectedOutput={result.expectedOutput}
              icon={<CheckCircleIcon aria-hidden="true" className="size-4" />}
              onRetry={clearAttempt}
              title="Verified by execution. Your output matches."
            />
          ) : deterministicFail ? (
            <ResultFeedback
              actualOutput={result.actualOutput}
              expectedOutput={result.expectedOutput}
              icon={<CircleXIcon aria-hidden="true" className="size-4" />}
              onRetry={clearAttempt}
              title="Not quite. The executed output did not match."
            />
          ) : (
            <ResultFeedback
              actualOutput={result?.actualOutput}
              expectedOutput={result?.expectedOutput}
              icon={<AlertCircleIcon aria-hidden="true" className="size-4" />}
              onRetry={clearAttempt}
              title={retryMessage ?? "No verified result was returned. Your code is still here."}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function ArtifactCodeExercise({
  block,
  blockIndex,
  canSubmit,
  gradeAttempts,
  moduleId,
  onCheckedChange,
  onSubmit,
}: CodeExerciseBlockProps) {
  const [activeAttempt, setActiveAttempt] = useState<GradeExerciseInput | null>(
    null,
  );
  const [sendSettled, setSendSettled] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const feedbackId = useId();
  const attempt = activeAttempt
    ? findExactGradeAttempt(gradeAttempts, activeAttempt)
    : undefined;
  const result = attempt?.status === "completed" ? attempt.result : null;
  const verifiedPass = result?.error === null && result.passed;
  const criteriaFailure =
    result !== null &&
    !result.passed &&
    (result.error === null ||
      result.error.code === "MISSING_FILE" ||
      result.error.code === "CRITERIA_MISMATCH" ||
      result.error.code === "NONZERO_EXIT");
  const isSending = activeAttempt !== null && !sendSettled && !sendFailed;
  const isWaiting =
    isSending && result === null && attempt?.status !== "error";
  const retryMessage = getArtifactRetryMessage({
    activeAttempt,
    attempt,
    result,
    sendFailed,
    sendSettled,
  });
  const state =
    activeAttempt === null
      ? "idle"
      : isWaiting
        ? "pending"
        : verifiedPass
          ? "passed"
          : criteriaFailure
            ? "failed"
            : "retry";
  const canRunChecks = canSubmit && activeAttempt === null;

  useEffect(() => {
    onCheckedChange(verifiedPass === true);
  }, [onCheckedChange, verifiedPass]);

  const clearAttempt = () => {
    setActiveAttempt(null);
    setSendSettled(false);
    setSendFailed(false);
    onCheckedChange(false);
  };

  const runArtifactChecks = async () => {
    if (!canRunChecks) return;

    const submission = {
      attemptId: crypto.randomUUID(),
      blockIndex,
      kind: "artifact",
      moduleId,
      profileId: ARTIFACT_PROFILE_ID,
    } satisfies GradeExerciseInput;

    setActiveAttempt(submission);
    setSendSettled(false);
    setSendFailed(false);
    onCheckedChange(false);

    try {
      await onSubmit(submission);
    } catch {
      setSendFailed(true);
    } finally {
      setSendSettled(true);
    }
  };

  return (
    <div
      aria-describedby={activeAttempt ? feedbackId : undefined}
      className="max-w-2xl rounded-2xl border bg-muted/20 p-5 sm:p-6"
      data-testid="artifact-verification-card"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        Artifact verification
      </p>
      <p className="mt-4 text-pretty text-lg leading-8">{block.prompt}</p>
      <p className="mt-3 text-muted-foreground text-sm leading-6">
        The approved checker verifies this controlled project against four fixed
        criteria.
      </p>

      <ul className="mt-5 space-y-2" aria-label="Artifact verification criteria">
        {ARTIFACT_CRITERIA.map((criterion) => (
          <li className="flex items-center gap-2.5 text-sm" key={criterion}>
            <ArtifactCriterionIcon state={state} />
            <span>{criterion}</span>
          </li>
        ))}
      </ul>

      {activeAttempt === null ? (
        <Button
          className="mt-6 h-11 rounded-xl bg-[#2753c7] px-6 text-white hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
          disabled={!canRunChecks}
          onClick={() => void runArtifactChecks()}
          type="button"
        >
          Run artifact checks
        </Button>
      ) : (
        <div
          aria-live="polite"
          className="mt-6 rounded-xl border bg-background/70 p-4"
          id={feedbackId}
          role="status"
        >
          {isWaiting ? (
            <FeedbackLine
              icon={<LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />}
              title="Running the fixed artifact checks…"
            />
          ) : verifiedPass ? (
            <FeedbackLine
              icon={<CheckCircleIcon aria-hidden="true" className="size-4" />}
              title="Verified. Every fixed artifact criterion passed."
            />
          ) : criteriaFailure ? (
            <ArtifactRetryFeedback
              icon={<CircleXIcon aria-hidden="true" className="size-4" />}
              message="The artifact did not satisfy every fixed criterion."
              onRetry={clearAttempt}
            />
          ) : (
            <ArtifactRetryFeedback
              icon={<AlertCircleIcon aria-hidden="true" className="size-4" />}
              message={
                retryMessage ??
                "No authoritative artifact result was returned. Run the checks again."
              }
              onRetry={clearAttempt}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ArtifactCriterionIcon({
  state,
}: {
  readonly state: "idle" | "pending" | "passed" | "failed" | "retry";
}) {
  if (state === "passed") {
    return (
      <CheckCircleIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-emerald-600"
      />
    );
  }
  if (state === "pending") {
    return (
      <LoaderCircleIcon
        aria-hidden="true"
        className="size-4 shrink-0 animate-spin"
      />
    );
  }
  if (state === "failed") {
    return (
      <CircleXIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-destructive"
      />
    );
  }
  if (state === "retry") {
    return (
      <AlertCircleIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-amber-600"
      />
    );
  }
  return (
    <InfoIcon
      aria-hidden="true"
      className="size-4 shrink-0 text-muted-foreground"
    />
  );
}

function ArtifactRetryFeedback({
  icon,
  message,
  onRetry,
}: {
  readonly icon: ReactNode;
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div>
      <FeedbackLine icon={icon} title={message} />
      <Button
        className="mt-2 h-auto px-0 py-1"
        onClick={onRetry}
        type="button"
        variant="link"
      >
        <RotateCcwIcon aria-hidden="true" />
        Try checks again
      </Button>
    </div>
  );
}

function getArtifactRetryMessage({
  activeAttempt,
  attempt,
  result,
  sendFailed,
  sendSettled,
}: {
  readonly activeAttempt: GradeExerciseInput | null;
  readonly attempt: GradeAttemptProjection["attempts"][number] | undefined;
  readonly result: GradeAttemptProjection["attempts"][number]["result"];
  readonly sendFailed: boolean;
  readonly sendSettled: boolean;
}): string | null {
  if (result?.error) return result.error.message;
  if (attempt?.status === "error") {
    return (
      attempt.protocolError?.message ??
      "The artifact checker could not complete this attempt."
    );
  }
  if (
    activeAttempt !== null &&
    (sendFailed || (sendSettled && attempt === undefined))
  ) {
    return "No matching artifact result was returned. Run the checks again.";
  }
  if (activeAttempt !== null && sendSettled && attempt?.status === "pending") {
    return "The artifact checker did not finish this attempt. Run the checks again.";
  }
  return null;
}

function UnverifiedCodeExercise({
  block,
  onCheckedChange,
}: CodeExerciseBlockProps) {
  const [code, setCode] = useState(block.starterCode);
  const [captured, setCaptured] = useState(false);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const editorId = useId();
  const feedbackId = useId();
  const canCheck = code.trim().length > 0;

  const resetCapture = () => {
    setCaptured(false);
    onCheckedChange(false);
  };

  return (
    <div className="max-w-2xl">
      <ExerciseHeading block={block} />
      <div className="mt-6">
        <EditorLabel block={block} editorId={editorId} />
        <textarea
          aria-describedby={captured ? feedbackId : undefined}
          className="min-h-56 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-[#2753c7] focus-visible:ring-[3px] focus-visible:ring-[#2753c7]/25 motion-reduce:transition-none dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/30"
          id={editorId}
          onChange={(event) => {
            setCode(event.target.value);
            if (captured) resetCapture();
          }}
          spellCheck={false}
          value={code}
        />
      </div>

      <HintList block={block} visibleHintCount={visibleHintCount} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!captured ? (
          <Button
            className="h-11 rounded-xl bg-[#2753c7] px-6 text-white hover:bg-[#2146a8] focus-visible:border-[#2753c7] focus-visible:ring-[#2753c7]/35 dark:bg-[#8aabff] dark:text-slate-950 dark:hover:bg-[#9bb7ff] dark:focus-visible:border-[#8aabff] dark:focus-visible:ring-[#8aabff]/40"
            disabled={!canCheck}
            onClick={() => {
              setCaptured(true);
              onCheckedChange(true);
            }}
            type="button"
          >
            Check
          </Button>
        ) : null}
        {visibleHintCount < block.hints.length ? (
          <Button
            className="h-11"
            onClick={() =>
              setVisibleHintCount((count) => Math.min(count + 1, block.hints.length))
            }
            type="button"
            variant="ghost"
          >
            Show hint {visibleHintCount + 1} of {block.hints.length}
          </Button>
        ) : null}
      </div>

      {captured ? (
        <div className="mt-5 rounded-xl border bg-muted/40 p-4" id={feedbackId} role="status">
          <FeedbackLine
            icon={<InfoIcon aria-hidden="true" className="size-4" />}
            title="Code captured. Deterministic verification is not connected for this language yet."
          />
          <Button className="mt-2 h-auto px-0 py-1" onClick={resetCapture} type="button" variant="link">
            Edit code
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ExerciseHeading({ block }: { readonly block: CodeExercise }) {
  return (
    <>
      <p className="mb-4 text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        Code exercise
      </p>
      <p className="text-pretty text-lg leading-8">{block.prompt}</p>
    </>
  );
}

function EditorLabel({ block, editorId }: { readonly block: CodeExercise; readonly editorId: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      <label className="font-medium text-sm" htmlFor={editorId}>
        Your {block.language} code
      </label>
      <span className="text-muted-foreground text-xs uppercase">{block.language}</span>
    </div>
  );
}

function HintList({
  block,
  visibleHintCount,
}: {
  readonly block: CodeExercise;
  readonly visibleHintCount: number;
}) {
  if (visibleHintCount === 0) return null;

  return (
    <>
      <ol className="mt-5 space-y-3" data-testid="code-hints">
        {block.hints.slice(0, visibleHintCount).map((hint, index) => (
          <li
            className="flex gap-3 rounded-xl border border-[#2753c7]/20 bg-[#2753c7]/5 p-4 text-sm leading-6 dark:border-[#8aabff]/25 dark:bg-[#8aabff]/8"
            key={index}
          >
            <LightbulbIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#2753c7] dark:text-[#8aabff]" />
            <span><span className="font-medium">Hint {index + 1}: </span>{hint}</span>
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="sr-only" role="status">
        Hint {visibleHintCount}: {block.hints[visibleHintCount - 1]}
      </p>
    </>
  );
}

function FeedbackLine({ icon, title }: { readonly icon: ReactNode; readonly title: string }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6">
      <span className="mt-0.5 shrink-0 text-[#2753c7] dark:text-[#8aabff]">{icon}</span>
      <p className="font-medium">{title}</p>
    </div>
  );
}

function ResultFeedback({
  actualOutput,
  expectedOutput,
  icon,
  onRetry,
  title,
}: {
  readonly actualOutput?: string;
  readonly expectedOutput?: string;
  readonly icon: ReactNode;
  readonly onRetry: () => void;
  readonly title: string;
}) {
  return (
    <div className="text-sm leading-6">
      <FeedbackLine icon={icon} title={title} />
      {actualOutput !== undefined || expectedOutput !== undefined ? (
        <details className="mt-3">
          <summary className="cursor-pointer font-medium">Verification details</summary>
          {actualOutput !== undefined ? <OutputValue label="Actual output" value={actualOutput} /> : null}
          {expectedOutput !== undefined ? <OutputValue label="Expected output" value={expectedOutput} /> : null}
        </details>
      ) : null}
      <Button className="mt-2 h-auto px-0 py-1" onClick={onRetry} type="button" variant="link">
        <RotateCcwIcon aria-hidden="true" />
        Edit and retry
      </Button>
    </div>
  );
}

function OutputValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 font-mono text-xs">
        {value || "(empty)"}
      </pre>
    </div>
  );
}

function getRetryMessage({
  activeAttempt,
  attempt,
  result,
  sendFailed,
  sendSettled,
}: {
  readonly activeAttempt: GradeExerciseInput | null;
  readonly attempt: GradeAttemptProjection["attempts"][number] | undefined;
  readonly result: GradeAttemptProjection["attempts"][number]["result"];
  readonly sendFailed: boolean;
  readonly sendSettled: boolean;
}): string | null {
  if (result?.error) return result.error.message;
  if (attempt?.status === "error") {
    return attempt.protocolError?.message ?? "The grader could not complete this attempt.";
  }
  if (activeAttempt !== null && (sendFailed || (sendSettled && attempt === undefined))) {
    return "No matching grader result was returned. Your code is still here.";
  }
  if (activeAttempt !== null && sendSettled && attempt?.status === "pending") {
    return "The grader did not finish this attempt. Your code is still here.";
  }
  return null;
}
