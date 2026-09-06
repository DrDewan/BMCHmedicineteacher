import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const slideSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["title", "objectives", "content", "case", "investigation", "question", "summary", "legacy"]),
  title: z.string(),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  answer: z.string().optional(),
  html: z.string().optional(),
});

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000),
  expectedUpdatedAt: z.string(),
  content: z.object({
    native_kind: z.literal("teaching_material"),
    subtitle: z.string().nullable().optional(),
    tags: z.array(z.string()).max(30).optional(),
    slides: z.array(slideSchema).max(100),
  }).passthrough(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", userId).single();
  if (!profile?.is_active || (profile.role !== "admin" && profile.role !== "editor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid content", details: parsed.error.flatten() }, { status: 400 });

  const { id } = await params;
  const { data: current } = await supabase
    .from("resources")
    .select("id, updated_at, resource_type")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (current.resource_type !== "presentation") return NextResponse.json({ error: "Not a teaching material" }, { status: 400 });
  if (current.updated_at !== parsed.data.expectedUpdatedAt) {
    return NextResponse.json({ error: "Resource changed elsewhere", updatedAt: current.updated_at }, { status: 409 });
  }

  const { data: updated, error } = await supabase
    .from("resources")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      structured_content: parsed.data.content,
    })
    .eq("id", id)
    .eq("updated_at", parsed.data.expectedUpdatedAt)
    .select("updated_at")
    .single();

  if (error || !updated) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ updatedAt: updated.updated_at });
}
