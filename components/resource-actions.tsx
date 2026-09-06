"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResourceStatus } from "@/lib/resource-authoring";

type Props = {
  resourceId: string;
  initialStatus: ResourceStatus;
  initialUpdatedAt: string;
  isAdmin: boolean;
  disabled?: boolean;
  onUpdatedAt?: (value: string) => void;
  onStatusChange?: (value: ResourceStatus) => void;
};

type LifecycleAction = "publish" | "move_to_draft" | "archive" | "restore" | "soft_delete" | "permanent_delete" | "duplicate";

export function ResourceActions({ resourceId, initialStatus, initialUpdatedAt, isAdmin, disabled = false, onUpdatedAt, onStatusChange }: Props) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<ResourceStatus | null>(null);
  const [localUpdatedAt, setLocalUpdatedAt] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState<LifecycleAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const status = onStatusChange ? initialStatus : (localStatus ?? initialStatus);
  const expectedUpdatedAt = onUpdatedAt ? initialUpdatedAt : (localUpdatedAt ?? initialUpdatedAt);

  async function perform(action: LifecycleAction) {
    if (disabled || busy) return;
    if (action === "soft_delete" && !window.confirm("Delete this resource? It can be restored immediately from this screen.")) return;
    if (action === "permanent_delete" && !window.confirm("Permanently delete this resource? This cannot be undone.")) return;

    setBusy(action);
    setNotice(null);
    try {
      const response = await fetch(`/api/resources/${resourceId}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, expectedUpdatedAt }),
      });
      const result = (await response.json()) as { error?: string; updatedAt?: string; status?: ResourceStatus; resourceId?: string };
      if (!response.ok) throw new Error(result.error || "Action failed");

      if (result.resourceId && action === "duplicate") {
        router.push(`/resources/${result.resourceId}/edit`);
        return;
      }
      if (action === "permanent_delete") {
        router.push("/");
        return;
      }

      if (result.updatedAt) {
        if (onUpdatedAt) onUpdatedAt(result.updatedAt);
        else setLocalUpdatedAt(result.updatedAt);
      }
      if (result.status) {
        if (onStatusChange) onStatusChange(result.status);
        else setLocalStatus(result.status);
      }
      if (action === "soft_delete") {
        setDeleted(true);
        setNotice("Resource deleted. You can restore it now before leaving this page.");
      } else if (action === "restore") {
        setDeleted(false);
        setNotice("Resource restored.");
        router.refresh();
      } else {
        setNotice(action === "publish" ? "Published." : action === "archive" ? "Archived." : action === "move_to_draft" ? "Moved to Draft." : "Updated.");
        router.refresh();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const actionDisabled = disabled || Boolean(busy);

  return (
    <section className="rounded-[18px] border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {deleted ? (
          <>
            <button type="button" disabled={actionDisabled} onClick={() => perform("restore")} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Restore</button>
            {isAdmin ? <button type="button" disabled={actionDisabled} onClick={() => perform("permanent_delete")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">Delete permanently</button> : null}
          </>
        ) : (
          <>
            {status !== "approved" ? <button type="button" disabled={actionDisabled} onClick={() => perform("publish")} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Publish</button> : null}
            {status !== "draft" ? <button type="button" disabled={actionDisabled} onClick={() => perform("move_to_draft")} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Move to Draft</button> : null}
            {status !== "archived" ? <button type="button" disabled={actionDisabled} onClick={() => perform("archive")} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Archive</button> : null}
            <button type="button" disabled={actionDisabled} onClick={() => perform("duplicate")} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Duplicate</button>
            <button type="button" disabled={actionDisabled} onClick={() => perform("soft_delete")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">Delete</button>
            <button type="button" onClick={() => setNotice("Add to Presentation will activate with the shared Library Resource Picker and Presentation Builder.")} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold">Add to Presentation</button>
            <button type="button" onClick={() => setNotice("Generate Questions will activate with the Question Editor and AI Question Generation increment.")} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold">Generate Questions</button>
          </>
        )}
      </div>
      {disabled ? <p className="mt-3 text-xs text-amber-700">Finish saving current edits before changing publication or lifecycle state.</p> : null}
      {notice ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{notice}</p> : null}
    </section>
  );
}
