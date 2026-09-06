import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";

const futureBuilders = ["Clinical Image", "X-Ray", "ECG", "Question", "Presentation"];

export default async function CreatePage() {
  const profile = await requireActiveProfile();
  const canEdit = profile.role === "admin" || profile.role === "editor";

  if (!canEdit) {
    return <main><p className="text-sm text-[var(--muted)]">You do not have permission to create department content.</p></main>;
  }

  return (
    <main className="pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>
      <section className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Authoring</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Create teaching content</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Create native BMCH material or upload an existing file. Native content remains editable and reusable across teaching sessions.</p>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/create/teaching-material" className="rounded-[18px] border border-[#b7d2cf] bg-[#f8fcfb] p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent)] text-xs font-extrabold text-white">TM</span>
          <h2 className="mt-5 text-xl font-bold">Teaching Material</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">Build an editable slide-format teaching deck.</p>
        </Link>
        <Link href="/create/clinical-case" className="rounded-[18px] border border-[#b7d2cf] bg-[#f8fcfb] p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent)] text-xs font-extrabold text-white">CC</span>
          <h2 className="mt-5 text-xl font-bold">Clinical Case</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">Build a progressive case with vitals, questions, findings, diagnosis and management.</p>
        </Link>
        <Link href="/create/investigation" className="rounded-[18px] border border-[#b7d2cf] bg-[#f8fcfb] p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent)] text-xs font-extrabold text-white">IN</span>
          <h2 className="mt-5 text-xl font-bold">Investigation</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">Build ABG, CBC, LFT, U&E and other interpretation exercises with editable result tables.</p>
        </Link>
        <Link href="/create/procedure" className="rounded-[18px] border border-[#b7d2cf] bg-[#f8fcfb] p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent)] text-xs font-extrabold text-white">PR</span>
          <h2 className="mt-5 text-xl font-bold">Procedure</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">Build ordered procedural teaching with safety checks, equipment, step images, complications and viva prompts.</p>
        </Link>
        <Link href="/upload" className="rounded-[18px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-xs font-extrabold text-[var(--accent)]">UP</span>
          <h2 className="mt-5 text-xl font-bold">Upload Existing File</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">PDF, PowerPoint, Word or image material.</p>
        </Link>
        {futureBuilders.map((label) => (
          <div key={label} className="rounded-[18px] border border-dashed border-[#ccd6da] bg-white/60 p-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Builder next</span>
            <h2 className="mt-4 text-lg font-bold">{label}</h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">Specified and ready for the next authoring increment.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
