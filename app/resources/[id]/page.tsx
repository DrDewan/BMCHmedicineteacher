import Link from "next/link";
import { notFound } from "next/navigation";
import { StarterResourceViewer, type StarterStructuredContent } from "@/components/prototype-content";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireActiveProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, title, description, category_id, resource_type, status, visibility, current_version_id, structured_content, created_at, updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !resource) notFound();

  const [{ data: category }, { data: version }] = await Promise.all([
    resource.category_id ? supabase.from("resource_categories").select("name, slug").eq("id", resource.category_id).single() : Promise.resolve({ data: null }),
    resource.current_version_id ? supabase.from("resource_versions").select("id, version_number, original_filename, mime_type, file_size, storage_path, preview_path, processing_status, processing_error, created_at").eq("id", resource.current_version_id).single() : Promise.resolve({ data: null }),
  ]);

  const content = resource.structured_content as unknown as StarterStructuredContent;
  const isStructuredStarter = Boolean(content?.starter_key);
  const canEdit = profile.role === "admin" || profile.role === "editor";

  let signedUrl: string | null = null;
  if (version?.storage_path) {
    const { data } = await supabase.storage.from("bmch-resources").createSignedUrl(version.storage_path, 10 * 60);
    signedUrl = data?.signedUrl ?? null;
  }

  const fileSize = version?.file_size ? (version.file_size >= 1024 * 1024 ? `${(version.file_size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(version.file_size / 1024)} KB`) : null;

  return (
    <main className="pb-12">
      <Link href={category?.slug ? `/library/${category.slug}` : "/"} className="text-sm font-semibold text-[var(--accent)]">← Back to {category?.name || "library"}</Link>

      <section className="mt-5 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">{category?.name || "Resource"}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-[34px]">{resource.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{resource.description || content?.subtitle || "Teaching resource"}</p>
          </div>
          <span className="w-fit rounded-lg bg-[#eef5f4] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{resource.resource_type}</span>
        </div>
      </section>

      {isStructuredStarter ? (
        <>
          <StarterResourceViewer title={resource.title} resourceType={resource.resource_type} content={content} />
          <div className="mt-5 rounded-[14px] border border-[#eadfbf] bg-[#fffdf8] px-4 py-3 text-xs leading-5 text-[#6e5a2a]">
            Teaching material for supervised medical education. Clinical management should follow the patient&apos;s condition, senior clinical judgement and current BMCH/local protocols.
          </div>
        </>
      ) : (
        <section className="rounded-[20px] border border-[var(--line)] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Teaching file</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{version?.original_filename || "No file attached"}{fileSize ? ` · ${fileSize}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {version ? <Link href={`/resources/${resource.id}/view`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Open teaching viewer</Link> : null}
              {signedUrl ? <a href={signedUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold">Open original</a> : null}
            </div>
          </div>
          {version?.processing_error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Processing error: {version.processing_error}</div> : null}
          <div className="mt-6 rounded-2xl border border-[#d9e4e6] bg-[#f8fafb] p-5 text-sm leading-6 text-[var(--muted)]">PDFs open in the teaching viewer. Images support zoom/fullscreen. PowerPoint and Word use generated page previews once document processing is available.</div>
        </section>
      )}

      {canEdit ? <div className="mt-5 text-xs text-[var(--muted)]">Editor actions such as rename, replace version and delete will remain attached to this resource record.</div> : null}
    </main>
  );
}
