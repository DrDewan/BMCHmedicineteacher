"use client";

import { useRef, useState } from "react";
import type { InvestigationContent } from "@/lib/investigation";

function cleanLegacyHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function TextBlock({ title, value, tone = "normal" }: { title: string; value: string; tone?: "normal" | "key" | "warning" }) {
  if (!value.trim()) return null;
  const classes = tone === "key"
    ? "border-[#b7d2cf] bg-[#f5fbfa]"
    : tone === "warning"
      ? "border-[#ead8a6] bg-[#fffaf0]"
      : "border-[var(--line)] bg-white";
  return (
    <section className={`rounded-[18px] border p-5 sm:p-6 ${classes}`}>
      <h3 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h3>
      <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[#27323a]">{value}</div>
    </section>
  );
}

export function InvestigationViewer({ title, content, compact = false }: { title: string; content: InvestigationContent; compact?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(compact);
  const [fullscreen, setFullscreen] = useState(false);

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
            <p className="text-[11px] text-white/60">Investigation interpretation teaching view</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRevealed((value) => !value)} className="rounded-lg bg-[#2e8d87] px-3 py-2 text-xs font-semibold">{revealed ? "Hide interpretation" : "Reveal interpretation"}</button>
            <button type="button" onClick={toggleFullscreen} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold">{fullscreen ? "Exit full screen" : "Full screen"}</button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {content.image_url ? (
          <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[#0c1114] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.image_url} alt={title} className="mx-auto max-h-[55vh] max-w-full object-contain" />
          </div>
        ) : null}

        <TextBlock title="Clinical context" value={content.clinical_context} />

        <section className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#eef4f4]">
                <tr>
                  {content.table.columns.map((column) => <th key={column.id} className="border-b border-r border-[var(--line)] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.06em] text-[#536168] last:border-r-0">{column.label || "Column"}</th>)}
                </tr>
              </thead>
              <tbody>
                {content.table.rows.map((row) => (
                  <tr key={row.id}>
                    {content.table.columns.map((column) => {
                      const abnormal = row.abnormal_cells.includes(column.id);
                      return <td key={column.id} className={`border-b border-r border-[var(--line)] px-4 py-3 last:border-r-0 ${abnormal ? "bg-red-50 font-bold text-red-800" : ""}`}>{row.cells[column.id] || "—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TextBlock title="Student prompt" value={content.student_prompt} tone="key" />

        {revealed ? (
          <>
            <TextBlock title="Interpretation" value={content.interpretation} tone="key" />
            <TextBlock title="Differential" value={content.differential} />
            <TextBlock title="Next investigation / step" value={content.next_step} />
            <TextBlock title="Management implication" value={content.management_implication} />
            <TextBlock title="Teaching point" value={content.teaching_point} tone="key" />
            <TextBlock title="Warning / exam trap" value={content.warning} tone="warning" />
            {content.legacy_html ? (
              <section className="rounded-[18px] border border-dashed border-[#cbd6d8] bg-white p-5 sm:p-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Imported approved content</p>
                <div className="prototype-content" dangerouslySetInnerHTML={{ __html: cleanLegacyHtml(content.legacy_html) }} />
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
