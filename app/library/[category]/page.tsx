import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/lib/categories";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  return category ? { title: category.title } : {};
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
        ← Back to library
      </Link>

      <section className="mt-5 flex flex-col gap-5 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Resource Library</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{category.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">{category.description}</p>
        </div>
        <Link href={`/upload?category=${category.slug}`} className="w-fit rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">
          Upload here
        </Link>
      </section>

      <section className="mt-6 rounded-[18px] border border-dashed border-[#cbd5d9] bg-white px-5 py-12 text-center sm:px-8">
        <p className="text-base font-bold">No connected library content yet</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
          The category route and teaching-library shell are ready. Supabase-backed upload, storage, search and resource cards are the next implementation phase.
        </p>
      </section>
    </main>
  );
}
