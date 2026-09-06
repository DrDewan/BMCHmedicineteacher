import { NextResponse } from "next/server";
import { z } from "zod";
import { editableResourceMetadataSchema, mergeEditableMetadata } from "@/lib/resource-authoring";
import { AuthoringHttpError, requireAuthoringContext } from "@/lib/resource-authoring-server";

const bodySchema = z.object({
  metadata: editableResourceMetadataSchema,
  expectedUpdatedAt: z.string().min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid metadata", details: parsed.error.flatten() }, { status: 400 });

    const { supabase } = await requireAuthoringContext();
    const { id } = await params;
    const [{ data: current }, { data: category }] = await Promise.all([
      supabase.from("resources").select("id, updated_at, structured_content").eq("id", id).single(),
      supabase.from("resource_categories").select("id").eq("id", parsed.data.metadata.categoryId).eq("is_active", true).single(),
    ]);

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (current.updated_at !== parsed.data.expectedUpdatedAt) {
      return NextResponse.json({ error: "Resource changed elsewhere", updatedAt: current.updated_at }, { status: 409 });
    }

    const { data: updated, error } = await supabase
      .from("resources")
      .update({
        title: parsed.data.metadata.title,
        description: parsed.data.metadata.description || null,
        category_id: parsed.data.metadata.categoryId,
        visibility: parsed.data.metadata.visibility,
        structured_content: mergeEditableMetadata(current.structured_content, parsed.data.metadata),
      })
      .eq("id", id)
      .eq("updated_at", parsed.data.expectedUpdatedAt)
      .select("updated_at")
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Save failed" }, { status: 500 });
    if (!updated) return NextResponse.json({ error: "Resource changed elsewhere" }, { status: 409 });
    return NextResponse.json({ updatedAt: updated.updated_at });
  } catch (error) {
    if (error instanceof AuthoringHttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
