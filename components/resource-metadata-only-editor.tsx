"use client";

import { useMemo, useState } from "react";
import { ResourceActions } from "@/components/resource-actions";
import { ResourceMetadataEditor } from "@/components/resource-metadata-editor";
import { useResourceAutosave } from "@/components/use-resource-autosave";
import { editableMetadataFromEditor, type ResourceCategoryOption, type ResourceEditorMetadata, type ResourceStatus } from "@/lib/resource-authoring";

type Props = {
  resourceId: string;
  resourceType: string;
  initialMetadata: ResourceEditorMetadata;
  initialUpdatedAt: string;
  categories: ResourceCategoryOption[];
  role: "admin" | "editor";
};

export function ResourceMetadataOnlyEditor({ resourceId, resourceType, initialMetadata, initialUpdatedAt, categories, role }: Props) {
  const [metadata, setMetadata] = useState(initialMetadata);
  const payload = useMemo(() => ({ metadata: editableMetadataFromEditor(metadata) }), [metadata]);
  const autosave = useResourceAutosave({ url: `/api/resources/${resourceId}`, payload, initialUpdatedAt });

  const updateStatus = (status: ResourceStatus) => setMetadata((current) => ({ ...current, status }));

  return (
    <main className="mx-auto max-w-[1100px] pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href={`/resources/${resourceId}`} className="text-sm font-semibold text-[var(--accent)]">← Back to resource</a>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Edit Resource</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{resourceType} metadata and lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${autosave.status === "saved" ? "bg-[#eaf4f3] text-[var(--accent)]" : autosave.status === "saving" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
            {autosave.status === "saved" ? "Saved" : autosave.status === "saving" ? "Saving…" : autosave.status === "conflict" ? "Newer version exists — reload" : "Save failed"}
          </span>
          {autosave.status === "error" ? <button type="button" onClick={autosave.retry} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold">Retry</button> : null}
        </div>
      </div>

      <ResourceMetadataEditor value={metadata} categories={categories} onChange={setMetadata} />

      <div className="mt-4">
        <ResourceActions
          resourceId={resourceId}
          initialStatus={metadata.status}
          initialUpdatedAt={autosave.updatedAt}
          isAdmin={role === "admin"}
          disabled={autosave.status !== "saved"}
          onUpdatedAt={autosave.adoptUpdatedAt}
          onStatusChange={updateStatus}
        />
      </div>

      <section className="mt-4 rounded-[18px] border border-dashed border-[#cad5d9] bg-[#f8fafb] p-5 text-sm leading-6 text-[var(--muted)]">
        The shared metadata and lifecycle controls are active now. The structured content body for this resource type will become editable in its dedicated clinical builder in the next implementation increments.
      </section>
    </main>
  );
}
