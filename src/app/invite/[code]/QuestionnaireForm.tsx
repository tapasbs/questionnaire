"use client";

import { getClientIpInfo, type IpInfo } from "@/lib/ipinfo";
import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import VideoPromptRecorder from "./VideoPromptRecorder";

type Props = {
  inviteCode: string;
  commandText: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; submittedAtIso: string };

export default function QuestionnaireForm({ inviteCode, commandText }: Props) {
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

  // Section 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // Section 2: Professional & Business Background
  const [yearsExperience, setYearsExperience] = useState<
    "" | "0-2" | "3-5" | "6-10" | "10+"
  >("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industriesOther, setIndustriesOther] = useState("");
  const [leadershipExperience, setLeadershipExperience] = useState("");
  const [equityBasedRole, setEquityBasedRole] = useState<"" | "yes" | "no">("");
  const [equityExplain, setEquityExplain] = useState("");

  // Section 3: Blockchain / Crypto Knowledge
  const [blockchainFamiliarity, setBlockchainFamiliarity] = useState<
    "" | "extensive" | "some" | "no"
  >("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [platformsOther, setPlatformsOther] = useState("");
  const [tokenLaunch, setTokenLaunch] = useState<"" | "yes" | "no">("");
  const [tokenLaunchDescribe, setTokenLaunchDescribe] = useState("");
  const [strategicNoCode, setStrategicNoCode] = useState<"" | "yes" | "no">("");

  // Section 4: Business Strategy & Leadership
  const [raisedFunds, setRaisedFunds] = useState<"" | "yes" | "no">("");
  const [raisedFundsDescribe, setRaisedFundsDescribe] = useState("");
  const [managedPartnerships, setManagedPartnerships] = useState<"" | "yes" | "no">("");
  const [managedPartnershipsDescribe, setManagedPartnershipsDescribe] = useState("");
  const [majorDecision, setMajorDecision] = useState("");
  const [riskApproach, setRiskApproach] = useState("");

  // Section 5: Availability & Commitment
  const [commitment, setCommitment] = useState<"" | "full-time" | "part-time" | "advisory">(
    "",
  );
  const [startDate, setStartDate] = useState("");

  const [previewOk, setPreviewOk] = useState(true);

  const inviteLabel = useMemo(() => inviteCode.trim() || "unknown", [inviteCode]);

  const autoSaveTimeoutRef = useRef<number | null>(null);
  const ipInfoRef = useRef<IpInfo | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  function toggleArrayValue(current: string[], value: string) {
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }

  function countWords(s: string) {
    const trimmed = s.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  // Auto-save personal info to backend (Mongo) when the user types LinkedIn/profile URL.
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only trigger once a LinkedIn / profile URL exists.
    if (!profileUrl) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("saving");

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          let ipInfo = ipInfoRef.current;
          if (ipInfo == null) {
            ipInfo = await getClientIpInfo();
            ipInfoRef.current = ipInfo;
          }
          const res = await fetch("/api/lead", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName,
              email,
              phone,
              profileUrl,
              inviteCode: inviteLabel,
              clientIp: ipInfo?.ip ?? undefined,
              country: ipInfo?.country ?? undefined,
            }),
          });

          if (!res.ok) {
            setAutoSaveStatus("error");
          } else {
            setAutoSaveStatus("saved");
          }
        } catch {
          setAutoSaveStatus("error");
        }
      })();
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, email, phone, profileUrl, inviteLabel]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitState.status === "submitting") return;

    const nextErrors: Record<string, string> = {};

    if (!yearsExperience) nextErrors.yearsExperience = "Please select one option.";
    if (industries.length === 0 && industriesOther.trim().length === 0) {
      nextErrors.industries = "Select at least one industry (or fill Other).";
    }
    if (!equityBasedRole) nextErrors.equityBasedRole = "Please select Yes or No.";
    if (equityBasedRole === "yes" && equityExplain.trim().length === 0) {
      nextErrors.equityExplain = "Please explain your role and equity share.";
    }

    if (!blockchainFamiliarity) nextErrors.blockchainFamiliarity = "Please select one option.";
    if (!tokenLaunch) nextErrors.tokenLaunch = "Please select Yes or No.";
    if (tokenLaunch === "yes" && tokenLaunchDescribe.trim().length === 0) {
      nextErrors.tokenLaunchDescribe = "Please briefly describe your role and contribution.";
    }
    if (!strategicNoCode) nextErrors.strategicNoCode = "Please select Yes or No.";

    if (!raisedFunds) nextErrors.raisedFunds = "Please select Yes or No.";
    if (raisedFunds === "yes" && raisedFundsDescribe.trim().length === 0) {
      nextErrors.raisedFundsDescribe = "Please describe the process and results.";
    }
    if (!managedPartnerships) nextErrors.managedPartnerships = "Please select Yes or No.";
    if (managedPartnerships === "yes" && managedPartnershipsDescribe.trim().length === 0) {
      nextErrors.managedPartnershipsDescribe = "Please describe your experience.";
    }

    if (countWords(leadershipExperience) > 200) {
      nextErrors.leadershipExperience = "Please keep this to 200 words or less.";
    }
    if (countWords(majorDecision) > 200) {
      nextErrors.majorDecision = "Please keep this to 200 words or less.";
    }
    if (countWords(riskApproach) > 150) {
      nextErrors.riskApproach = "Please keep this to 150 words or less.";
    }

    if (!commitment) nextErrors.commitment = "Please select one option.";

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
        industries: industries,
        industriesOther: industriesOther.trim() || null,
        leadershipExperience,
        equityBasedRole,
        equityExplain: equityBasedRole === "yes" ? equityExplain : null,
      },
      blockchainKnowledge: {
        blockchainFamiliarity,
        platforms,
        platformsOther: platformsOther.trim() || null,
        tokenLaunch,
        tokenLaunchDescribe: tokenLaunch === "yes" ? tokenLaunchDescribe : null,
        strategicNoCode,
      },
      strategyLeadership: {
        raisedFunds,
        raisedFundsDescribe: raisedFunds === "yes" ? raisedFundsDescribe : null,
        managedPartnerships,
        managedPartnershipsDescribe:
          managedPartnerships === "yes" ? managedPartnershipsDescribe : null,
        majorDecision,
        riskApproach,
      },
      availability: {
        commitment,
        expectedStartDate: startDate.trim() || null,
      },
      webcamVideo: videoRecording
        ? {
            mimeType: videoRecording.mimeType,
            sizeBytes: videoRecording.sizeBytes,
            durationSeconds: videoRecording.durationSeconds,
          }
        : null,
    };

    // Placeholder: wire this to your backend later.
    await new Promise((r) => setTimeout(r, 450));
    void payload;

    setSubmitState({
      status: "submitted",
      submittedAtIso: new Date().toISOString(),
    });
  }

  if (submitState.status === "submitted") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
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
      className="rounded-2xl border border-white/10 bg-white/5 p-8"
      aria-labelledby={`${formId}-title`}
    >
      <div className="space-y-1">
        
        <p className="text-sm text-white/60">
          Invite code: <span className="font-mono text-white/80">{inviteLabel}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-10">
        <section className="grid gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Section 1: Personal Information
            </h3>
          </div>

          <label className="grid gap-3">
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

          <label className="grid gap-3">
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

          <label className="grid gap-3">
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

          <label className="grid gap-3">
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

        <section className="grid gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Section 2: Professional &amp; Business Background
            </h3>
          </div>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Years of experience in business, management, or entrepreneurship
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={() => setYearsExperience(opt.value as typeof yearsExperience)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.yearsExperience ? (
              <p className="text-xs text-red-300">{errors.yearsExperience}</p>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Industries you have experience in <span className="text-white/40">(select all that apply)</span>
            </legend>
            <div className="grid gap-4">
              {[
                "Blockchain / Crypto / Web3",
                "Software / IT / SaaS",
                "Finance / Investment",
                "Marketing / Sales / Business Development",
                "E-commerce / Retail",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={industries.includes(label)}
                    onChange={() => setIndustries((cur) => toggleArrayValue(cur, label))}
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
            {errors.industries ? <p className="text-xs text-red-300">{errors.industries}</p> : null}
          </fieldset>

          <label className="grid gap-3">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>Describe your previous leadership, co-founder, or senior business experience</span>
              <span className="text-xs text-white/40">{countWords(leadershipExperience)}/200 words</span>
            </span>
            <textarea
              value={leadershipExperience}
              onChange={(e) => setLeadershipExperience(e.target.value)}
              className="min-h-28 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 200 words"
            />
            {errors.leadershipExperience ? (
              <p className="text-xs text-red-300">{errors.leadershipExperience}</p>
            ) : null}
          </label>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Have you ever held an equity-based role or ownership in a company?
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    name={`${formId}-equity`}
                    value={opt.value}
                    checked={equityBasedRole === opt.value}
                    onChange={() => setEquityBasedRole(opt.value as typeof equityBasedRole)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.equityBasedRole ? (
              <p className="text-xs text-red-300">{errors.equityBasedRole}</p>
            ) : null}
          </fieldset>

          {equityBasedRole === "yes" ? (
            <label className="grid gap-3">
              <span className="text-sm font-medium text-white/80">
                If yes, explain your role and equity share
              </span>
              <input
                value={equityExplain}
                onChange={(e) => setEquityExplain(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Example: Co-founder (15%)"
              />
              {errors.equityExplain ? <p className="text-xs text-red-300">{errors.equityExplain}</p> : null}
            </label>
          ) : null}
        </section>

        <section className="grid gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Section 3: Blockchain / Crypto Knowledge
            </h3>
          </div>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Are you familiar with blockchain technologies, crypto platforms, or smart contracts?
            </legend>
            <div className="grid gap-4">
              {[
                { value: "extensive", label: "Yes, extensive experience" },
                { value: "some", label: "Yes, some experience" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="radio"
                    name={`${formId}-familiarity`}
                    value={opt.value}
                    checked={blockchainFamiliarity === opt.value}
                    onChange={() =>
                      setBlockchainFamiliarity(opt.value as typeof blockchainFamiliarity)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.blockchainFamiliarity ? (
              <p className="text-xs text-red-300">{errors.blockchainFamiliarity}</p>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Which blockchain platforms are you familiar with?{" "}
              <span className="text-white/40">(select all that apply)</span>
            </legend>
            <div className="grid gap-4">
              {[
                "Ethereum / BSC / Polygon",
                "Solana / Tron / Cardano",
                "Bitcoin / Lightning Network",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(label)}
                    onChange={() => setPlatforms((cur) => toggleArrayValue(cur, label))}
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
          </fieldset>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Have you ever been involved in crypto product strategy, wallet integration, or token launches?
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    name={`${formId}-tokenlaunch`}
                    value={opt.value}
                    checked={tokenLaunch === opt.value}
                    onChange={() => setTokenLaunch(opt.value as typeof tokenLaunch)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.tokenLaunch ? <p className="text-xs text-red-300">{errors.tokenLaunch}</p> : null}
          </fieldset>

          {tokenLaunch === "yes" ? (
            <label className="grid gap-3">
              <span className="text-sm font-medium text-white/80">
                If yes, briefly describe your role and contribution
              </span>
              <textarea
                value={tokenLaunchDescribe}
                onChange={(e) => setTokenLaunchDescribe(e.target.value)}
                className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.tokenLaunchDescribe ? (
                <p className="text-xs text-red-300">{errors.tokenLaunchDescribe}</p>
              ) : null}
            </label>
          ) : null}

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Are you comfortable making strategic decisions about blockchain products or crypto features without coding yourself?
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    name={`${formId}-strategic`}
                    value={opt.value}
                    checked={strategicNoCode === opt.value}
                    onChange={() => setStrategicNoCode(opt.value as typeof strategicNoCode)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.strategicNoCode ? (
              <p className="text-xs text-red-300">{errors.strategicNoCode}</p>
            ) : null}
          </fieldset>
        </section>

        <section className="grid gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Section 4: Business Strategy &amp; Leadership
            </h3>
          </div>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Have you raised funds for a company or project before?
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    name={`${formId}-raised`}
                    value={opt.value}
                    checked={raisedFunds === opt.value}
                    onChange={() => setRaisedFunds(opt.value as typeof raisedFunds)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.raisedFunds ? <p className="text-xs text-red-300">{errors.raisedFunds}</p> : null}
          </fieldset>

          {raisedFunds === "yes" ? (
            <label className="grid gap-3">
              <span className="text-sm font-medium text-white/80">
                If yes, describe the process and results
              </span>
              <textarea
                value={raisedFundsDescribe}
                onChange={(e) => setRaisedFundsDescribe(e.target.value)}
                className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.raisedFundsDescribe ? (
                <p className="text-xs text-red-300">{errors.raisedFundsDescribe}</p>
              ) : null}
            </label>
          ) : null}

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Have you managed partnerships, clients, or strategic alliances?
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    name={`${formId}-partners`}
                    value={opt.value}
                    checked={managedPartnerships === opt.value}
                    onChange={() =>
                      setManagedPartnerships(opt.value as typeof managedPartnerships)
                    }
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.managedPartnerships ? (
              <p className="text-xs text-red-300">{errors.managedPartnerships}</p>
            ) : null}
          </fieldset>

          {managedPartnerships === "yes" ? (
            <label className="grid gap-3">
              <span className="text-sm font-medium text-white/80">If yes, describe</span>
              <textarea
                value={managedPartnershipsDescribe}
                onChange={(e) => setManagedPartnershipsDescribe(e.target.value)}
                className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                placeholder="Short answer"
              />
              {errors.managedPartnershipsDescribe ? (
                <p className="text-xs text-red-300">{errors.managedPartnershipsDescribe}</p>
              ) : null}
            </label>
          ) : null}

          <label className="grid gap-3">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>Describe a major business decision you made that impacted company growth</span>
              <span className="text-xs text-white/40">{countWords(majorDecision)}/200 words</span>
            </span>
            <textarea
              value={majorDecision}
              onChange={(e) => setMajorDecision(e.target.value)}
              className="min-h-28 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 200 words"
            />
            {errors.majorDecision ? <p className="text-xs text-red-300">{errors.majorDecision}</p> : null}
          </label>

          <label className="grid gap-3">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-white/80">
              <span>How do you approach risk-taking and decision-making in business?</span>
              <span className="text-xs text-white/40">{countWords(riskApproach)}/150 words</span>
            </span>
            <textarea
              value={riskApproach}
              onChange={(e) => setRiskApproach(e.target.value)}
              className="min-h-24 resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              placeholder="Max 150 words"
            />
            {errors.riskApproach ? <p className="text-xs text-red-300">{errors.riskApproach}</p> : null}
          </label>
        </section>

        <section className="grid gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Section 5: Availability &amp; Commitment
            </h3>
          </div>

          <fieldset className="grid gap-3.5">
            <legend className="text-sm font-medium text-white/80">
              Are you willing to commit full-time, part-time, or advisory?
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
                    onChange={() => setCommitment(opt.value as typeof commitment)}
                    className="h-4 w-4 accent-white"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.commitment ? <p className="text-xs text-red-300">{errors.commitment}</p> : null}
          </fieldset>

          <label className="grid gap-3">
            <span className="text-sm font-medium text-white/80">Expected start date</span>
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
        leadInfo={{ fullName, email, phone, profileUrl }}
        commandText={commandText}
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

