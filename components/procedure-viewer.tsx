"use client";

import { useRef, useState } from "react";
import type { ProcedureContent } from "@/lib/procedure";

function cleanLegacyHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function ListBlock({ title, items, tone = "normal" }: { title: string; items: string[]; tone?: "normal" | "warning" | "danger" }) {
  const visible = items.filter((item) => item.trim());
  if (!visible.length) return null;
  const classes = tone === "danger"
    ? "border-red-200 bg-red-50"
    : tone === "warning"
      ? "border-[#ead8a6] bg-[#fffaf0]"
      : "border-[var(--line)] bg-white";
  return (
    <section className={`rounded-[18px] border p-5 sm:p-6 ${classes}`}>
      <h3 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h3>
      <ul className="mt-3 ml-5 list-disc space-y-2 text-[15px] leading-7 text-[#27323a]">
        {visible.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </section>
  );
}

export function ProcedureViewer({ title, content, compact = false }: { title: string; content: ProcedureContent; compact?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const visibleSteps = content.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(compact);
  const [fullscreen, setFullscreen] = useState(false);
  const step = visibleSteps[stepIndex] ?? null;

  async function toggleFullscreen() {
    if (!shellRef.current || compact) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreen(false);
    } else {
      await shellRef.current.requestFullscreen();
      setFullscreen(true);
    }
  }

  return (
    <div ref={shellRef} className={fullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-[#f4f7f7] p-4 sm:p-7" : ""}>
      {!compact ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[#10191d] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="text-[11px] text-white/60">Procedure teaching view · {visibleSteps.length ? `Step ${Math.min(stepIndex + 1, visibleSteps.length)} of ${visibleSteps.length}` : "No steps"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAnswers((value) => !value)} className="rounded-lg bg-[#2e8d87] px-3 py-2 text-xs font-semibold">{showAnswers ? "Hide viva/pearls" : "Reveal viva/pearls"}</button>
            <button type="button" onClick={toggleFullscreen} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold">{fullscreen ? "Exit full screen" : "Full screen"}</button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {content.overview_image_url ? (
          <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[#0c1114] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.overview_image_url} alt={title} className="mx-auto max-h-[45vh] max-w-full object-contain" />
          </div>
        ) : null}

        {content.overview.trim() ? (
          <section className="rounded-[18px] border border-[var(--line)] bg-white p-5 sm:p-6">
            <h3 className="text-lg font-extrabold tracking-[-0.02em]">Overview</h3>
            <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[#27323a]">{content.overview}</div>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <ListBlock title="Indications" items={content.indications} />
          <ListBlock title="Contraindications / safety checks" items={content.contraindications} tone="danger" />
          <ListBlock title="Equipment" items={content.equipment} />
          <ListBlock title="Preparation" items={content.preparation} />
        </div>

        {step ? (
          <section className="rounded-[20px] border border-[#b7d2cf] bg-[#f8fcfb] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Technique · step {stepIndex + 1}</p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">{step.title || `Step ${stepIndex + 1}`}</h3>
              </div>
              {!compact ? (
                <div className="flex gap-2">
                  <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-30">Previous</button>
                  <button type="button" disabled={stepIndex >= visibleSteps.length - 1} onClick={() => setStepIndex((value) => Math.min(visibleSteps.length - 1, value + 1))} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-30">Next</button>
                </div>
              ) : null}
            </div>

            {step.image_url ? (
              <div className="mt-5 overflow-hidden rounded-[16px] bg-[#0c1114] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.image_url} alt={step.title || `Procedure step ${stepIndex + 1}`} className="mx-auto max-h-[48vh] max-w-full object-contain" />
              </div>
            ) : null}

            <div className="mt-5 whitespace-pre-wrap text-[16px] leading-7 text-[#253137]">{step.instruction || "No instruction entered yet."}</div>
            {step.safety_warning.trim() ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong>Safety:</strong> {step.safety_warning}</div> : null}
            {showAnswers && step.teaching_pearl.trim() ? <div className="mt-3 rounded-xl border border-[#ead8a6] bg-[#fffaf0] p-4 text-sm leading-6 text-[#6e5a2a]"><strong>Teaching pearl:</strong> {step.teaching_pearl}</div> : null}
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <ListBlock title="Complications" items={content.complications} tone="warning" />
          <ListBlock title="Aftercare" items={content.aftercare} />
          <ListBlock title="Common errors" items={content.common_errors} tone="warning" />
          {showAnswers ? <ListBlock title="Viva questions" items={content.viva_questions} /> : null}
        </div>

        {showAnswers && content.references.length ? (
          <section className="rounded-[18px] border border-[var(--line)] bg-white p-5 sm:p-6">
            <h3 className="text-lg font-extrabold tracking-[-0.02em]">References</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#27323a]">
              {content.references.filter((item) => item.label.trim() || item.url.trim()).map((item) => <li key={item.id}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] underline underline-offset-2">{item.label || item.url}</a> : item.label}</li>)}
            </ul>
          </section>
        ) : null}

        {showAnswers && content.legacy_html ? (
          <section className="rounded-[18px] border border-dashed border-[#cbd6d8] bg-white p-5 sm:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Imported approved content</p>
            <div className="prototype-content" dangerouslySetInnerHTML={{ __html: cleanLegacyHtml(content.legacy_html) }} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
