"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  coerceTeachingMaterial,
  createSlide,
  slideToHtml,
  type NativeSlide,
  type NativeSlideType,
  type TeachingMaterialContent,
} from "@/lib/authoring";

type Props = {
  resourceId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialUpdatedAt: string;
  initialContent: unknown;
};

const slideTypes: { value: NativeSlideType; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "objectives", label: "Learning objectives" },
  { value: "content", label: "Teaching point" },
  { value: "case", label: "Clinical case" },
  { value: "investigation", label: "Investigation" },
  { value: "question", label: "Question + answer" },
  { value: "summary", label: "Summary" },
];

function cloneSlide(slide: NativeSlide): NativeSlide {
  return {
    ...slide,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${slide.id}-copy-${Date.now()}`,
    bullets: slide.bullets ? [...slide.bullets] : undefined,
  };
}

export function TeachingMaterialEditor({
  resourceId,
  initialTitle,
  initialDescription,
  initialUpdatedAt,
  initialContent,
}: Props) {
  const coerced = useMemo(() => coerceTeachingMaterial(initialContent), [initialContent]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [subtitle, setSubtitle] = useState(coerced.subtitle ?? "");
  const [tagsText, setTagsText] = useState((coerced.tags ?? []).join(", "));
  const [slides, setSlides] = useState<NativeSlide[]>(coerced.slides ?? []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<"saved" | "saving" | "error" | "conflict">("saved");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [addType, setAddType] = useState<NativeSlideType>("content");
  const lastSavedRef = useRef("");

  const selected = slides[selectedIndex] ?? null;
  const payload = useMemo(() => {
    const content: TeachingMaterialContent = {
      ...coerced,
      native_kind: "teaching_material",
      subtitle,
      tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
      slides,
      slides_html: undefined,
    };
    return { title, description, content };
  }, [coerced, description, slides, subtitle, tagsText, title]);

  useEffect(() => {
    if (!lastSavedRef.current) {
      lastSavedRef.current = JSON.stringify(payload);
      return;
    }
    const serialised = JSON.stringify(payload);
    if (serialised === lastSavedRef.current) return;

    setStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/resources/${resourceId}/teaching-material`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, expectedUpdatedAt: updatedAt }),
        });
        if (response.status === 409) {
          setStatus("conflict");
          return;
        }
        if (!response.ok) throw new Error("Save failed");
        const result = (await response.json()) as { updatedAt: string };
        setUpdatedAt(result.updatedAt);
        lastSavedRef.current = serialised;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 850);

    return () => window.clearTimeout(timeout);
  }, [payload, resourceId, updatedAt]);

  function updateSlide(patch: Partial<NativeSlide>) {
    setSlides((items) => items.map((slide, index) => index === selectedIndex ? { ...slide, ...patch } : slide));
  }

  function addSlide() {
    const slide = createSlide(addType);
    setSlides((items) => {
      const next = [...items, slide];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }

  function moveSlide(delta: number) {
    const target = selectedIndex + delta;
    if (target < 0 || target >= slides.length) return;
    setSlides((items) => {
      const next = [...items];
      [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]];
      return next;
    });
    setSelectedIndex(target);
  }

  function duplicateSlide() {
    if (!selected) return;
    setSlides((items) => {
      const next = [...items];
      next.splice(selectedIndex + 1, 0, cloneSlide(selected));
      return next;
    });
    setSelectedIndex(selectedIndex + 1);
  }

  function deleteSlide() {
    if (!selected) return;
    setSlides((items) => items.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((index) => Math.max(0, index - 1));
  }

  return (
    <main className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/resources/${resourceId}`} className="text-sm font-semibold text-[var(--accent)]">← Back to resource</Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Edit Teaching Material</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-3 py-1.5 font-semibold ${status === "saved" ? "bg-[#eaf4f3] text-[var(--accent)]" : status === "saving" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
            {status === "saved" ? "Saved" : status === "saving" ? "Saving…" : status === "conflict" ? "Newer version exists — reload" : "Save failed"}
          </span>
          <Link href={`/resources/${resourceId}`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Preview / Present</Link>
        </div>
      </div>

      <section className="mb-5 grid gap-3 rounded-[18px] border border-[var(--line)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-[var(--muted)]">Title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
        <label className="text-xs font-semibold text-[var(--muted)]">Subtitle<input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
        <label className="text-xs font-semibold text-[var(--muted)]">Tags<input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Respiratory, Emergency" className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
        <label className="text-xs font-semibold text-[var(--muted)]">Description<input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
      </section>

      <section className="grid min-h-[640px] gap-4 lg:grid-cols-[220px_minmax(0,1fr)_330px]">
        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-3">
          <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Slides</p><span className="text-xs text-[var(--muted)]">{slides.length}</span></div>
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" onClick={() => setSelectedIndex(index)} className={`w-full rounded-xl border p-3 text-left transition ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-white hover:border-[#bfd0cf]"}`}>
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{index + 1} · {slide.type}</span>
                <span className="mt-1 block truncate text-sm font-semibold">{slide.title || "Untitled slide"}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-3">
            <select value={addType} onChange={(e) => setAddType(e.target.value as NativeSlideType)} className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-xs">{slideTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <button type="button" onClick={addSlide} className="w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-semibold text-white">+ Add slide</button>
          </div>
        </aside>

        <div className="rounded-[18px] border border-[var(--line)] bg-[#0d1418] p-4 sm:p-6">
          {selected ? (
            <div className="mx-auto flex min-h-[520px] max-w-[900px] items-center justify-center rounded-xl bg-[#f8fafb] p-8 shadow-2xl">
              <div className="prototype-content w-full" dangerouslySetInnerHTML={{ __html: slideToHtml(selected) }} />
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center text-center text-white/60"><div><p className="font-semibold text-white">No slides yet</p><p className="mt-2 text-sm">Choose a slide type and add your first slide.</p></div></div>
          )}
        </div>

        <aside className="rounded-[18px] border border-[var(--line)] bg-white p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveSlide(-1)} disabled={selectedIndex === 0} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↑ Move</button>
                <button type="button" onClick={() => moveSlide(1)} disabled={selectedIndex === slides.length - 1} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs disabled:opacity-30">↓ Move</button>
                <button type="button" onClick={duplicateSlide} className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs">Duplicate</button>
                <button type="button" onClick={deleteSlide} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700">Delete</button>
              </div>

              {selected.type === "legacy" ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Imported prototype slide</p>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => updateSlide({ html: event.currentTarget.innerHTML })}
                    className="prototype-content min-h-[360px] rounded-xl border border-[var(--line)] bg-[#f8fafb] p-4 outline-none focus:border-[var(--accent)]"
                    dangerouslySetInnerHTML={{ __html: selected.html ?? "" }}
                  />
                  <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">Click directly into the slide and edit its visible text. New slides use structured fields below.</p>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-[var(--muted)]">Slide type<select value={selected.type} onChange={(e) => updateSlide({ type: e.target.value as NativeSlideType })} className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)]">{slideTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  <label className="block text-xs font-semibold text-[var(--muted)]">Heading<input value={selected.title} onChange={(e) => updateSlide({ title: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
                  {selected.type === "objectives" || selected.type === "summary" ? (
                    <label className="block text-xs font-semibold text-[var(--muted)]">Bullet points<textarea value={(selected.bullets ?? []).join("\n")} onChange={(e) => updateSlide({ bullets: e.target.value.split("\n") })} rows={10} placeholder="One point per line" className="mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
                  ) : (
                    <label className="block text-xs font-semibold text-[var(--muted)]">Content<textarea value={selected.body ?? ""} onChange={(e) => updateSlide({ body: e.target.value })} rows={10} className="mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>
                  )}
                  {selected.type === "question" ? <label className="block text-xs font-semibold text-[var(--muted)]">Answer<textarea value={selected.answer ?? ""} onChange={(e) => updateSlide({ answer: e.target.value })} rows={6} className="mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label> : null}
                </>
              )}
            </div>
          ) : <p className="text-sm text-[var(--muted)]">Add a slide to begin authoring.</p>}
        </aside>
      </section>
    </main>
  );
}
