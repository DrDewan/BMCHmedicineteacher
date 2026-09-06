import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { categories, getCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

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
  const profile = await requireActiveProfile();
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const canEdit = profile.role === "admin" || profile.role === "editor";
  const supabase = await createClient();

  const { data: dbCategory } = await supabase
    .from("resource_categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!dbCategory) {
    notFound();
  }

  const { data: resources, error } = await supabase
    .from("resources")
    .select("id, title, description, resource_type, status, visibility, updated_at")
    .eq("category_id", dbCategory.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

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
        {canEdit ? (
          <Link href={`/upload?category=${category.slug}`} className="w-fit rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">
            Upload here
          </Link>
        ) : null}
      </section>

      {error ? (
        <section className="mt-6 rounded-[18px] border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-800">
          The resource list could not be loaded. Please try again or contact the department administrator.
        </section>
      ) : resources && resources.length > 0 ? (
        <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {resources.map((resource) => (
            <Link
              key={resource.id}
              href={`/resources/${resource.id}`}
              className="rounded-[18px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(25,40,55,0.035)] transition hover:-translate-y-0.5 hover:border-[#bccdd1]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold tracking-[-0.02em]">{resource.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {resource.description || "No description added yet."}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-[#eef5f4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
                  {resource.resource_type}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="capitalize">{resource.status}</span>
                <span>·</span>
                <span className="capitalize">{resource.visibility}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="mt-6 rounded-[18px] border border-dashed border-[#cbd5d9] bg-white px-5 py-12 text-center sm:px-8">
          <p className="text-base font-bold">No resources in this section yet</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            {canEdit
              ? "Upload the first approved teaching resource for this category."
              : "No approved resources are currently available in this category."}
          </p>
        </section>
      )}
    </main>
  );
}
