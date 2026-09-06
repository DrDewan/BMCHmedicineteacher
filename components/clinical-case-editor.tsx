"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClinicalCaseViewer } from "@/components/clinical-case-viewer";
import { ResourceActions } from "@/components/resource-actions";
import { ResourceMetadataEditor } from "@/components/resource-metadata-editor";
import { useResourceAutosave } from "@/components/use-resource-autosave";
import {
  cloneClinicalCaseStage,
  coerceClinicalCase,
  createClinicalCaseStage,
  type ClinicalCaseContent,
  type ClinicalCaseReference,
  type ClinicalCaseStage,
  type ClinicalCaseStageStyle,
  type ClinicalCaseStageType,
  type ClinicalCaseVital,
} from "@/lib/clinical-case";
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

const stageTypes: { value: ClinicalCaseStageType; label: string }[] = [
  { value: "presentation", label: "Presentation + vitals" },
  { value: "pause", label: "Pause and ask" },
  { value: "history", label: "Focused history" },
  { value: "examination", label: "Examination" },
  { value: "investigations", label: "Investigations" },
  { value: "differential", label: "Differential diagnosis" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "management", label: "Management" },
  { value: "escalation", label: "Escalation / red flags" },
  { value: "pearls", label: "Exam traps / teaching pearls" },
  { value: "references", label: "References" },
];

const styles: { value: ClinicalCaseStageStyle; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "key", label: "Key point" },
  { value: "warning", label: "Warning" },
  { value: "danger", label: "Danger / red flag" },
];

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

