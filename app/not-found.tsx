import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Resource not found</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">The page or category you requested does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Return to library</Link>
    </main>
  );
}
