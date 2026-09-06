import { NextResponse } from "next/server";
import { z } from "zod";
import { duplicateStructuredContent } from "@/lib/resource-authoring";
import { AuthoringHttpError, recordResourceAudit, requireAuthoringContext } from "@/lib/resource-authoring-server";

const actionSchema = z.object({
  action: z.enum(["publish", "move_to_draft", "archive", "restore", "soft_delete", "permanent_delete", "duplicate"]),
  expectedUpdatedAt: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const { supabase, userId, role } = await requireAuthoringContext();
    const { id } = await params;
    const { data: current } = await supabase
      .from("resources")
      .select("id, title, description, category_id, resource_type, structured_content, visibility, status, current_version_id, updated_at, deleted_at")
      .eq("id", id)
      .single();

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.updated_at !== parsed.data.expectedUpdatedAt) {
      return NextResponse.json({ error: "Resource changed elsewhere", updatedAt: current.updated_at }, { status: 409 });
    }

    const action = parsed.data.action;

    if (action === "duplicate") {
      if (current.current_version_id) return NextResponse.json({ error: "Uploaded-file duplication is deferred to uploaded resource management." }, { status: 409 });
      const { data: duplicate, error } = await supabase
        .from("resources")
        .insert({
          title: `${current.title} — Copy`,
          description: current.description,
          category_id: current.category_id,
          resource_type: current.resource_type,
          owner_id: userId,
          visibility: "private",
          status: "draft",
          structured_content: duplicateStructuredContent(current.structured_content),
        })
        .select("id")
        .single();
      if (error || !duplicate) return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });
      await recordResourceAudit(supabase, "duplicate", duplicate.id, { source_resource_id: id });
      return NextResponse.json({ resourceId: duplicate.id });
    }

    if (action === "permanent_delete") {
      if (role !== "admin") return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
      if (current.current_version_id) return NextResponse.json({ error: "Permanent deletion of uploaded files is deferred until storage cleanup is transactional." }, { status: 409 });
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) return NextResponse.json({ error: "Permanent delete failed" }, { status: 500 });
      await recordResourceAudit(supabase, "permanent_delete", id, { previous_status: current.status });
      return NextResponse.json({ deleted: true });
    }

    const update: Record<string, unknown> = {};
    let auditAction: string = action;
    if (action === "publish") update.status = "approved";
    if (action === "move_to_draft") update.status = "draft";
    if (action === "archive") update.status = "archived";
    if (action === "soft_delete") update.deleted_at = new Date().toISOString();
    if (action === "restore") update.deleted_at = null;

    const { data: updated, error } = await supabase
      .from("resources")
      .update(update)
      .eq("id", id)
      .eq("updated_at", parsed.data.expectedUpdatedAt)
      .select("updated_at, status, deleted_at")
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Action failed" }, { status: 500 });
    if (!updated) return NextResponse.json({ error: "Resource changed elsewhere" }, { status: 409 });

    if (action === "soft_delete") auditAction = "delete";
    await recordResourceAudit(supabase, auditAction, id, { previous_status: current.status, new_status: updated.status });

    return NextResponse.json({
      updatedAt: updated.updated_at,
      status: updated.status,
      deletedAt: updated.deleted_at,
    });
  } catch (error) {
    if (error instanceof AuthoringHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
