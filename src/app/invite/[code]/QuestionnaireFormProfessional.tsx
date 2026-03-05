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

const INDUSTRIES = [
  "Blockchain / Crypto / Web3",
  "SaaS / Software",
  "FinTech",
  "Investment / VC",
  "E-commerce",
];

const INVOLVEMENT_LEVELS = [
  "Founder / Co-founder",
  "Executive / Leadership",
  "Product Strategy",
  "Investor",
  "Limited exposure",
];

const INVOLVED_IN = [
  "Token launch / tokenomics design",
  "Crypto fundraising (ICO, IDO, private round)",
  "Exchange listings",
  "Strategic partnerships",
  "DeFi / NFT / Web3 product strategy",
];

const OPEN_TO = [
  "Equity-based role",
  "Salary + Equity",
  "Advisory compensation",
  "Investment participation",
];

export default function QuestionnaireFormProfessional({ inviteCode }: Props) {
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
  const [previewOk, setPreviewOk] = useState(true);

  // Section 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // Section 2
  const [yearsExperience, setYearsExperience] = useState<
    "" | "3-5" | "6-10" | "10-15" | "15+"
  >("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industriesOther, setIndustriesOther] = useState("");
  const [leadershipExperience, setLeadershipExperience] = useState("");

  // Section 3
  const [involvementLevel, setInvolvementLevel] = useState("");
  const [involvedIn, setInvolvedIn] = useState<string[]>([]);
  const [projectDescribe, setProjectDescribe] = useState("");

  // Section 4
  const [managedOperations, setManagedOperations] = useState<"" | "yes" | "no">("");
  const [managedOperationsExplain, setManagedOperationsExplain] = useState("");
  const [ledProduct, setLedProduct] = useState<"" | "yes" | "no">("");
  const [ledProductDescribe, setLedProductDescribe] = useState("");
  const [raisedCapital, setRaisedCapital] = useState<"" | "yes" | "no">("");
  const [raisedCapitalDescribe, setRaisedCapitalDescribe] = useState("");
  const [scalingApproach, setScalingApproach] = useState("");

  // Section 5
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [preferredInvolvement, setPreferredInvolvement] = useState<
    "" | "full-time" | "part-time" | "advisory"
  >("");
  const [startTimeline, setStartTimeline] = useState("");

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
    // Only trigger once a LinkedIn / profile URL exists.
    if (!profileUrl) {
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
    if (industries.length === 0 && !industriesOther.trim())
      nextErrors.industries = "Select at least one (or fill Other).";
    if (countWords(leadershipExperience) > 200)
      nextErrors.leadershipExperience = "Max 200 words.";
    if (!involvementLevel) nextErrors.involvementLevel = "Please select one option.";
    if (involvedIn.length === 0)
      nextErrors.involvedIn = "Select at least one option.";
    if (countWords(projectDescribe) > 200)
      nextErrors.projectDescribe = "Max 200 words.";
    if (!managedOperations) nextErrors.managedOperations = "Please select Yes or No.";
    if (managedOperations === "yes" && !managedOperationsExplain.trim())
      nextErrors.managedOperationsExplain = "Please briefly explain.";
    if (!ledProduct) nextErrors.ledProduct = "Please select Yes or No.";
    if (ledProduct === "yes" && !ledProductDescribe.trim())
      nextErrors.ledProductDescribe = "Please describe briefly.";
    if (!raisedCapital) nextErrors.raisedCapital = "Please select Yes or No.";
    if (raisedCapital === "yes" && !raisedCapitalDescribe.trim())
      nextErrors.raisedCapitalDescribe = "Please describe the stage and outcome.";
    if (countWords(scalingApproach) > 150)
      nextErrors.scalingApproach = "Max 150 words.";
    if (openTo.length === 0) nextErrors.openTo = "Select at least one option.";
    if (!preferredInvolvement)
      nextErrors.preferredInvolvement = "Please select one option.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitState({ status: "submitting" });
    const payload = {
      inviteCode: inviteLabel,
      personalInformation: {
        fullName,
        email,
        phone: phone.trim() || null,
        profileUrl: profileUrl.trim() || null,
      },
      professionalBackground: {
        yearsExperience,
        industries,
        industriesOther: industriesOther.trim() || null,
        leadershipExperience,
      },
      blockchainUnderstanding: {
        involvementLevel,
        involvedIn,
        projectDescribe,
      },
      strategicOperational: {
        managedOperations,
        managedOperationsExplain:
          managedOperations === "yes" ? managedOperationsExplain : null,
        ledProduct,
        ledProductDescribe: ledProduct === "yes" ? ledProductDescribe : null,
        raisedCapital,
        raisedCapitalDescribe:
          raisedCapital === "yes" ? raisedCapitalDescribe : null,
        scalingApproach,
      },
      commitmentStructure: {
        openTo,
        preferredInvolvement,
        startTimeline: startTimeline.trim() || null,
      },
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
    setSubmitState({
      status: "submitted",
      submittedAtIso: new Date().toISOString(),
    });
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
          Invite code:{" "}
          <span className="font-mono text-white/80">{inviteLabel}</span>
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
            <span className="text-sm font-medium text-white/80">
              Email Address
            </span>
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
              Phone Number{" "}
              <span className="text-white/40">(optional)</span>
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
              LinkedIn profile URL
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
            Section 2: Professional Background
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Years of experience in leadership / business roles
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "3-5", label: "3–5" },
                { value: "6-10", label: "6–10" },
                { value: "10-15", label: "10–15" },
                { value: "15+", label: "15+" },
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
              Industries you have worked in (select all that apply)
            </legend>
            <div className="grid gap-2">
              {INDUSTRIES.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={industries.includes(label)}
                    onChange={() =>
                      setIndustries((c) => toggleArrayValue(c, label))
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="grid gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="text-sm text-white/80">Other</span>
                <input
                  value={industriesOther}
                  onChange={(e) => setIndustriesOther(e.target.value)}
                  className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  placeholder="Type your industry"
                />
              </label>
            </div>
            {errors.industries && (
              <p className="text-xs text-red-300">{errors.industries}</p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>
                Briefly describe your most relevant leadership experience
              </span>
              <span className="text-xs text-white/40">
                {countWords(leadershipExperience)}/200 words
              </span>
            </span>
            <textarea
              value={leadershipExperience}
              onChange={(e) => setLeadershipExperience(e.target.value)}
              className="min-h-28 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 200 words"
            />
            {errors.leadershipExperience && (
              <p className="text-xs text-red-300">
                {errors.leadershipExperience}
              </p>
            )}
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 3: Blockchain / Crypto Understanding
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              What is your level of involvement in blockchain or crypto
              projects?
            </legend>
            <div className="grid gap-2">
              {INVOLVEMENT_LEVELS.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="radio"
                    name={`${formId}-involvement`}
                    value={label}
                    checked={involvementLevel === label}
                    onChange={() => setInvolvementLevel(label)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.involvementLevel && (
              <p className="text-xs text-red-300">
                {errors.involvementLevel}
              </p>
            )}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you been involved in any of the following? (select all that
              apply)
            </legend>
            <div className="grid gap-2">
              {INVOLVED_IN.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={involvedIn.includes(label)}
                    onChange={() =>
                      setInvolvedIn((c) => toggleArrayValue(c, label))
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.involvedIn && (
              <p className="text-xs text-red-300">{errors.involvedIn}</p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>
                Briefly describe a blockchain/crypto project you contributed to
                and your role
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
            Section 4: Strategic &amp; Operational Skills
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you managed company operations or cross-functional teams?
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
                    name={`${formId}-operations`}
                    value={opt.value}
                    checked={managedOperations === opt.value}
                    onChange={() =>
                      setManagedOperations(opt.value as typeof managedOperations)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.managedOperations && (
              <p className="text-xs text-red-300">
                {errors.managedOperations}
              </p>
            )}
          </fieldset>
          {managedOperations === "yes" && (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/80">
                If yes, briefly explain scope and size
              </span>
              <input
                value={managedOperationsExplain}
                onChange={(e) => setManagedOperationsExplain(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.managedOperationsExplain && (
                <p className="text-xs text-red-300">
                  {errors.managedOperationsExplain}
                </p>
              )}
            </label>
          )}
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you led product development or go-to-market strategy?
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
                    name={`${formId}-product`}
                    value={opt.value}
                    checked={ledProduct === opt.value}
                    onChange={() =>
                      setLedProduct(opt.value as typeof ledProduct)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.ledProduct && (
              <p className="text-xs text-red-300">{errors.ledProduct}</p>
            )}
          </fieldset>
          {ledProduct === "yes" && (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/80">
                If yes, describe briefly
              </span>
              <textarea
                value={ledProductDescribe}
                onChange={(e) => setLedProductDescribe(e.target.value)}
                className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.ledProductDescribe && (
                <p className="text-xs text-red-300">
                  {errors.ledProductDescribe}
                </p>
              )}
            </label>
          )}
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Have you raised capital or managed investor relations?
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
                    name={`${formId}-capital`}
                    value={opt.value}
                    checked={raisedCapital === opt.value}
                    onChange={() =>
                      setRaisedCapital(opt.value as typeof raisedCapital)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.raisedCapital && (
              <p className="text-xs text-red-300">{errors.raisedCapital}</p>
            )}
          </fieldset>
          {raisedCapital === "yes" && (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/80">
                If yes, describe the stage and outcome
              </span>
              <textarea
                value={raisedCapitalDescribe}
                onChange={(e) => setRaisedCapitalDescribe(e.target.value)}
                className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.raisedCapitalDescribe && (
                <p className="text-xs text-red-300">
                  {errors.raisedCapitalDescribe}
                </p>
              )}
            </label>
          )}
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>
                What is your approach to scaling a blockchain/crypto startup?
              </span>
              <span className="text-xs text-white/40">
                {countWords(scalingApproach)}/150 words
              </span>
            </span>
            <textarea
              value={scalingApproach}
              onChange={(e) => setScalingApproach(e.target.value)}
              className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 150 words"
            />
            {errors.scalingApproach && (
              <p className="text-xs text-red-300">{errors.scalingApproach}</p>
            )}
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-white/90">
            Section 5: Commitment &amp; Structure
          </h3>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Are you open to:
            </legend>
            <div className="grid gap-2">
              {OPEN_TO.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={openTo.includes(label)}
                    onChange={() => setOpenTo((c) => toggleArrayValue(c, label))}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.openTo && (
              <p className="text-xs text-red-300">{errors.openTo}</p>
            )}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-white/80">
              Preferred level of involvement:
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
                    name={`${formId}-involvement-pref`}
                    value={opt.value}
                    checked={preferredInvolvement === opt.value}
                    onChange={() =>
                      setPreferredInvolvement(
                        opt.value as typeof preferredInvolvement
                      )
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.preferredInvolvement && (
              <p className="text-xs text-red-300">
                {errors.preferredInvolvement}
              </p>
            )}
          </fieldset>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white/80">
              Expected start timeline
            </span>
            <input
              value={startTimeline}
              onChange={(e) => setStartTimeline(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="e.g. Within 2 weeks, Q2 2025"
            />
          </label>
        </section>

        <VideoPromptRecorder
          maxSeconds={180}
          onRecordingReady={setVideoRecording}
          onPreviewOkChange={setPreviewOk}
          inviteCode={inviteLabel}
          leadInfo={{ fullName, email, phone, profileUrl }}
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
