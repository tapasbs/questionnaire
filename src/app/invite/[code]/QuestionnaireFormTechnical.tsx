"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import VideoPromptRecorder from "./VideoPromptRecorder";

type Props = {
  inviteCode: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; submittedAtIso: string };

const LANGUAGES = [
  "Solidity",
  "Rust",
  "JavaScript / Node.js",
  "Python",
  "Go / Golang",
];

const PLATFORMS = [
  "Ethereum / BSC / Polygon",
  "Solana / Tron / Cardano",
  "Bitcoin / Lightning Network",
];

const WORKED_ON = [
  "Smart contract development",
  "Token creation / ICO / DeFi projects",
  "Crypto wallet development / integration",
  "NFT / NFT marketplace development",
  "Blockchain API / backend integration",
];

const TOOLS = [
  "Hardhat / Truffle",
  "Web3.js / Ethers.js",
  "Metamask / Wallet integration",
  "Chainlink / Oracles",
];

export default function QuestionnaireFormTechnical({ inviteCode }: Props) {
  const formId = useId();
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [videoRecording, setVideoRecording] = useState<{
    blob: Blob;
    url: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
  } | null>(null);

  // Section 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // Section 2
  const [yearsExperience, setYearsExperience] = useState<
    "" | "0-2" | "3-5" | "6-10" | "10+"
  >("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languagesOther, setLanguagesOther] = useState("");
  const [blockchainExperience, setBlockchainExperience] = useState("");

  // Section 3
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [platformsOther, setPlatformsOther] = useState("");
  const [workedOn, setWorkedOn] = useState<string[]>([]);
  const [projectDescribe, setProjectDescribe] = useState("");

  // Section 4
  const [tools, setTools] = useState<string[]>([]);
  const [toolsOther, setToolsOther] = useState("");
  const [auditing, setAuditing] = useState<"" | "yes" | "no">("");
  const [auditingDescribe, setAuditingDescribe] = useState("");

  // Section 5
  const [commitment, setCommitment] = useState<
    "" | "full-time" | "part-time" | "advisory"
  >("");
  const [startDate, setStartDate] = useState("");

  // Section 6
  const [uniqueValue, setUniqueValue] = useState("");
  const [vision, setVision] = useState("");

  const [previewOk, setPreviewOk] = useState(true);

  const inviteLabel = useMemo(() => inviteCode.trim() || "unknown", [inviteCode]);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  function toggleArrayValue(current: string[], value: string) {
    return current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  }

  function countWords(s: string) {
    const trimmed = s.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  useEffect(() => {
    if (autoSaveTimeoutRef.current) window.clearTimeout(autoSaveTimeoutRef.current);
    if (!fullName && !email && !phone && !profileUrl) {
      setAutoSaveStatus("idle");
      return;
    }
    setAutoSaveStatus("saving");
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              email,
              phone,
              profileUrl,
              inviteCode: inviteLabel,
            }),
          });
          setAutoSaveStatus(res.ok ? "saved" : "error");
        } catch {
          setAutoSaveStatus("error");
        }
      })();
    }, 1000);
    return () => {
      if (autoSaveTimeoutRef.current)
        window.clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [fullName, email, phone, profileUrl, inviteLabel]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitState.status === "submitting") return;

    const nextErrors: Record<string, string> = {};
    if (!yearsExperience) nextErrors.yearsExperience = "Please select one option.";
    if (languages.length === 0 && !languagesOther.trim())
      nextErrors.languages = "Select at least one (or fill Other).";
    if (countWords(blockchainExperience) > 200)
      nextErrors.blockchainExperience = "Max 200 words.";
    if (platforms.length === 0 && !platformsOther.trim())
      nextErrors.platforms = "Select at least one (or fill Other).";
    if (workedOn.length === 0)
      nextErrors.workedOn = "Select at least one option.";
    if (countWords(projectDescribe) > 200)
      nextErrors.projectDescribe = "Max 200 words.";
    if (tools.length === 0 && !toolsOther.trim())
      nextErrors.tools = "Select at least one (or fill Other).";
    if (!auditing) nextErrors.auditing = "Please select Yes or No.";
    if (auditing === "yes" && !auditingDescribe.trim())
      nextErrors.auditingDescribe = "Please briefly describe.";
    if (!commitment) nextErrors.commitment = "Please select one option.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitState({ status: "submitting" });
    const payload = {
      inviteCode: inviteLabel,
      personalInformation: { fullName, email, phone: phone.trim() || null, profileUrl: profileUrl.trim() || null },
      technicalBackground: {
        yearsExperience,
        languages,
        languagesOther: languagesOther.trim() || null,
        blockchainExperience,
      },
      blockchainKnowledge: {
        platforms,
        platformsOther: platformsOther.trim() || null,
        workedOn,
        projectDescribe,
      },
      tools: {
        tools,
        toolsOther: toolsOther.trim() || null,
        auditing,
        auditingDescribe: auditing === "yes" ? auditingDescribe : null,
      },
      availability: { commitment, expectedStartDate: startDate.trim() || null },
      vision: { uniqueValue, vision },
      webcamVideo: videoRecording
        ? {
            mimeType: videoRecording.mimeType,
            sizeBytes: videoRecording.sizeBytes,
            durationSeconds: videoRecording.durationSeconds,
          }
        : null,
    };
    void payload;
    await new Promise((r) => setTimeout(r, 450));
    setSubmitState({ status: "submitted", submittedAtIso: new Date().toISOString() });
  }

  if (submitState.status === "submitted") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Thanks — submitted.
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Your response for invite{" "}
          <span className="font-mono text-white/80">{inviteLabel}</span> was
          recorded.
        </p>
        <a
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Return to home
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6"
      aria-labelledby={`${formId}-title`}
    >
      <div className="space-y-1">
        <p className="text-sm text-white/60">
          Invite code: <span className="font-mono text-white/80">{inviteLabel}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 1: Personal Information
          </h3>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">Full Name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Your full name"
              autoComplete="name"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">Email Address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">
              Phone Number <span className="text-white/40">(optional)</span>
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="+1 555 000 0000"
              autoComplete="tel"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">
              LinkedIn Portfolio URL
            </span>
            <input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="https://..."
              inputMode="url"
            />
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 2: Technical Background
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              5. Years of experience in software development
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "0-2", label: "0–2" },
                { value: "3-5", label: "3–5" },
                { value: "6-10", label: "6–10" },
                { value: "10+", label: "10+" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="radio"
                    name={`${formId}-years`}
                    value={opt.value}
                    checked={yearsExperience === opt.value}
                    onChange={() =>
                      setYearsExperience(opt.value as typeof yearsExperience)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.yearsExperience && (
              <p className="text-xs text-red-300">{errors.yearsExperience}</p>
            )}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Primary programming languages / frameworks (select all that apply)
            </legend>
            <div className="grid gap-2">
              {LANGUAGES.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={languages.includes(label)}
                    onChange={() => setLanguages((c) => toggleArrayValue(c, label))}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="grid gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="text-sm text-white/80">Other</span>
                <input
                  value={languagesOther}
                  onChange={(e) => setLanguagesOther(e.target.value)}
                  className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  placeholder="Type language(s)"
                />
              </label>
            </div>
            {errors.languages && (
              <p className="text-xs text-red-300">{errors.languages}</p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>
                Describe your previous experience in blockchain / crypto projects
              </span>
              <span className="text-xs text-white/40">
                {countWords(blockchainExperience)}/200 words
              </span>
            </span>
            <textarea
              value={blockchainExperience}
              onChange={(e) => setBlockchainExperience(e.target.value)}
              className="min-h-28 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 200 words"
            />
            {errors.blockchainExperience && (
              <p className="text-xs text-red-300">{errors.blockchainExperience}</p>
            )}
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 3: Blockchain / Crypto Knowledge
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              8. Which blockchain platforms are you familiar with? (select all
              that apply)
            </legend>
            <div className="grid gap-2">
              {PLATFORMS.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(label)}
                    onChange={() => setPlatforms((c) => toggleArrayValue(c, label))}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="grid gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="text-sm text-white/80">Other</span>
                <input
                  value={platformsOther}
                  onChange={(e) => setPlatformsOther(e.target.value)}
                  className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  placeholder="Type platform(s)"
                />
              </label>
            </div>
            {errors.platforms && (
              <p className="text-xs text-red-300">{errors.platforms}</p>
            )}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you worked on any of the following? (select all that apply)
            </legend>
            <div className="grid gap-2">
              {WORKED_ON.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={workedOn.includes(label)}
                    onChange={() => setWorkedOn((c) => toggleArrayValue(c, label))}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.workedOn && (
              <p className="text-xs text-red-300">{errors.workedOn}</p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>
                Describe a blockchain project you contributed to, your role, and
                technologies used
              </span>
              <span className="text-xs text-white/40">
                {countWords(projectDescribe)}/200 words
              </span>
            </span>
            <textarea
              value={projectDescribe}
              onChange={(e) => setProjectDescribe(e.target.value)}
              className="min-h-28 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 200 words"
            />
            {errors.projectDescribe && (
              <p className="text-xs text-red-300">{errors.projectDescribe}</p>
            )}
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 4: Tools &amp; Development
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              11. Which blockchain tools or frameworks have you used? (select all
              that apply)
            </legend>
            <div className="grid gap-2">
              {TOOLS.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={tools.includes(label)}
                    onChange={() => setTools((c) => toggleArrayValue(c, label))}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="grid gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="text-sm text-white/80">Other</span>
                <input
                  value={toolsOther}
                  onChange={(e) => setToolsOther(e.target.value)}
                  className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  placeholder="Type tool(s)"
                />
              </label>
            </div>
            {errors.tools && (
              <p className="text-xs text-red-300">{errors.tools}</p>
            )}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you worked with smart contract auditing or security testing?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="radio"
                    name={`${formId}-auditing`}
                    value={opt.value}
                    checked={auditing === opt.value}
                    onChange={() =>
                      setAuditing(opt.value as typeof auditing)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.auditing && (
              <p className="text-xs text-red-300">{errors.auditing}</p>
            )}
          </fieldset>
          {auditing === "yes" && (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/80">
                If yes, briefly describe
              </span>
              <input
                value={auditingDescribe}
                onChange={(e) => setAuditingDescribe(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.auditingDescribe && (
                <p className="text-xs text-red-300">{errors.auditingDescribe}</p>
              )}
            </label>
          )}
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 5: Availability &amp; Commitment
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              15. Are you available for full-time, part-time, or advisory work?
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "full-time", label: "Full-time" },
                { value: "part-time", label: "Part-time" },
                { value: "advisory", label: "Advisory" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="radio"
                    name={`${formId}-commitment`}
                    value={opt.value}
                    checked={commitment === opt.value}
                    onChange={() =>
                      setCommitment(opt.value as typeof commitment)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.commitment && (
              <p className="text-xs text-red-300">{errors.commitment}</p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">
              Expected start date
            </span>
            <input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            />
          </label>
        </section>

        <VideoPromptRecorder
          maxSeconds={180}
          onRecordingReady={setVideoRecording}
          onPreviewOkChange={setPreviewOk}
          inviteCode={inviteLabel}
        />

      
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled
          className="inline-flex h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-neutral-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {submitState.status === "submitting" ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
