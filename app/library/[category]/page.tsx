import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaGallery, type MediaGalleryItem } from "@/components/media-gallery";
import type { StarterStructuredContent } from "@/components/prototype-content";
import { requireActiveProfile } from "@/lib/auth";
import { categories, getCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  return category ? { title: category.title } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const profile = await requireActiveProfile();
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const canEdit = profile.role === "admin" || profile.role === "editor";
  const supabase = await createClient();

  // Fetch the category and its visible resources in one PostgREST request.
  // This replaces the previous category lookup followed by a second resources query.
  const { data: dbCategory, error } = await supabase
    .from("resource_categories")
    .select(`
      id,
      resources (
        id,
        title,
        description,
        resource_type,
        status,
        visibility,
        updated_at,
        structured_content,
        deleted_at
      )
    `)
    .eq("slug", slug)
    .is("resources.deleted_at", null)
    .order("updated_at", { referencedTable: "resources", ascending: false })
    .maybeSingle();

  if (!error && !dbCategory) notFound();

  const resources = dbCategory?.resources ?? [];
  const isMediaCategory = ["clinical-images", "x-rays", "ecg"].includes(slug);
  const mediaItems: MediaGalleryItem[] = resources
    .filter((resource) => {
      const content = resource.structured_content as unknown as StarterStructuredContent;
      return Boolean(content?.image_url);
    })
    .map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resourceType: resource.resource_type,
      content: resource.structured_content as unknown as StarterStructuredContent,
    }));

  return (
    <main className="pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>

      <section className="mt-5 flex flex-col gap-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-[34px]">{category.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">{category.description}</p>
        </div>
        {canEdit ? <Link href={`/upload?category=${category.slug}`} className="w-fit rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Upload here</Link> : null}
      </section>

      {error ? (
        <section className="mt-2 rounded-[18px] border border-red-200 bg-red-50 p-5 text-sm text-red-800">The resource list could not be loaded.</section>
      ) : isMediaCategory && mediaItems.length > 0 ? (
        <section className="mt-2"><MediaGallery items={mediaItems} /></section>
      ) : resources.length > 0 ? (
        <section className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {resources.map((resource) => {
            const content = resource.structured_content as unknown as StarterStructuredContent;
            const image = content?.image_url;
            const tags = content?.tags ?? [];
            return (
              <Link key={resource.id} href={`/resources/${resource.id}`} className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white shadow-[0_5px_16px_rgba(25,40,55,0.035)] transition hover:-translate-y-0.5 hover:border-[#cbd6db]">
                {image && slug === "procedures" ? (
                  <div className="grid h-[190px] place-items-center border-b border-[var(--line)] bg-[#eef2f3] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : null}
                <div className="p-[18px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{resource.title}</h2>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[var(--muted)]">{resource.description || "Open teaching resource"}</p>
                    </div>
                    {slug === "teaching-materials" ? <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--accent)]">Slides</span> : null}
                  </div>
                  {tags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{tags.slice(0,4).map((tag) => <span key={tag} className="rounded-full bg-[#f1f4f5] px-2 py-1 text-[10px] text-[#64717a]">{tag}</span>)}</div> : null}
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="mt-2 rounded-[18px] border border-dashed border-[#cbd5d9] bg-white px-5 py-12 text-center">
          <p className="font-bold">No resources in this section yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{canEdit ? "Upload the first teaching resource for this category." : "No approved resources are currently available."}</p>
        </section>
      )}
    </main>
  );
}
