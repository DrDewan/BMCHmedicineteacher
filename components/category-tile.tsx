import Link from "next/link";
import type { Category } from "@/lib/categories";

function CategoryIcon({ slug }: { slug: string }) {
  const common = { width: 25, height: 25, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (slug) {
    case "clinical-cases":
      return <svg {...common}><path d="M9 3h6l1 3h3v15H5V6h3l1-3Z"/><path d="M9 11h6M9 15h6"/></svg>;
    case "teaching-materials":
      return <svg {...common}><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
    case "clinical-images":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>;
    case "x-rays":
      return <svg {...common}><path d="M12 3v18"/><path d="M11 6C7 5 5 8 5 12s2 7 6 6M13 6c4-1 6 2 6 6s-2 7-6 6"/></svg>;
    case "ecg":
      return <svg {...common}><path d="M3 13h4l2-6 4 11 2-5h6"/></svg>;
    case "investigations":
      return <svg {...common}><path d="M9 3v5l-4 8a3 3 0 0 0 3 5h8a3 3 0 0 0 3-5l-4-8V3"/><path d="M8 13h8"/></svg>;
    case "procedures":
      return <svg {...common}><path d="m4 20 6-6M14 4l6 6M9 15l6-6M12 6l6 6"/></svg>;
    case "question-bank":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.4 1-1.4 2.1M12 17h.01"/></svg>;
    default:
      return <svg {...common}><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>;
  }
}

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/library/${category.slug}`}
      className="group flex min-h-[170px] flex-col justify-between rounded-[18px] border border-[var(--line)] bg-white p-[22px] shadow-[0_10px_28px_rgba(25,40,55,0.05)] transition duration-150 hover:-translate-y-0.5 hover:border-[#ccd7db] hover:shadow-[0_14px_34px_rgba(25,40,55,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]">
        <CategoryIcon slug={category.slug} />
      </span>
      <span>
        <span className="block text-xl font-bold tracking-[-0.025em] text-[var(--foreground)]">{category.title}</span>
        <span className="mt-1 block text-[13px] leading-5 text-[var(--muted)]">{category.description}</span>
      </span>
    </Link>
  );
}
