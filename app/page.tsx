import Link from "next/link";
import { CategoryTile } from "@/components/category-tile";
import { categories } from "@/lib/categories";

export default function HomePage() {
  return (
    <main>
      <section className="pb-6 pt-4 sm:pb-7 sm:pt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Final Year MBBS · Internal Educational Use
        </p>
        <h1 className="max-w-3xl text-[34px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)] sm:text-[44px]">
          Medicine Education
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--muted)] sm:text-base">
          Cases, teaching resources and clinical reference material designed for fast registrar-led teaching.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Teaching resource categories">
        {categories.map((category) => (
          <CategoryTile key={category.slug} category={category} />
        ))}

        <Link
          href="/practice"
          className="group flex min-h-[172px] flex-col justify-between rounded-[18px] border border-[#cfe0de] bg-[#f8fcfb] p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] transition duration-150 hover:-translate-y-0.5 hover:border-[#9fc4bf] sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--accent)] text-sm font-extrabold tracking-[0.05em] text-white">
            MIX
          </span>
          <span>
            <span className="block text-xl font-bold tracking-[-0.025em] text-[var(--foreground)]">
              Practice Round
            </span>
            <span className="mt-1.5 block text-[13px] leading-5 text-[var(--muted)]">
              Mixed cases, images, ECGs, X-rays, investigations and procedures.
            </span>
          </span>
        </Link>
      </section>

      <section className="mt-8 flex flex-wrap gap-2 border-t border-[var(--line)] pt-6 text-sm">
        <Link href="/upload" className="rounded-xl bg-[var(--accent)] px-4 py-2.5 font-semibold text-white">
          Upload Resource
        </Link>
        <Link href="/presentations" className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 font-semibold text-[var(--foreground)]">
          Build Presentation
        </Link>
      </section>
    </main>
  );
}
