"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth";
import { createSlide } from "@/lib/authoring";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(300),
});

export async function createTeachingMaterial(formData: FormData) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") redirect("/");

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
  });
  if (!parsed.success) redirect("/create/teaching-material?error=title");

  const { title, subtitle } = parsed.data;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("resource_categories")
    .select("id")
    .eq("slug", "teaching-materials")
    .single();

  if (!category) throw new Error("Teaching Materials category is missing");

  const firstSlide = createSlide("title");
  firstSlide.title = title;
  firstSlide.body = subtitle || "Final Year MBBS";

  const { data: resource, error } = await supabase
    .from("resources")
    .insert({
      title,
      description: subtitle || null,
      category_id: category.id,
      resource_type: "presentation",
      owner_id: profile.id,
      visibility: "registrars",
      status: "draft",
      structured_content: {
        schema_version: 1,
        native_kind: "teaching_material",
        subtitle,
        tags: [],
        slides: [firstSlide],
      },
    })
    .select("id")
    .single();

  if (error || !resource) throw new Error("Could not create teaching material");
  redirect(`/resources/${resource.id}/edit`);
}
