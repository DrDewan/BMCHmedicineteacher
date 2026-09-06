import { notFound } from "next/navigation";
import { TeachingMaterialEditor } from "@/components/teaching-material-editor";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") notFound();

  const { id } = await params;
  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, title, description, resource_type, structured_content, updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !resource || resource.resource_type !== "presentation") notFound();

  return (
    <TeachingMaterialEditor
      resourceId={resource.id}
      initialTitle={resource.title}
      initialDescription={resource.description}
      initialUpdatedAt={resource.updated_at}
      initialContent={resource.structured_content}
    />
  );
}
