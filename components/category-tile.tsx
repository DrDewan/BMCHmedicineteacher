import Link from "next/link";
import type { Category } from "@/lib/categories";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/library/${category.slug}`}
      className="group flex min-h-[172px] flex-col justify-between rounded-[18px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_28px_rgba(25,40,55,0.05)] transition duration-150 hover:-translate-y-0.5 hover:border-[#ccd7db] hover:shadow-[0_14px_34px_rgba(25,40,55,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:p-6"
    >
      <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-sm font-extrabold tracking-[0.05em] text-[var(--accent)]">
        {category.shortLabel}
      </span>
      <span>
        <span className="block text-xl font-bold tracking-[-0.025em] text-[var(--foreground)]">
          {category.title}
        </span>
        <span className="mt-1.5 block text-[13px] leading-5 text-[var(--muted)]">
          {category.description}
        </span>
      </span>
    </Link>
  );
}
