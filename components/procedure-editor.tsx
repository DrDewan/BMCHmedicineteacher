"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProcedureViewer } from "@/components/procedure-viewer";
import { ResourceActions } from "@/components/resource-actions";
import { ResourceMetadataEditor } from "@/components/resource-metadata-editor";
import { useResourceAutosave } from "@/components/use-resource-autosave";
import {
  cloneProcedureStep,
  coerceProcedure,
  createProcedureStep,
  newProcedureReference,
  type ProcedureContent,
  type ProcedureReference,
  type ProcedureStep,
} from "@/lib/procedure";
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

type ListKey = "indications" | "contraindications" | "equipment" | "preparation" | "complications" | "aftercare" | "common_errors" | "viva_questions";

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

function StringListEditor({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <section className="rounded-[18px] border border-[var(--line)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{title}</p>
        <button type="button" disabled={items.length >= 80} onClick={() => onChange([...items, ""])} className="text-xs font-semibold text-[var(--accent)] disabled:opacity-30">+ Add</button>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
            <textarea value={item} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} rows={2} placeholder={placeholder} className="w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm leading-6 outline-none focus:border-[var(--accent)]" />
            <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="self-start rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700">×</button>
          </div>
        ))}
        {!items.length ? <p className="text-xs text-[var(--muted)]">No items yet.</p> : null}
      </div>
    </section>
  );
}

