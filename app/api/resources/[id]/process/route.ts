import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OFFICE_MIME_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: resourceId } = await params;
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active || !["admin", "editor"].includes(profile.role)) {
    return NextResponse.json({ error: "Editor access required." }, { status: 403 });
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("id, current_version_id")
    .eq("id", resourceId)
    .is("deleted_at", null)
    .single();

  if (!resource?.current_version_id) {
    return NextResponse.json({ error: "Resource has no file version to process." }, { status: 400 });
  }

  const { data: version } = await supabase
    .from("resource_versions")
    .select("id, mime_type, processing_status")
    .eq("id", resource.current_version_id)
    .single();

  if (!version?.mime_type || !OFFICE_MIME_TYPES.has(version.mime_type)) {
    return NextResponse.json(
      { error: "Only uploaded PowerPoint and Word files require this processing route." },
      { status: 400 },
    );
  }

  if (version.processing_status === "ready") {
    return NextResponse.json({ status: "ready", versionId: version.id });
  }

  const workerUrl = process.env.DOCUMENT_WORKER_URL?.replace(/\/$/, "");
  const workerSecret = process.env.DOCUMENT_WORKER_SECRET;
  if (!workerUrl || !workerSecret) {
    return NextResponse.json(
      {
        error:
          "Document worker is not configured. The original file is safe, but preview generation cannot start yet.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${workerUrl}/process`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${workerSecret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ resourceId, versionId: version.id }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: body?.error || "Document worker rejected the processing request." },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: body?.status || "accepted", versionId: version.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Document worker could not be reached: ${error.message}`
            : "Document worker could not be reached.",
      },
      { status: 502 },
    );
  }
}
