import Link from "next/link";
import { notFound } from "next/navigation";
import { ClinicalCaseViewer } from "@/components/clinical-case-viewer";
import { DocumentProcessingControls } from "@/components/document-processing-controls";
import { InvestigationViewer } from "@/components/investigation-viewer";
import { StarterResourceViewer, type StarterStructuredContent } from "@/components/prototype-content";
import { ResourceActions } from "@/components/resource-actions";
import { requireActiveProfile } from "@/lib/auth";
import { clinicalCaseContentSchema } from "@/lib/clinical-case";
import { investigationContentSchema } from "@/lib/investigation";
import { resourceStatusSchema } from "@/lib/resource-authoring";
import { createClient } from "@/lib/supabase/server";

const OFFICE_MIME_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
  const nativeCase = resource.resource_type === "case" ? clinicalCaseContentSchema.safeParse(resource.structured_content) : null;
  const nativeInvestigation = resource.resource_type === "investigation" ? investigationContentSchema.safeParse(resource.structured_content) : null;
  const isStructuredContent = Boolean(
    content?.starter_key ||
    content?.native_kind ||
    content?.body_html ||
    content?.slides?.length ||
    content?.slides_html?.length ||
    content?.image_url,
  );
  const canEdit = profile.role === "admin" || profile.role === "editor";
  const canManageNative = canEdit && !version;
  const isOfficeDocument = Boolean(version?.mime_type && OFFICE_MIME_TYPES.has(version.mime_type));
  const parsedStatus = resourceStatusSchema.safeParse(resource.status);
  const lifecycleStatus = parsedStatus.success ? parsedStatus.data : "draft";

  let signedUrl: string | null = null;
  if (version?.storage_path) {
    const { data } = await supabase.storage.from("bmch-resources").createSignedUrl(version.storage_path, 10 * 60);
    signedUrl = data?.signedUrl ?? null;
  }

  const fileSize = version?.file_size ? (version.file_size >= 1024 * 1024 ? `${(version.file_size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(version.file_size / 1024)} KB`) : null;

  const safetyNote = (
    <div className="mt-5 rounded-[14px] border border-[#eadfbf] bg-[#fffdf8] px-4 py-3 text-xs leading-5 text-[#6e5a2a]">
      Teaching material for supervised medical education. Clinical management should follow the patient&apos;s condition, senior clinical judgement and current BMCH/local protocols.
    </div>
  );

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
          <div className="flex flex-wrap items-center gap-2">
            {canManageNative ? <Link href={`/resources/${resource.id}/edit`} className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold">Edit</Link> : null}
            <span className="w-fit rounded-lg bg-[#eef5f4] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{resource.resource_type}</span>
          </div>
        </div>
      </section>

      {nativeCase?.success ? (
        <>
          <ClinicalCaseViewer title={resource.title} content={nativeCase.data} />
          {safetyNote}
        </>
      ) : nativeInvestigation?.success ? (
        <>
          <InvestigationViewer title={resource.title} content={nativeInvestigation.data} />
          {safetyNote}
        </>
      ) : isStructuredContent ? (
        <>
          <StarterResourceViewer title={resource.title} resourceType={resource.resource_type} content={content} />
          {safetyNote}
        </>
      ) : (
        <section className="rounded-[20px] border border-[var(--line)] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Teaching file</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{version?.original_filename || "No file attached"}{fileSize ? ` · ${fileSize}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {version && !isOfficeDocument ? <Link href={`/resources/${resource.id}/view`} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Open teaching viewer</Link> : null}
              {signedUrl ? <a href={signedUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold">Open original</a> : null}
            </div>
          </div>

          {version && isOfficeDocument ? (
            <div className="mt-5 border-t border-[var(--line)] pt-5">
              <DocumentProcessingControls resourceId={resource.id} processingStatus={version.processing_status} processingError={version.processing_error} canEdit={canEdit} />
            </div>
          ) : null}

          {version?.processing_error && !isOfficeDocument ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Processing error: {version.processing_error}</div> : null}
          <div className="mt-6 rounded-2xl border border-[#d9e4e6] bg-[#f8fafb] p-5 text-sm leading-6 text-[var(--muted)]">
            {isOfficeDocument
              ? "PowerPoint and Word files are converted into a private PDF plus individual teaching-slide images and thumbnails. The original Office file is always preserved."
              : "PDFs open in the teaching viewer. Images support zoom and fullscreen."}
          </div>
        </section>
      )}

      {canManageNative ? (
        <div className="mt-5">
          <ResourceActions resourceId={resource.id} initialStatus={lifecycleStatus} initialUpdatedAt={resource.updated_at} isAdmin={profile.role === "admin"} />
        </div>
      ) : null}

      {canEdit && version ? <div className="mt-5 text-xs text-[var(--muted)]">Uploaded-file metadata/version lifecycle remains scheduled for the dedicated uploaded-resource management increment.</div> : null}
    </main>
  );
}
