"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth";
import { newClinicalCaseContent } from "@/lib/clinical-case";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500),
  system: z.string().trim().max(120),
});

export async function createClinicalCase(formData: FormData) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") redirect("/");

  const parsed = createSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    system: String(formData.get("system") ?? ""),
  });
  if (!parsed.success) redirect("/create/clinical-case?error=invalid");

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("resource_categories")
    .select("id")
    .eq("slug", "clinical-cases")
    .single();

  if (!category) throw new Error("Clinical Cases category is missing");

  const content = newClinicalCaseContent(parsed.data.description);
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
      resource_type: "case",
      owner_id: profile.id,
      visibility: "registrars",
      status: "draft",
      structured_content: content,
    })
    .select("id")
    .single();

  if (error || !resource) throw new Error("Could not create clinical case");
  redirect(`/resources/${resource.id}/edit`);
}
