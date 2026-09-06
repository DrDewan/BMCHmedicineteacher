import Link from "next/link";

export default function PresentationsPage() {
  return (
    <main className="pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>
      <section className="mt-5 border-b border-[var(--line)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Teaching Decks</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Presentations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Native BMCH clinical teaching presentations will be created here using structured slide types rather than a full PowerPoint clone.
        </p>
      </section>
      <section className="mt-6 rounded-[18px] border border-dashed border-[#cbd5d9] bg-white px-5 py-12 text-center">
        <p className="font-bold">Presentation builder is scheduled after the resource library and viewers.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">The route exists now so navigation and deployment architecture stay stable as the feature is added.</p>
      </section>
    </main>
  );
}
