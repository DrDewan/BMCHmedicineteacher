import Link from "next/link";

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-3xl pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>
      <section className="mt-5 rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(25,40,55,0.04)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Mixed Teaching Assessment</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Practice Round</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          This will generate mixed rounds from approved cases, X-rays, ECGs, clinical images, investigations, procedures and document-derived questions.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["10", "Default questions"],
            ["Mixed", "Resource formats"],
            ["Reviewed", "Question pool"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-[var(--surface-muted)] p-4">
              <p className="text-xl font-extrabold text-[var(--foreground)]">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
