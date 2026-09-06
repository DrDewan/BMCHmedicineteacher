import Link from "next/link";
import { notFound } from "next/navigation";
import { TeachingViewer } from "@/components/teaching-viewer";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Teaching Viewer" };

export default async function ResourceViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActiveProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("resources")
    .select("id, title, resource_type, current_version_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!resource?.current_version_id) {
    notFound();
  }

  const { data: version } = await supabase
    .from("resource_versions")
    .select("id, mime_type, storage_path, preview_path, processing_status")
    .eq("id", resource.current_version_id)
    .single();

  if (!version) {
    notFound();
  }

  const { data: pageRows } = await supabase
    .from("resource_pages")
    .select("page_number, image_path, thumbnail_path")
    .eq("resource_version_id", version.id)
    .order("page_number", { ascending: true });

  const originalResult = version.storage_path
    ? await supabase.storage.from("bmch-resources").createSignedUrl(version.storage_path, 10 * 60)
    : null;
  const originalUrl = originalResult?.data?.signedUrl ?? null;

  const previewPages = (
    await Promise.all(
      (pageRows ?? []).map(async (page) => {
        const imagePath = page.image_path || page.thumbnail_path;
        const thumbnailPath = page.thumbnail_path || page.image_path;
        if (!imagePath) return null;

        const [{ data: imageData }, { data: thumbData }] = await Promise.all([
          supabase.storage.from("bmch-resources").createSignedUrl(imagePath, 10 * 60),
          thumbnailPath
            ? supabase.storage.from("bmch-resources").createSignedUrl(thumbnailPath, 10 * 60)
            : Promise.resolve({ data: null }),
        ]);

        if (!imageData?.signedUrl) return null;
        return {
          pageNumber: page.page_number,
          imageUrl: imageData.signedUrl,
          thumbnailUrl: thumbData?.signedUrl ?? null,
        };
      }),
    )
  ).filter(
    (page): page is { pageNumber: number; imageUrl: string; thumbnailUrl: string | null } =>
      Boolean(page),
  );

  let kind: "pdf" | "image" | "slides" | "pending" = "pending";
  let fileUrl: string | null = null;

  if (version.mime_type === "application/pdf" && originalUrl) {
    kind = "pdf";
    fileUrl = originalUrl;
  } else if (version.mime_type?.startsWith("image/") && originalUrl) {
    kind = "image";
    fileUrl = originalUrl;
  } else if (previewPages.length > 0) {
    kind = "slides";
  }

  return (
    <main className="pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href={`/resources/${resource.id}`} className="text-sm font-semibold text-[var(--accent)]">
          ← Resource details
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          {resource.resource_type}
        </span>
      </div>

      <TeachingViewer
        title={resource.title}
        kind={kind}
        fileUrl={fileUrl}
        pages={previewPages}
        originalUrl={originalUrl}
        processingStatus={version.processing_status}
      />
    </main>
  );
}
