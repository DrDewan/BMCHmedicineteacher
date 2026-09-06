"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type StarterStructuredContent = {
  starter_key?: string;
  prototype_source?: string;
  subtitle?: string | null;
  tags?: string[];
  body_html?: string;
  slides_html?: string[];
  image_url?: string | null;
  source_url?: string | null;
  credit?: string | null;
};

function cleanTrustedHtml(value = "") {
  return value.replace(/\sonclick="[^"]*"/g, "");
}

export function PrototypeHtml({ html }: { html: string }) {
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest("button.reveal") as HTMLButtonElement | null;
    if (!button) return;
    const answer = button.nextElementSibling as HTMLElement | null;
    if (!answer) return;
    const visible = answer.classList.toggle("is-visible");
    button.textContent = visible ? "Hide answer" : "Show answer";
  }

  return (
    <div
      className="prototype-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: cleanTrustedHtml(html) }}
    />
  );
}

function TagList({ tags = [] }: { tags?: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-[#f0f4f4] px-2.5 py-1 text-[11px] font-semibold text-[#65727b]">
          {tag}
        </span>
      ))}
    </div>
  );
}

function TeachingDeck({ title, content }: { title: string; content: StarterStructuredContent }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => {
    const intro = `<div class="deck-intro"><p class="deck-kicker">BMCH Medicine Teaching</p><h2>${title}</h2>${
      content.subtitle ? `<p>${content.subtitle}</p>` : ""
    }</div>`;
    return [intro, ...(content.slides_html ?? [])];
  }, [content.slides_html, content.subtitle, title]);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreen() {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setIndex((value) => Math.min(slides.length - 1, value + 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((value) => Math.max(0, value - 1));
      }
      if (event.key.toLowerCase() === "f" && viewerRef.current) {
        event.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else viewerRef.current.requestFullscreen();
      }
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKey);
    };
  }, [slides.length]);

  async function toggleFullscreen() {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewerRef.current.requestFullscreen();
  }

  return (
    <div ref={viewerRef} className={`deck-shell ${isFullscreen ? "deck-fullscreen" : ""}`}>
      <div className="deck-toolbar">
        <div className="flex gap-2">
          <button onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0} className="viewer-btn">
            ‹
          </button>
          <button onClick={() => setIndex((v) => Math.min(slides.length - 1, v + 1))} disabled={index === slides.length - 1} className="viewer-btn">
            ›
          </button>
        </div>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="text-[11px] text-white/60">Slide {index + 1} of {slides.length}</p>
        </div>
        <button onClick={toggleFullscreen} className="viewer-btn viewer-btn-primary">
          {isFullscreen ? "Exit" : "Full screen"}
        </button>
      </div>
      <div className="h-1 bg-[#2d373e]"><div className="h-full bg-[#3fa39d]" style={{ width: `${((index + 1) / slides.length) * 100}%` }} /></div>
      <div className="deck-stage">
        <div className="deck-slide prototype-content" dangerouslySetInnerHTML={{ __html: cleanTrustedHtml(slides[index]) }} />
      </div>
      <div className="deck-hint">← / → navigate · Space next · F full screen</div>
    </div>
  );
}

export function StarterResourceViewer({
  title,
  resourceType,
  content,
}: {
  title: string;
  resourceType: string;
  content: StarterStructuredContent;
}) {
  if (resourceType === "presentation" && content.slides_html?.length) {
    return <TeachingDeck title={title} content={content} />;
  }

  return (
    <div className="space-y-4">
      {content.image_url ? (
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[#0c1114]">
          <div className="flex min-h-[420px] items-center justify-center p-4 sm:min-h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.image_url} alt={title} className="max-h-[70vh] max-w-full object-contain" />
          </div>
          {(content.credit || content.source_url) ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#151d21] px-4 py-3 text-xs text-white/65">
              <span>{content.credit}</span>
              {content.source_url ? <a className="font-semibold text-[#bfe9e5]" href={content.source_url} target="_blank" rel="noreferrer">Source / licence ↗</a> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {content.body_html ? <PrototypeHtml html={content.body_html} /> : null}
      <TagList tags={content.tags} />
    </div>
  );
}
