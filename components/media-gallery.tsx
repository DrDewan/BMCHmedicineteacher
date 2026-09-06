"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StarterStructuredContent } from "./prototype-content";
import { PrototypeHtml } from "./prototype-content";

export type MediaGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  content: StarterStructuredContent;
};

export function MediaGallery({ items }: { items: MediaGalleryItem[] }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const item = items[index];

  useEffect(() => {
    function onFullscreen() { setIsFullscreen(document.fullscreenElement === shellRef.current); }
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") { setIndex((v) => (v + 1) % items.length); setRevealed(false); }
      if (event.key === "ArrowLeft") { setIndex((v) => (v - 1 + items.length) % items.length); setRevealed(false); }
      if (event.key === " ") { event.preventDefault(); setRevealed((v) => !v); }
      if (event.key.toLowerCase() === "f" && shellRef.current) {
        if (document.fullscreenElement) document.exitFullscreen(); else shellRef.current.requestFullscreen();
      }
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); window.removeEventListener("keydown", onKey); };
  }, [items.length]);

  if (!item) return null;

  function step(delta: number) {
    setIndex((value) => (value + delta + items.length) % items.length);
    setRevealed(false);
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen(); else await shellRef.current.requestFullscreen();
  }

  return (
    <div>
      <div ref={shellRef} className={`media-shell ${isFullscreen ? "media-fullscreen" : ""}`}>
        <div className="media-toolbar">
          <div className="flex gap-2">
            <button className="viewer-btn" onClick={() => step(-1)}>‹</button>
            <button className="viewer-btn" onClick={() => step(1)}>›</button>
          </div>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-white">{item.title}</p>
            <p className="text-[11px] text-white/55">{index + 1} of {items.length} · {item.description}</p>
          </div>
          <div className="flex gap-2">
            <button className="viewer-btn viewer-btn-primary" onClick={() => setRevealed((v) => !v)}>{revealed ? "Hide" : "Reveal interpretation"}</button>
            <button className="viewer-btn" onClick={toggleFullscreen}>{isFullscreen ? "Exit" : "Full screen"}</button>
          </div>
        </div>
        <div className="media-stage">
          {item.content.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.content.image_url} alt={item.title} className="max-h-full max-w-full object-contain" />
          ) : <p className="text-sm text-white/60">No image preview is available.</p>}
        </div>
        <div className="media-footer">
          <span>{item.content.credit ?? "BMCH teaching resource"}</span>
          <div className="flex gap-3">
            <Link href={`/resources/${item.id}`} className="font-semibold text-[#c6ece8]">Open resource</Link>
            {item.content.source_url ? <a href={item.content.source_url} target="_blank" rel="noreferrer" className="font-semibold text-[#c6ece8]">Source ↗</a> : null}
          </div>
        </div>
      </div>

      {revealed && item.content.body_html ? (
        <div className="mt-0 rounded-b-[18px] border border-t-0 border-[var(--line)] bg-white p-5 sm:p-6">
          <PrototypeHtml html={item.content.body_html} />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((media, mediaIndex) => (
          <button key={media.id} onClick={() => { setIndex(mediaIndex); setRevealed(false); }} className={`overflow-hidden rounded-[13px] border bg-white text-left ${mediaIndex === index ? "border-[var(--accent)] ring-2 ring-[#0f5f5b22]" : "border-[var(--line)]"}`}>
            <div className="grid h-24 place-items-center overflow-hidden bg-[#11171b]">
              {media.content.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.content.image_url} alt="" className="h-full w-full object-contain" />
              ) : null}
            </div>
            <p className="truncate px-2.5 py-2 text-xs font-semibold">{media.title}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[var(--muted)]">Keyboard: ← / → previous-next · Space reveal/hide · F full screen.</p>
    </div>
  );
}
