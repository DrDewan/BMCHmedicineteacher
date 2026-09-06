"use client";

import type { ResourceCategoryOption, ResourceEditorMetadata, ResourceVisibility } from "@/lib/resource-authoring";

type Props = {
  value: ResourceEditorMetadata;
  categories: ResourceCategoryOption[];
  onChange: (next: ResourceEditorMetadata) => void;
};

const visibilityOptions: { value: ResourceVisibility; label: string }[] = [
  { value: "private", label: "Private draft" },
  { value: "registrars", label: "Registrars" },
  { value: "department", label: "Department" },
  { value: "students", label: "Students" },
];

function fieldClass() {
  return "mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm font-normal text-[var(--foreground)] outline-none focus:border-[var(--accent)]";
}

export function ResourceMetadataEditor({ value, categories, onChange }: Props) {
  const patch = (change: Partial<ResourceEditorMetadata>) => onChange({ ...value, ...change });

  return (
    <section className="rounded-[18px] border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Resource details</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Metadata autosaves. Publishing remains a separate explicit action.</p>
        </div>
        <span className="rounded-full bg-[#f1f4f5] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#617079]">{value.status}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-[var(--muted)] sm:col-span-2">Title
          <input value={value.title} maxLength={200} onChange={(event) => patch({ title: event.target.value })} className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Category
          <select value={value.categoryId} onChange={(event) => patch({ categoryId: event.target.value })} className={fieldClass()}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Visibility
          <select value={value.visibility} onChange={(event) => patch({ visibility: event.target.value as ResourceVisibility })} className={fieldClass()}>
            {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Topic / system
          <input value={value.topic} maxLength={120} onChange={(event) => patch({ topic: event.target.value })} placeholder="Respiratory" className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Subtopic
          <input value={value.subtopic} maxLength={120} onChange={(event) => patch({ subtopic: event.target.value })} placeholder="Acute asthma" className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Audience
          <input value={value.audience} maxLength={120} onChange={(event) => patch({ audience: event.target.value })} placeholder="Final Year MBBS" className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Difficulty
          <input value={value.difficulty} maxLength={80} onChange={(event) => patch({ difficulty: event.target.value })} placeholder="Standard" className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)] sm:col-span-2">Tags
          <input value={value.tags.join(", ")} onChange={(event) => patch({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 30) })} placeholder="Emergency, Respiratory, Viva" className={fieldClass()} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)] sm:col-span-2">Description
          <textarea value={value.description} maxLength={2000} rows={3} onChange={(event) => patch({ description: event.target.value })} className={`${fieldClass()} resize-y`} />
        </label>
      </div>
    </section>
  );
}
