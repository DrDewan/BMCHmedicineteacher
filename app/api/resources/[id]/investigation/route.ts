import { NextResponse } from "next/server";
import { z } from "zod";
import { investigationContentSchema } from "@/lib/investigation";
import { editableResourceMetadataSchema, mergeEditableMetadata } from "@/lib/resource-authoring";
import { AuthoringHttpError, requireAuthoringContext } from "@/lib/resource-authoring-server";

const bodySchema = z.object({
  metadata: editableResourceMetadataSchema,
  content: investigationContentSchema,
  expectedUpdatedAt: z.string().min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid investigation", details: parsed.error.flatten() }, { status: 400 });

    const { supabase } = await requireAuthoringContext();
    const { id } = await params;
    const { data: current } = await supabase
      .from("resources")
      .select("id, resource_type, updated_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.resource_type !== "investigation") return NextResponse.json({ error: "Not an investigation" }, { status: 400 });
    if (current.updated_at !== parsed.data.expectedUpdatedAt) {
      return NextResponse.json({ error: "Resource changed elsewhere", updatedAt: current.updated_at }, { status: 409 });
    }

    const metadata = parsed.data.metadata;
    const structuredContent = mergeEditableMetadata(parsed.data.content, metadata);
    const { data: updated, error } = await supabase
      .from("resources")
      .update({
        title: metadata.title,
        description: metadata.description || null,
        category_id: metadata.categoryId,
        visibility: metadata.visibility,
        structured_content: structuredContent,
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