export function ProcedureEditor({ resourceId, initialMetadata, initialUpdatedAt, initialContent, categories, role }: Props) {
  const coerced = useMemo(() => coerceProcedure(initialContent), [initialContent]);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [content, setContent] = useState<ProcedureContent>(coerced);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = content.steps[selectedIndex] ?? null;
  const saveContent = useMemo<ProcedureContent>(() => ({
    ...content,
    schema_version: 1,
    native_kind: "procedure",
    subtitle: metadata.description || content.subtitle || "",
    tags: metadata.tags,
    body_html: undefined,
    image_url: undefined,
  }), [content, metadata.description, metadata.tags]);

  const payload = useMemo(() => ({ metadata: editableMetadataFromEditor(metadata), content: saveContent }), [metadata, saveContent]);
  const { status, updatedAt, retry, adoptUpdatedAt } = useResourceAutosave({
    url: `/api/resources/${resourceId}/procedure`,
    payload,
    initialUpdatedAt,
  });

  function patch(change: Partial<ProcedureContent>) {
    setContent((value) => ({ ...value, ...change }));
  }

  function setList(key: ListKey, items: string[]) {
    patch({ [key]: items } as Pick<ProcedureContent, ListKey>);
  }

  function updateStep(change: Partial<ProcedureStep>) {
    setContent((value) => ({ ...value, steps: value.steps.map((step, index) => index === selectedIndex ? { ...step, ...change } : step) }));
  }

  function addStep() {
    const step = createProcedureStep(`Step ${content.steps.length + 1}`);
    setContent((value) => {
      const steps = [...value.steps];
      steps.splice(selectedIndex + 1, 0, step);
      return { ...value, steps };
    });
    setSelectedIndex((index) => Math.min(index + 1, content.steps.length));
  }

  function moveStep(delta: number) {
    const target = selectedIndex + delta;
    if (target < 0 || target >= content.steps.length) return;
    setContent((value) => {
      const steps = [...value.steps];
      [steps[selectedIndex], steps[target]] = [steps[target], steps[selectedIndex]];
      return { ...value, steps };
    });
    setSelectedIndex(target);
  }

  function duplicateStep() {
    if (!selected) return;
    const copy = cloneProcedureStep(selected);
    setContent((value) => {
      const steps = [...value.steps];
      steps.splice(selectedIndex + 1, 0, copy);
      return { ...value, steps };
    });
    setSelectedIndex(selectedIndex + 1);
  }

  function deleteStep() {
    if (!selected || !window.confirm(`Delete “${selected.title || "this step"}”?`)) return;
    setContent((value) => ({ ...value, steps: value.steps.filter((_, index) => index !== selectedIndex) }));
    setSelectedIndex((index) => Math.max(0, Math.min(index - 1, content.steps.length - 2)));
  }

  function updateReference(index: number, change: Partial<ProcedureReference>) {
    patch({ references: content.references.map((reference, itemIndex) => itemIndex === index ? { ...reference, ...change } : reference) });
  }

  function onStatusChange(next: ResourceStatus) {
    setMetadata((value) => ({ ...value, status: next }));
  }

  const selectedPreview: ProcedureContent = { ...saveContent, steps: selected ? [selected] : [] };

  return (
    <main className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/resources/${resourceId}`} className="text-sm font-semibold text-[var(--accent)]">← Back to resource</Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Procedure Builder</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build a safe, ordered procedure that can be taught one step at a time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveState status={status} retry={retry} />
          <a href={`/resources/${resourceId}`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Preview / Present</a>
        </div>
      </div>

      <ResourceMetadataEditor value={metadata} categories={categories} onChange={setMetadata} />

      <section className="mt-5 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Procedure steps</p>
            <span className="text-xs text-[var(--muted)]">{content.steps.length}</span>
          </div>
          <div className="space-y-2">
            {content.steps.map((step, index) => (
              <button key={step.id} type="button" onClick={() => setSelectedIndex(index)} className={`w-full rounded-xl border p-3 text-left ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-white hover:border-[#bfd0cf]"}`}>
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Step {index + 1}{step.image_url ? " · image" : ""}</span>
                <span className="mt-1 block truncate text-sm font-semibold">{step.title || "Untitled step"}</span>
              </button>
            ))}
          </div>
          <button type="button" disabled={content.steps.length >= 60} onClick={addStep} className="mt-4 w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40">+ Add step</button>
        </aside>

        <div className="rounded-[18px] border border-[var(--line)] bg-[#f2f5f5] p-4 sm:p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Selected step preview</p>
          <ProcedureViewer title={metadata.title} content={selectedPreview} compact />
        </div>

        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveStep(-1)} disabled={selectedIndex === 0} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↑ Move</button>
                <button type="button" onClick={() => moveStep(1)} disabled={selectedIndex === content.steps.length - 1} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↓ Move</button>
                <button type="button" onClick={duplicateStep} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs">Duplicate</button>
                <button type="button" onClick={deleteStep} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700">Delete</button>
              </div>
              <label className="block text-xs font-semibold text-[var(--muted)]">Step title
                <input value={selected.title} onChange={(event) => updateStep({ title: event.target.value })} maxLength={240} className={inputClass()} />
              </label>
              <label className="block text-xs font-semibold text-[var(--muted)]">Instruction
                <textarea value={selected.instruction} onChange={(event) => updateStep({ instruction: event.target.value })} rows={8} className={`${inputClass()} resize-y leading-6`} placeholder="Describe exactly what the learner should do..." />
              </label>
              <label className="block text-xs font-semibold text-[var(--muted)]">Image for this step
                <input value={selected.image_url ?? ""} onChange={(event) => updateStep({ image_url: event.target.value || null })} placeholder="https://..." className={inputClass()} />
              </label>
              <p className="-mt-2 text-[11px] leading-4 text-[var(--muted)]">Per-step images work now by URL. Direct BMCH Library selection will replace/extend this in Increment 7.</p>
              <label className="block text-xs font-semibold text-red-700">Safety warning
                <textarea value={selected.safety_warning} onChange={(event) => updateStep({ safety_warning: event.target.value })} rows={3} className={`${inputClass()} resize-y leading-6`} />
              </label>
              <label className="block text-xs font-semibold text-[#7a642f]">Teaching pearl
                <textarea value={selected.teaching_pearl} onChange={(event) => updateStep({ teaching_pearl: event.target.value })} rows={3} className={`${inputClass()} resize-y leading-6`} />
              </label>
            </div>
          ) : <p className="text-sm text-[var(--muted)]">Add a procedure step to begin.</p>}
        </aside>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[18px] border border-[var(--line)] bg-white p-5 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Overview</p>
          <label className="mt-4 block text-xs font-semibold text-[var(--muted)]">Overview / purpose
            <textarea value={content.overview} onChange={(event) => patch({ overview: event.target.value })} rows={4} className={`${inputClass()} resize-y leading-6`} />
          </label>
          <label className="mt-4 block text-xs font-semibold text-[var(--muted)]">Optional overview image URL
            <input value={content.overview_image_url ?? ""} onChange={(event) => patch({ overview_image_url: event.target.value || null })} className={inputClass()} placeholder="https://..." />
          </label>
        </section>

        <StringListEditor title="Indications" items={content.indications} onChange={(items) => setList("indications", items)} />
        <StringListEditor title="Contraindications / safety checks" items={content.contraindications} onChange={(items) => setList("contraindications", items)} />
        <StringListEditor title="Equipment" items={content.equipment} onChange={(items) => setList("equipment", items)} />
        <StringListEditor title="Preparation" items={content.preparation} onChange={(items) => setList("preparation", items)} />
        <StringListEditor title="Complications" items={content.complications} onChange={(items) => setList("complications", items)} />
        <StringListEditor title="Aftercare" items={content.aftercare} onChange={(items) => setList("aftercare", items)} />
        <StringListEditor title="Common errors" items={content.common_errors} onChange={(items) => setList("common_errors", items)} />
        <StringListEditor title="Viva questions" items={content.viva_questions} onChange={(items) => setList("viva_questions", items)} />

        <section className="rounded-[18px] border border-[var(--line)] bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">References</p>
            <button type="button" disabled={content.references.length >= 40} onClick={() => patch({ references: [...content.references, newProcedureReference()] })} className="text-xs font-semibold text-[var(--accent)] disabled:opacity-30">+ Add reference</button>
          </div>
          <div className="mt-3 space-y-2">
            {content.references.map((reference, index) => (
              <div key={reference.id} className="grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]">
                <input value={reference.label} onChange={(event) => updateReference(index, { label: event.target.value })} placeholder="Guideline / source" className="rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm" />
                <input value={reference.url} onChange={(event) => updateReference(index, { url: event.target.value })} placeholder="https://..." className="rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm" />
                <button type="button" onClick={() => patch({ references: content.references.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700">×</button>
              </div>
            ))}
          </div>
        </section>
      </section>

      {content.legacy_html ? (
        <section className="mt-5 rounded-[18px] border border-dashed border-[#cbd6d8] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Imported starter content</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">The original approved procedure HTML is preserved and appears after Reveal viva/pearls until you have recreated its clinical content in structured fields.</p>
          <button type="button" onClick={() => window.confirm("Remove the preserved imported HTML? Only do this after you have recreated its clinical content in the structured fields.") && patch({ legacy_html: undefined })} className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Remove imported HTML</button>
        </section>
      ) : null}

      <section className="mt-5 rounded-[18px] border border-[var(--line)] bg-[#f2f5f5] p-4 sm:p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Live final renderer preview</p>
        <ProcedureViewer title={metadata.title} content={saveContent} compact />
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
