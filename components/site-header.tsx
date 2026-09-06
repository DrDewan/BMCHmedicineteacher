import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-6 py-6 sm:py-7">
      <Link href="/" className="flex min-w-0 items-center gap-3 no-underline">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[var(--accent)] text-xs font-extrabold tracking-[0.06em] text-white">
          BMCH
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-bold tracking-[-0.02em] text-[var(--foreground)] sm:text-[19px]">
            Department of Medicine
          </span>
          <span className="mt-0.5 block text-xs text-[var(--muted)]">
            Education Resource Library
          </span>
        </span>
      </Link>

      <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
        <Link
          href="/presentations"
          className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)]"
        >
          Presentations
        </Link>
        <Link
          href="/upload"
          className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[#c8d3d7]"
        >
          Upload Resource
        </Link>
      </nav>
    </header>
  );
}
