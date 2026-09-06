"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  resourceId: string;
  processingStatus: string;
  processingError?: string | null;
  canEdit: boolean;
};

export function DocumentProcessingControls({
  resourceId,
  processingStatus,
  processingError,
  canEdit,
}: Props) {
  const router = useRouter();
  const autoStarted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startProcessing() {
    if (!canEdit || busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}/process`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Preview generation could not be started.");
      }
      setMessage("Preview generation started.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview generation failed to start.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (processingStatus !== "pending" || !canEdit || autoStarted.current) return;
    autoStarted.current = true;
    void startProcessing();
    // startProcessing intentionally excluded: this should fire once for a newly uploaded office document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingStatus, canEdit]);

  useEffect(() => {
    if (processingStatus !== "processing") return;
    const interval = window.setInterval(() => router.refresh(), 2500);
    return () => window.clearInterval(interval);
  }, [processingStatus, router]);

  if (processingStatus === "ready") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          Preview ready
        </span>
        <Link
          href={`/resources/${resourceId}/view`}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Open slide viewer
        </Link>
      </div>
    );
  }

  if (processingStatus === "processing") {
    return (
      <div className="rounded-xl border border-[#cfe0de] bg-[#f5fbfa] px-4 py-3 text-sm text-[#315c58]">
        <p className="font-semibold">Generating slide preview…</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          The original file is already saved. This page updates automatically when conversion finishes.
        </p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[#f8fafb] px-4 py-3 text-sm text-[var(--muted)]">
        Preview status: {processingStatus.replaceAll("_", " ")}.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void startProcessing()}
        disabled={busy}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Starting…" : processingStatus === "failed" ? "Retry preview" : "Generate preview"}
      </button>
      {processingError ? (
        <p className="max-w-2xl text-xs leading-5 text-red-700">Last error: {processingError}</p>
      ) : null}
      {message ? <p className="max-w-2xl text-xs leading-5 text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
