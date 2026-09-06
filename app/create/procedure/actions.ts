"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth";
import { newProcedureContent } from "@/lib/procedure";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500),
  system: z.string().trim().max(120),
});

export async function createProcedure(formData: FormData) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") redirect("/");

  const parsed = createSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    system: String(formData.get("system") ?? ""),
  });
  if (!parsed.success) redirect("/create/procedure?error=invalid");

  const supabase = await createClient();
  const { data: category } = await supabase.from("resource_categories").select("id").eq("slug", "procedures").single();
  if (!category) throw new Error("Procedures category is missing");

  const content = newProcedureContent(parsed.data.description);
  if (parsed.data.system) {
    content.topic = parsed.data.system;
    content.system = parsed.data.system;
  }
  content.audience = "Final Year MBBS";

  const { data: resource, error } = await supabase
    .from("resources")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      category_id: category.id,
      resource_type: "procedure",
      owner_id: profile.id,
      visibility: "registrars",
      status: "draft",
      structured_content: content,
    })
    .select("id")
    .single();

  if (error || !resource) throw new Error("Could not create procedure");
  redirect(`/resources/${resource.id}/edit`);
}
