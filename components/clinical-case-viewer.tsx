"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClinicalCaseContent, ClinicalCaseStage } from "@/lib/clinical-case";

function cleanLegacyHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function paragraphText(value = "") {
  return value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

function StageCard({ stage }: { stage: ClinicalCaseStage }) {
  if (stage.type === "legacy") {
    return <div className="prototype-content" dangerouslySetInnerHTML={{ __html: cleanLegacyHtml(stage.html ?? "") }} />;
  }

  const tone = stage.style === "key"
    ? "border-[#b7d2cf] bg-[#f5fbfa]"
    : stage.style === "warning"
      ? "border-[#ead8a6] bg-[#fffaf0]"
      : stage.style === "danger"
        ? "border-[#ecc3c3] bg-[#fff7f7]"
        : "border-[var(--line)] bg-white";

  const titleTone = stage.style === "danger" ? "text-red-800" : stage.style === "warning" ? "text-amber-800" : "text-[var(--foreground)]";
  const items = (stage.items ?? []).map((item) => item.trim()).filter(Boolean);
  const references = (stage.references ?? []).filter((item) => item.label.trim() || item.url.trim());

  return (
    <section className={`rounded-[18px] border p-5 sm:p-6 ${tone}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className={`text-lg font-extrabold tracking-[-0.02em] ${titleTone}`}>{stage.title}</h3>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{stage.type}</span>
      </div>

      {stage.type === "presentation" ? (
        <>
          <div className="space-y-3 text-[15px] leading-7 text-[#27323a]">
            {paragraphText(stage.text).map((part, index) => <p key={index}>{part}</p>)}
          </div>
          {(stage.vitals ?? []).some((vital) => vital.label.trim() || vital.value.trim()) ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(stage.vitals ?? []).filter((vital) => vital.label.trim() || vital.value.trim()).map((vital) => (
                <div key={vital.id} className="rounded-xl border border-[#dce5e7] bg-white px-3 py-3">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{vital.label || "Vital"}</span>
                  <strong className="mt-1 block text-base">{vital.value || "—"}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {stage.type !== "presentation" && stage.type !== "references" && stage.type !== "legacy" && stage.text ? (
        <div className="space-y-3 text-[15px] leading-7 text-[#27323a]">
          {paragraphText(stage.text).map((part, index) => <p key={index}>{part}</p>)}
        </div>
      ) : null}

      {items.length ? (
        stage.type === "pause" ? (
          <ol className="ml-5 list-decimal space-y-2 text-[15px] leading-6 text-[#27323a]">{items.map((item, index) => <li key={`${stage.id}-${index}`}>{item}</li>)}</ol>
        ) : (
          <ul className="ml-5 list-disc space-y-2 text-[15px] leading-6 text-[#27323a]">{items.map((item, index) => <li key={`${stage.id}-${index}`}>{item}</li>)}</ul>
        )
      ) : null}

      {stage.type === "references" && references.length ? (
        <div className="space-y-2">
          {references.map((reference) => reference.url ? (
            <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline">{reference.label || reference.url} ↗</a>
          ) : <p key={reference.id} className="text-sm text-[#27323a]">{reference.label}</p>)}
        </div>
      ) : null}
    </section>
  );
}

export function ClinicalCaseViewer({ title, content, compact = false }: { title: string; content: ClinicalCaseContent; compact?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const stages = useMemo(() => content.stages.filter((stage) => !stage.hidden), [content.stages]);
  const [revealedCount, setRevealedCount] = useState(Math.min(1, stages.length));
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setRevealedCount((value) => Math.min(Math.max(value, 1), Math.max(stages.length, 1)));
  }, [stages.length]);

  useEffect(() => {
    function onFullscreen() {
      setFullscreen(document.fullscreenElement === shellRef.current);
    }
    function onKey(event: KeyboardEvent) {
      if (compact) return;
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        setRevealedCount((value) => Math.min(stages.length, value + 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setRevealedCount((value) => Math.max(1, value - 1));
      }
      if (event.key.toLowerCase() === "f" && shellRef.current) {
        event.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else shellRef.current.requestFullscreen();
      }
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKey);
    };
  }, [compact, stages.length]);

  if (!stages.length) {
    return <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">No visible case stages yet.</div>;
  }

  const visible = compact ? stages : stages.slice(0, revealedCount);

  async function toggleFullscreen() {
    if (!shellRef.current || compact) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  }

  return (
    <div ref={shellRef} className={fullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-[#f4f7f7] p-4 sm:p-7" : ""}>
      {!compact ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[#10191d] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="text-[11px] text-white/60">Revealed {Math.min(revealedCount, stages.length)} of {stages.length} stages</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRevealedCount((value) => Math.max(1, value - 1))} disabled={revealedCount <= 1} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold disabled:opacity-30">Previous</button>
            <button type="button" onClick={() => setRevealedCount((value) => Math.min(stages.length, value + 1))} disabled={revealedCount >= stages.length} className="rounded-lg bg-[#2e8d87] px-3 py-2 text-xs font-semibold disabled:opacity-30">Reveal next</button>
            <button type="button" onClick={() => setRevealedCount(stages.length)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold">Show all</button>
            <button type="button" onClick={() => setRevealedCount(1)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold">Reset</button>
            <button type="button" onClick={toggleFullscreen} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold">{fullscreen ? "Exit full screen" : "Full screen"}</button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {visible.map((stage) => <StageCard key={stage.id} stage={stage} />)}
      </div>

      {!compact ? <p className="mt-3 text-center text-[10px] text-[var(--muted)]">← / → reveal stages · Space next · F full screen</p> : null}
    </div>
  );
}
