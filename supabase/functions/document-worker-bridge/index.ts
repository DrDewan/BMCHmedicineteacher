import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "bmch-resources";

function adminClient() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const secretKey = secretKeys
    ? JSON.parse(secretKeys).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secretKey) throw new Error("Supabase secret key is unavailable in Edge Function runtime.");
  return createClient(Deno.env.get("SUPABASE_URL")!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authorize(req: Request, supabase: ReturnType<typeof adminClient>) {
  const secret = req.headers.get("x-worker-secret") || "";
  if (!secret) return false;
  const hash = await sha256(secret);
  const { data } = await supabase
    .from("document_worker_credentials")
    .select("id")
    .eq("secret_hash", hash)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

async function verifyVersion(supabase: ReturnType<typeof adminClient>, resourceId: string, versionId: string) {
  const { data } = await supabase
    .from("resource_versions")
    .select("id, resource_id, preview_path")
    .eq("id", versionId)
    .eq("resource_id", resourceId)
    .maybeSingle();
  if (!data) throw new Error("Resource version not found.");
  return data;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const supabase = adminClient();
  if (!(await authorize(req, supabase))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const resourceId = String(body?.resourceId || "");
    const versionId = String(body?.versionId || "");
    if (!resourceId || !versionId) throw new Error("resourceId and versionId are required.");

    const version = await verifyVersion(supabase, resourceId, versionId);

    if (action === "prepare") {
      const files = Array.isArray(body?.files) ? body.files : [];
      if (!files.length) throw new Error("No preview files requested.");

      const { data: oldPages } = await supabase
        .from("resource_pages")
        .select("image_path, thumbnail_path")
        .eq("resource_version_id", versionId);

      const oldPaths = new Set<string>();
      if (version.preview_path) oldPaths.add(version.preview_path);
      for (const page of oldPages || []) {
        if (page.image_path) oldPaths.add(page.image_path);
        if (page.thumbnail_path) oldPaths.add(page.thumbnail_path);
      }
      if (oldPaths.size) await supabase.storage.from(BUCKET).remove([...oldPaths]);
      await supabase.from("resource_pages").delete().eq("resource_version_id", versionId);
      await supabase
        .from("resource_versions")
        .update({ processing_status: "processing", processing_error: null, preview_path: null })
        .eq("id", versionId);

      const uploads = [];
      for (const file of files) {
        const path = String(file?.path || "");
        if (!path.startsWith(`resources/${resourceId}/${versionId}/preview/`)) {
          throw new Error("Invalid preview path.");
        }
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
        if (error || !data?.token) throw new Error(`Could not sign upload for ${path}: ${error?.message || "unknown error"}`);
        uploads.push({ path, token: data.token });
      }

      return Response.json({ status: "prepared", uploads });
    }

    if (action === "complete") {
      const previewPath = String(body?.previewPath || "");
      const pages = Array.isArray(body?.pages) ? body.pages : [];
      if (!previewPath || !pages.length) throw new Error("Preview path and page rows are required.");

      const rows = pages.map((page: Record<string, unknown>) => ({
        resource_version_id: versionId,
        page_number: Number(page.page_number),
        text_content: typeof page.text_content === "string" ? page.text_content : null,
        image_path: String(page.image_path || ""),
        thumbnail_path: String(page.thumbnail_path || ""),
        metadata: typeof page.metadata === "object" && page.metadata ? page.metadata : {},
      }));

      const { error: pageError } = await supabase.from("resource_pages").insert(rows);
      if (pageError) throw pageError;

      const { error: versionError } = await supabase
        .from("resource_versions")
        .update({ preview_path: previewPath, processing_status: "ready", processing_error: null })
        .eq("id", versionId);
      if (versionError) throw versionError;

      return Response.json({ status: "ready", pages: rows.length });
    }

    if (action === "fail") {
      const message = String(body?.message || "Document processing failed").slice(0, 2000);
      await supabase
        .from("resource_versions")
        .update({ processing_status: "failed", processing_error: message })
        .eq("id", versionId);
      return Response.json({ status: "failed" });
    }

    throw new Error("Unknown action.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bridge request failed";
    console.error(message);
    return Response.json({ error: message }, { status: 400 });
  }
});
