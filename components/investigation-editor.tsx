"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InvestigationViewer } from "@/components/investigation-viewer";
import { ResourceActions } from "@/components/resource-actions";
import { ResourceMetadataEditor } from "@/components/resource-metadata-editor";
import { useResourceAutosave } from "@/components/use-resource-autosave";
import {
  addInvestigationColumn,
  addInvestigationRow,
  coerceInvestigation,
  type InvestigationContent,
} from "@/lib/investigation";
import {
  editableMetadataFromEditor,
  type ResourceCategoryOption,
  type ResourceEditorMetadata,
  type ResourceStatus,
} from "@/lib/resource-authoring";

type Props = {
  resourceId: string;
  initialMetadata: ResourceEditorMetadata;
  initialUpdatedAt: string;
  initialContent: unknown;
  categories: ResourceCategoryOption[];
  role: "admin" | "editor";
};

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]";
}

function SaveState({ status, retry }: { status: "saved" | "saving" | "error" | "conflict"; retry: () => void }) {
  const label = status === "saved" ? "Saved" : status === "saving" ? "Saving…" : status === "conflict" ? "Newer version exists — reload" : "Save failed";
  const tone = status === "saved" ? "bg-[#eaf4f3] text-[var(--accent)]" : status === "saving" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tone}`}>{label}</span>
      {status === "error" ? <button type="button" onClick={retry} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold">Retry</button> : null}
    </div>
  );
}

export function InvestigationEditor({ resourceId, initialMetadata, initialUpdatedAt, initialContent, categories, role }: Props) {
  const coerced = useMemo(() => coerceInvestigation(initialContent), [initialContent]);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [content, setContent] = useState<InvestigationContent>(coerced);

  const saveContent = useMemo<InvestigationContent>(() => ({
    ...content,
    schema_version: 1,
    native_kind: "investigation",
    subtitle: metadata.description || content.subtitle || "",
    tags: metadata.tags,
    body_html: undefined,
  }), [content, metadata.description, metadata.tags]);

  const payload = useMemo(() => ({ metadata: editableMetadataFromEditor(metadata), content: saveContent }), [metadata, saveContent]);
  const { status, updatedAt, retry, adoptUpdatedAt } = useResourceAutosave({
    url: `/api/resources/${resourceId}/investigation`,
    payload,
    initialUpdatedAt,
  });

  function patch(change: Partial<InvestigationContent>) {
    setContent((value) => ({ ...value, ...change }));
  }

  function renameColumn(columnId: string, label: string) {
    setContent((value) => ({
      ...value,
      table: { ...value.table, columns: value.table.columns.map((column) => column.id === columnId ? { ...column, label } : column) },
    }));
  }

  function removeColumn(columnId: string) {
    setContent((value) => {
      if (value.table.columns.length <= 1) return value;
      return {
        ...value,
        table: {
          columns: value.table.columns.filter((column) => column.id !== columnId),
          rows: value.table.rows.map((row) => {
            const cells = { ...row.cells };
            delete cells[columnId];
            return { ...row, cells, abnormal_cells: row.abnormal_cells.filter((id) => id !== columnId) };
          }),
        },
      };
    });
  }

  function updateCell(rowId: string, columnId: string, cellValue: string) {
    setContent((value) => ({
      ...value,
      table: {
        ...value.table,
        rows: value.table.rows.map((row) => row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: cellValue } } : row),
      },
    }));
  }

  function toggleAbnormal(rowId: string, columnId: string) {
    setContent((value) => ({
      ...value,
      table: {
        ...value.table,
        rows: value.table.rows.map((row) => {
          if (row.id !== rowId) return row;
          const active = row.abnormal_cells.includes(columnId);
          return { ...row, abnormal_cells: active ? row.abnormal_cells.filter((id) => id !== columnId) : [...row.abnormal_cells, columnId] };
        }),
      },
    }));
  }

  function removeRow(rowId: string) {
    setContent((value) => ({ ...value, table: { ...value.table, rows: value.table.rows.filter((row) => row.id !== rowId) } }));
  }

  function onStatusChange(next: ResourceStatus) {
    setMetadata((value) => ({ ...value, status: next }));
  }

  return (
    <main className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/resources/${resourceId}`} className="text-sm font-semibold text-[var(--accent)]">← Back to resource</Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Investigation Builder</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build result interpretation exercises without editing raw HTML or JSON.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveState status={status} retry={retry} />
          <a href={`/resources/${resourceId}`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Preview / Present</a>
        </div>
      </div>

      <ResourceMetadataEditor value={metadata} categories={categories} onChange={setMetadata} />

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Student-facing setup</p>
            <label className="mt-4 block text-xs font-semibold text-[var(--muted)]">Clinical context
              <textarea value={content.clinical_context} onChange={(event) => patch({ clinical_context: event.target.value })} rows={5} className={`${inputClass()} resize-y leading-6`} placeholder="68-year-old with COPD, drowsiness and increased work of breathing..." />
            </label>
            <label className="mt-4 block text-xs font-semibold text-[var(--muted)]">Student prompt
              <textarea value={content.student_prompt} onChange={(event) => patch({ student_prompt: event.target.value })} rows={3} className={`${inputClass()} resize-y`} />
            </label>
            <label className="mt-4 block text-xs font-semibold text-[var(--muted)]">Optional image URL
              <input value={content.image_url ?? ""} onChange={(event) => patch({ image_url: event.target.value || null })} placeholder="https://..." className={inputClass()} />
            </label>
            <p className="mt-2 text-[11px] text-[var(--muted)]">Selecting reusable images directly from the BMCH Library activates in Increment 7; URL/image support is available now.</p>
          </section>

          <section className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Result table</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Click the flag under a cell to mark that value abnormal.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={content.table.columns.length >= 12} onClick={() => setContent((value) => addInvestigationColumn(value))} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold disabled:opacity-40">+ Column</button>
                <button type="button" disabled={content.table.rows.length >= 80} onClick={() => setContent((value) => addInvestigationRow(value))} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">+ Row</button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr>
                    {content.table.columns.map((column) => (
                      <th key={column.id} className="min-w-[150px] border border-[var(--line)] bg-[#f5f8f8] p-2 align-top">
                        <input value={column.label} onChange={(event) => renameColumn(column.id, event.target.value)} className="w-full rounded-lg border border-[var(--line)] bg-white px-2 py-2 font-semibold" />
                        <button type="button" disabled={content.table.columns.length <= 1} onClick={() => removeColumn(column.id)} className="mt-1 text-[10px] font-semibold text-red-600 disabled:opacity-30">Remove column</button>
                      </th>
                    ))}
                    <th className="w-14 border border-[var(--line)] bg-[#f5f8f8] p-2">Row</th>
                  </tr>
                </thead>
                <tbody>
                  {content.table.rows.map((row) => (
                    <tr key={row.id}>
                      {content.table.columns.map((column) => {
                        const abnormal = row.abnormal_cells.includes(column.id);
                        return (
                          <td key={column.id} className={`border border-[var(--line)] p-2 align-top ${abnormal ? "bg-red-50" : "bg-white"}`}>
                            <input value={row.cells[column.id] ?? ""} onChange={(event) => updateCell(row.id, column.id, event.target.value)} className={`w-full rounded-lg border px-2.5 py-2 ${abnormal ? "border-red-300 font-bold text-red-800" : "border-[var(--line)]"}`} />
                            <button type="button" onClick={() => toggleAbnormal(row.id, column.id)} className={`mt-1 text-[10px] font-semibold ${abnormal ? "text-red-700" : "text-[var(--muted)]"}`}>{abnormal ? "⚑ Abnormal" : "⚐ Mark abnormal"}</button>
                          </td>
                        );
                      })}
                      <td className="border border-[var(--line)] p-2 text-center"><button type="button" onClick={() => removeRow(row.id)} className="text-[10px] font-semibold text-red-600">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {content.legacy_html ? (
            <section className="rounded-[18px] border border-dashed border-[#cbd6d8] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Imported starter content</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">The original approved prototype HTML is preserved. It remains visible after Reveal Interpretation until you have recreated the content in structured fields.</p>
              <button type="button" onClick={() => window.confirm("Remove the preserved imported HTML? Only do this after you have recreated its content in the structured fields.") && patch({ legacy_html: undefined })} className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Remove imported HTML</button>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Teacher interpretation</p>
            {([
              ["Interpretation", "interpretation"],
              ["Differential", "differential"],
              ["Next investigation / step", "next_step"],
              ["Management implication", "management_implication"],
              ["Teaching point", "teaching_point"],
              ["Warning / exam trap", "warning"],
            ] as const).map(([label, key]) => (
              <label key={key} className="mt-4 block text-xs font-semibold text-[var(--muted)]">{label}
                <textarea value={content[key]} onChange={(event) => patch({ [key]: event.target.value } as Partial<InvestigationContent>)} rows={key === "interpretation" ? 5 : 3} className={`${inputClass()} resize-y leading-6`} />
              </label>
            ))}
          </section>
        </aside>
      </section>

      <section className="mt-5 rounded-[18px] border border-[var(--line)] bg-[#f2f5f5] p-4 sm:p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Live final renderer preview</p>
        <InvestigationViewer title={metadata.title} content={saveContent} compact />
      </section>

      <div className="mt-5">
        <ResourceActions
          resourceId={resourceId}
          initialStatus={metadata.status}
          initialUpdatedAt={updatedAt}
          isAdmin={role === "admin"}
          disabled={status !== "saved"}
          onUpdatedAt={adoptUpdatedAt}
          onStatusChange={onStatusChange}
        />
      </div>
    </main>
  );
}
