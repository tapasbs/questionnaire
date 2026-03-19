"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiSuccess = {
  ok: true;
  data: {
    name: string;
    code: string;
    index: 1 | 2 | 3;
    inviteUrl: string;
  };
};

type ApiFailure = {
  ok: false;
  error: string;
};

export default function AdminLinkGeneratorPage() {
  const [name, setName] = useState("");
  const [index, setIndex] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSuccess["data"] | null>(null);

  const canSubmit = useMemo(() => name.trim().length > 0 && !loading, [name, loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/link-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, index }),
      });

      const json = (await res.json()) as ApiSuccess | ApiFailure;
      if (!res.ok || !json.ok) {
        setError((json as ApiFailure).error ?? "Request failed.");
        return;
      }

      setResult(json.data);
      setName("");
      setIndex(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-14">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Link Generator</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-white/80">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Candidate name"
              className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/80">Index</span>
            <select
              value={index}
              onChange={(e) => setIndex(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/40"
            >
              <option value={1}>1 - QuestionnaireForm</option>
              <option value={2}>2 - QuestionnaireFormProfessional</option>
              <option value={3}>3 - QuestionnaireFormTechnical</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
        </form>

        {error ? (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-2 rounded-md border border-white/20 bg-black/20 p-4 text-sm">
            <p>
              <strong>Name:</strong> {result.name}
            </p>
            <p>
              <strong>Code:</strong> {result.code}
            </p>
            <p>
              <strong>Index:</strong> {result.index}
            </p>
            <p className="break-all">
              <strong>Invite URL:</strong> {result.inviteUrl}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

