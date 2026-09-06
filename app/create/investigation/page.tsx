import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createInvestigation } from "./actions";

export default async function CreateInvestigationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") {
    return <main><p className="text-sm text-[var(--muted)]">You do not have permission to create investigations.</p></main>;
  }
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-2xl pb-12">
      <Link href="/create" className="text-sm font-semibold text-[var(--accent)]">← Back to Create</Link>
      <section className="mt-5 rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(25,40,55,0.04)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Native BMCH content</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">New Investigation</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Start with the investigation identity. The builder opens with a reusable Test / Result / Unit / Reference range table that you can reshape.</p>

        <form action={createInvestigation} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">Title
            <input name="title" required maxLength={200} placeholder="ABG — acute hypercapnic respiratory failure" className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="block text-sm font-semibold">Opening description
            <input name="description" maxLength={500} placeholder="COPD exacerbation with respiratory acidosis" className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="block text-sm font-semibold">System / topic
            <input name="system" maxLength={120} placeholder="Respiratory" className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]" />
          </label>
          {params.error ? <p className="text-sm text-red-700">Please check the investigation details and try again.</p> : null}
          <button className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white">Create and open Investigation Builder</button>
        </form>
      </section>
    </main>
  );
}
