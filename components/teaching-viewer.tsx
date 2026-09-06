"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type PreviewPage = {
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl?: string | null;
};

type TeachingViewerProps = {
  title: string;
  kind: "pdf" | "image" | "slides" | "pending";
  fileUrl?: string | null;
  pages?: PreviewPage[];
  originalUrl?: string | null;
  processingStatus?: string | null;
};

export function TeachingViewer({
  title,
  kind,
  fileUrl,
  pages = [],
  originalUrl,
  processingStatus,
}: TeachingViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentPage = pages[pageIndex];
  const canStepPages = kind === "slides" && pages.length > 0;

  const pageLabel = useMemo(() => {
    if (!canStepPages) return null;
    return `${pageIndex + 1} / ${pages.length}`;
  }, [canStepPages, pageIndex, pages.length]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!canStepPages) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setPageIndex((value) => Math.min(value + 1, pages.length - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setPageIndex((value) => Math.max(value - 1, 0));
      }
      if (event.key.toLowerCase() === "f" && viewerRef.current) {
        event.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void viewerRef.current.requestFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canStepPages, pages.length]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [pageIndex]);

  async function toggleFullscreen() {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await viewerRef.current.requestFullscreen();
    }
  }

  function zoomIn() {
    setZoom((value) => Math.min(Number((value + 0.2).toFixed(1)), 2.4));
  }

  function zoomOut() {
    setZoom((value) => Math.max(Number((value - 0.2).toFixed(1)), 0.6));
  }

  return (
    <div
      ref={viewerRef}
      className={`overflow-hidden rounded-[20px] border border-[var(--line)] bg-[#11191d] ${
        isFullscreen ? "h-screen w-screen rounded-none border-0" : ""
      }`}
    >
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#162126] px-3 py-2 text-white sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {pageLabel ? <p className="text-xs text-white/60">Slide {pageLabel}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canStepPages ? (
            <>
              <button
                type="button"
                onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                disabled={pageIndex === 0}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-30"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPageIndex((value) => Math.min(pages.length - 1, value + 1))}
                disabled={pageIndex >= pages.length - 1}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-30"
              >
                Next
              </button>
            </>
          ) : null}

          {kind === "image" || kind === "slides" ? (
            <>
              <button type="button" onClick={zoomOut} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
                −
              </button>
              <span className="min-w-12 text-center text-xs text-white/70">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={zoomIn} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
                +
              </button>
              <button type="button" onClick={() => setZoom(1)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
                Fit
              </button>
            </>
          ) : null}

          {originalUrl ? (
            <a href={originalUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
              Original
            </a>
          ) : null}

          <button type="button" onClick={toggleFullscreen} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white">
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className={`${isFullscreen ? "h-[calc(100vh-56px)]" : "h-[68vh] min-h-[520px]"} flex flex-col bg-[#0d1418]`}>
        <div className="relative min-h-0 flex-1 overflow-auto">
          {kind === "pdf" && fileUrl ? (
            <iframe title={`${title} PDF viewer`} src={`${fileUrl}#toolbar=1&navpanes=0&view=FitH`} className="h-full w-full bg-white" />
          ) : null}

          {kind === "image" && fileUrl ? (
            <div className="flex min-h-full min-w-full items-center justify-center p-6">
              <div className="relative h-[80%] min-h-[420px] w-[90%] min-w-[320px] origin-center transition-transform" style={{ transform: `scale(${zoom})` }}>
                <Image src={fileUrl} alt={title} fill unoptimized sizes="100vw" className="object-contain" priority />
              </div>
            </div>
          ) : null}

          {kind === "slides" && currentPage ? (
            <div className="flex min-h-full min-w-full items-center justify-center p-6">
              <div className="relative aspect-[16/9] w-[92%] min-w-[480px] origin-center bg-white shadow-2xl transition-transform" style={{ transform: `scale(${zoom})` }}>
                <Image src={currentPage.imageUrl} alt={`${title}, slide ${currentPage.pageNumber}`} fill unoptimized sizes="100vw" className="object-contain" priority />
              </div>
            </div>
          ) : null}

          {kind === "pending" ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-white">
              <div className="max-w-lg">
                <p className="text-lg font-bold">Preview is not ready yet</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {processingStatus === "failed"
                    ? "Document processing failed. The original file is still available to editors."
                    : "This PowerPoint or Word document is being converted into teaching-slide previews."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {kind === "slides" && pages.length > 1 ? (
          <div className="shrink-0 overflow-x-auto border-t border-white/10 bg-[#151d21] px-3 py-2">
            <div className="flex w-max gap-2">
              {pages.map((page, index) => (
                <button
                  key={page.pageNumber}
                  ref={index === pageIndex ? activeThumbRef : undefined}
                  type="button"
                  onClick={() => {
                    setPageIndex(index);
                    setZoom(1);
                  }}
                  className={`relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                    index === pageIndex ? "border-[#55bcb5]" : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                  aria-label={`Open slide ${page.pageNumber}`}
                >
                  <Image
                    src={page.thumbnailUrl || page.imageUrl}
                    alt={`Slide ${page.pageNumber} thumbnail`}
                    fill
                    unoptimized
                    sizes="120px"
                    className="object-contain"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {page.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
