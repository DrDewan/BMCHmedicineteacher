import Link from "next/link";
import { CategoryTile } from "@/components/category-tile";
import { categories } from "@/lib/categories";
import { requireActiveProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await requireActiveProfile();
  const canEdit = profile.role === "admin" || profile.role === "editor";

  return (
    <main>
      <section className="pb-6 pt-4 sm:pb-7 sm:pt-5">
        <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">Medicine Education</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[var(--muted)] sm:text-base">Cases, teaching resources and clinical reference material for final-year MBBS teaching.</p>
        <p className="mt-3 text-xs text-[var(--muted)]">Signed in as <span className="font-semibold text-[var(--foreground)]">{profile.full_name || "BMCH user"}</span> · {profile.role}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Teaching resource categories">
        {categories.map((category) => <CategoryTile key={category.slug} category={category} />)}
        <Link href="/practice" className="group flex min-h-[170px] flex-col justify-between rounded-[18px] border border-[#cfe0de] bg-[#f8fcfb] p-[22px] shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition duration-150 hover:-translate-y-0.5 hover:border-[#9fc4bf]">
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--accent)] text-white">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10v4H7z"/><path d="M5 8h14v12H5z"/><path d="m9 13 2 2 4-4"/></svg>
          </span>
          <span><span className="block text-xl font-bold tracking-[-0.025em]">Practice Round</span><span className="mt-1 block text-[13px] leading-5 text-[var(--muted)]">A mixed 10-question teaching round.</span></span>
        </Link>
      </section>

      <section className="mt-8 flex flex-wrap gap-2 border-t border-[var(--line)] pt-6 text-sm">
        {canEdit ? <><Link href="/upload" className="rounded-xl bg-[var(--accent)] px-4 py-2.5 font-semibold text-white">Upload Resource</Link><Link href="/presentations" className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 font-semibold">Build Presentation</Link></> : null}
        <form action="/auth/signout" method="post"><button className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 font-semibold text-[var(--muted)]">Sign out</button></form>
      </section>
    </main>
  );
}