export function ClinicalCaseEditor({ resourceId, initialMetadata, initialUpdatedAt, initialContent, categories, role }: Props) {
  const coerced = useMemo(() => coerceClinicalCase(initialContent), [initialContent]);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [stages, setStages] = useState<ClinicalCaseStage[]>(coerced.stages);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addType, setAddType] = useState<ClinicalCaseStageType>("examination");

  const selected = stages[selectedIndex] ?? null;
  const content = useMemo<ClinicalCaseContent>(() => ({
    ...coerced,
    schema_version: 1,
    native_kind: "clinical_case",
    subtitle: metadata.description || coerced.subtitle || "",
    stages,
    body_html: undefined,
  }), [coerced, metadata.description, stages]);

  const payload = useMemo(() => ({
    metadata: editableMetadataFromEditor(metadata),
    content,
  }), [content, metadata]);

  const { status, updatedAt, retry, adoptUpdatedAt } = useResourceAutosave({
    url: `/api/resources/${resourceId}/clinical-case`,
    payload,
    initialUpdatedAt,
  });

  function updateStage(patch: Partial<ClinicalCaseStage>) {
    setStages((items) => items.map((stage, index) => index === selectedIndex ? { ...stage, ...patch } : stage));
  }

  function addStage() {
    const stage = createClinicalCaseStage(addType);
    setStages((items) => {
      const next = [...items];
      next.splice(selectedIndex + 1, 0, stage);
      return next;
    });
    setSelectedIndex((index) => Math.min(index + 1, stages.length));
  }

  function moveStage(delta: number) {
    const target = selectedIndex + delta;
    if (target < 0 || target >= stages.length) return;
    setStages((items) => {
      const next = [...items];
      [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]];
      return next;
    });
    setSelectedIndex(target);
  }

  function duplicateStage() {
    if (!selected) return;
    const copy = cloneClinicalCaseStage(selected);
    setStages((items) => {
      const next = [...items];
      next.splice(selectedIndex + 1, 0, copy);
      return next;
    });
    setSelectedIndex(selectedIndex + 1);
  }

  function deleteStage() {
    if (!selected || !window.confirm(`Delete “${selected.title || "this stage"}”?`)) return;
    setStages((items) => items.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((index) => Math.max(0, Math.min(index - 1, stages.length - 2)));
  }

  function updateVital(index: number, patch: Partial<ClinicalCaseVital>) {
    updateStage({ vitals: (selected?.vitals ?? []).map((vital, itemIndex) => itemIndex === index ? { ...vital, ...patch } : vital) });
  }

  function addVital() {
    const vital: ClinicalCaseVital = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? `vital-${crypto.randomUUID()}` : `vital-${Date.now()}`,
      label: "",
      value: "",
    };
    updateStage({ vitals: [...(selected?.vitals ?? []), vital] });
  }

  function removeVital(index: number) {
    updateStage({ vitals: (selected?.vitals ?? []).filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateReference(index: number, patch: Partial<ClinicalCaseReference>) {
    updateStage({ references: (selected?.references ?? []).map((reference, itemIndex) => itemIndex === index ? { ...reference, ...patch } : reference) });
  }

  function addReference() {
    const reference: ClinicalCaseReference = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? `reference-${crypto.randomUUID()}` : `reference-${Date.now()}`,
      label: "",
      url: "",
    };
    updateStage({ references: [...(selected?.references ?? []), reference] });
  }

  function removeReference(index: number) {
    updateStage({ references: (selected?.references ?? []).filter((_, itemIndex) => itemIndex !== index) });
  }

  function onStatusChange(next: ResourceStatus) {
    setMetadata((value) => ({ ...value, status: next }));
  }

  const selectedPreview: ClinicalCaseContent = {
    ...content,
    stages: selected ? [selected] : [],
  };

  return (
    <main className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/resources/${resourceId}`} className="text-sm font-semibold text-[var(--accent)]">← Back to resource</Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Clinical Case Builder</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build the case in the order you want students to discover it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveState status={status} retry={retry} />
          <a href={`/resources/${resourceId}`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Preview / Present</a>
        </div>
      </div>

      <ResourceMetadataEditor value={metadata} categories={categories} onChange={setMetadata} />

      <section className="mt-5 grid min-h-[680px] gap-4 lg:grid-cols-[230px_minmax(0,1fr)_350px]">
        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Case stages</p>
            <span className="text-xs text-[var(--muted)]">{stages.length}</span>
          </div>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <button key={stage.id} type="button" onClick={() => setSelectedIndex(index)} className={`w-full rounded-xl border p-3 text-left transition ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-white hover:border-[#bfd0cf]"}`}>
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{index + 1} · {stage.type}{stage.hidden ? " · hidden" : ""}</span>
                <span className="mt-1 block truncate text-sm font-semibold">{stage.title || "Untitled stage"}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-3">
            <select value={addType} onChange={(event) => setAddType(event.target.value as ClinicalCaseStageType)} className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-xs">
              {stageTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button type="button" onClick={addStage} className="w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-semibold text-white">+ Add after selected</button>
          </div>
        </aside>

        <div className="rounded-[18px] border border-[var(--line)] bg-[#f2f5f5] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Stage preview</p>
            {selected?.hidden ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800">Hidden in presentation</span> : null}
          </div>
          <ClinicalCaseViewer title={metadata.title} content={selectedPreview} compact />
        </div>

        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveStage(-1)} disabled={selectedIndex === 0} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↑ Move</button>
                <button type="button" onClick={() => moveStage(1)} disabled={selectedIndex === stages.length - 1} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↓ Move</button>
                <button type="button" onClick={duplicateStage} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs">Duplicate</button>
                <button type="button" onClick={deleteStage} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700">Delete</button>
              </div>

              <label className="block text-xs font-semibold text-[var(--muted)]">Stage heading
                <input value={selected.title} maxLength={240} onChange={(event) => updateStage({ title: event.target.value })} className={inputClass()} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-[var(--muted)]">Style
                  <select value={selected.style} onChange={(event) => updateStage({ style: event.target.value as ClinicalCaseStageStyle })} className={inputClass()}>
                    {styles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-[var(--muted)]">
                  <input type="checkbox" checked={selected.hidden} onChange={(event) => updateStage({ hidden: event.target.checked })} className="h-4 w-4" /> Hide stage
                </label>
              </div>

              {selected.type === "legacy" ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Imported approved case HTML</p>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => updateStage({ html: event.currentTarget.innerHTML })}
                    className="prototype-content min-h-[420px] rounded-xl border border-[var(--line)] bg-[#f8fafb] p-4 outline-none focus:border-[var(--accent)]"
                    dangerouslySetInnerHTML={{ __html: selected.html ?? "" }}
                  />
                  <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">This preserves the original starter case exactly. You can edit its visible content or add new structured stages around it. New cases use structured fields throughout.</p>
                </div>
              ) : null}

              {selected.type === "presentation" ? (
                <>
                  <label className="block text-xs font-semibold text-[var(--muted)]">Presentation narrative
                    <textarea value={selected.text ?? ""} onChange={(event) => updateStage({ text: event.target.value })} rows={8} className={`${inputClass()} resize-y leading-6`} placeholder="A 58-year-old man presents with..." />
                  </label>
                  <div>
                    <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-[var(--muted)]">Vitals</p><button type="button" onClick={addVital} className="text-xs font-semibold text-[var(--accent)]">+ Add vital</button></div>
                    <div className="space-y-2">
                      {(selected.vitals ?? []).map((vital, index) => (
                        <div key={vital.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                          <input value={vital.label} onChange={(event) => updateVital(index, { label: event.target.value })} placeholder="Pulse" className="rounded-lg border border-[var(--line)] px-2.5 py-2 text-xs" />
                          <input value={vital.value} onChange={(event) => updateVital(index, { value: event.target.value })} placeholder="112/min" className="rounded-lg border border-[var(--line)] px-2.5 py-2 text-xs" />
                          <button type="button" onClick={() => removeVital(index)} className="rounded-lg border border-red-100 px-2 text-xs text-red-700">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {["pause", "history", "examination", "differential", "management", "pearls"].includes(selected.type) ? (
                <label className="block text-xs font-semibold text-[var(--muted)]">{selected.type === "pause" ? "Questions" : "Points"}
                  <textarea value={(selected.items ?? []).join("\n")} onChange={(event) => updateStage({ items: event.target.value.split("\n") })} rows={12} className={`${inputClass()} resize-y leading-6`} placeholder="One point per line" />
                </label>
              ) : null}

              {["investigations", "diagnosis", "escalation"].includes(selected.type) ? (
                <label className="block text-xs font-semibold text-[var(--muted)]">Content
                  <textarea value={selected.text ?? ""} onChange={(event) => updateStage({ text: event.target.value })} rows={12} className={`${inputClass()} resize-y leading-6`} />
                </label>
              ) : null}

              {selected.type === "references" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-[var(--muted)]">References</p><button type="button" onClick={addReference} className="text-xs font-semibold text-[var(--accent)]">+ Add reference</button></div>
                  <div className="space-y-3">
                    {(selected.references ?? []).map((reference, index) => (
                      <div key={reference.id} className="rounded-xl border border-[var(--line)] p-3">
                        <input value={reference.label} onChange={(event) => updateReference(index, { label: event.target.value })} placeholder="NICE CG141 — Acute upper GI bleeding" className="w-full rounded-lg border border-[var(--line)] px-2.5 py-2 text-xs" />
                        <input value={reference.url} onChange={(event) => updateReference(index, { url: event.target.value })} placeholder="https://..." className="mt-2 w-full rounded-lg border border-[var(--line)] px-2.5 py-2 text-xs" />
                        <button type="button" onClick={() => removeReference(index)} className="mt-2 text-xs font-semibold text-red-700">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : <p className="text-sm text-[var(--muted)]">Add a case stage to begin.</p>}
        </aside>
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
