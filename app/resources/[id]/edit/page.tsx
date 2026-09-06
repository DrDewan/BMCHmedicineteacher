import { notFound } from "next/navigation";
import { ClinicalCaseEditor } from "@/components/clinical-case-editor";
import { InvestigationEditor } from "@/components/investigation-editor";
import { ProcedureEditor } from "@/components/procedure-editor";
import { ResourceMetadataOnlyEditor } from "@/components/resource-metadata-only-editor";
import { TeachingMaterialEditor } from "@/components/teaching-material-editor";
import { requireActiveProfile } from "@/lib/auth";
import { coerceResourceEditorMetadata, type ResourceCategoryOption } from "@/lib/resource-authoring";
import { createClient } from "@/lib/supabase/server";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireActiveProfile();
  if (profile.role !== "admin" && profile.role !== "editor") notFound();

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: resource, error }, { data: dbCategories }] = await Promise.all([
    supabase
      .from("resources")
      .select("id, title, description, category_id, resource_type, structured_content, visibility, status, current_version_id, updated_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase.from("resource_categories").select("id, slug, name").eq("is_active", true).order("sort_order"),
  ]);

  if (error || !resource) notFound();
  const categories = (dbCategories ?? []) as ResourceCategoryOption[];
  if (!categories.length) notFound();
  const initialMetadata = coerceResourceEditorMetadata(resource);

  if (resource.resource_type === "presentation") {
    return (
      <TeachingMaterialEditor
        resourceId={resource.id}
        initialMetadata={initialMetadata}
        initialUpdatedAt={resource.updated_at}
        initialContent={resource.structured_content}
        categories={categories}
        role={profile.role}
      />
    );
  }

  if (resource.resource_type === "case") {
    return (
      <ClinicalCaseEditor
        resourceId={resource.id}
        initialMetadata={initialMetadata}
        initialUpdatedAt={resource.updated_at}
        initialContent={resource.structured_content}
        categories={categories}
        role={profile.role}
      />
    );
  }

  if (resource.resource_type === "investigation") {
    return (
      <InvestigationEditor
        resourceId={resource.id}
        initialMetadata={initialMetadata}
        initialUpdatedAt={resource.updated_at}
        initialContent={resource.structured_content}
        categories={categories}
        role={profile.role}
      />
    );
  }

  if (resource.resource_type === "procedure") {
    return (
      <ProcedureEditor
        resourceId={resource.id}
        initialMetadata={initialMetadata}
        initialUpdatedAt={resource.updated_at}
        initialContent={resource.structured_content}
        categories={categories}
        role={profile.role}
      />
    );
  }

  if (resource.current_version_id) notFound();

  return (
    <ResourceMetadataOnlyEditor
      resourceId={resource.id}
      resourceType={resource.resource_type}
      initialMetadata={initialMetadata}
      initialUpdatedAt={resource.updated_at}
      categories={categories}
      role={profile.role}
    />
  );
}
