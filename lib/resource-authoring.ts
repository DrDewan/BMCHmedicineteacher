import { z } from "zod";

export const resourceVisibilitySchema = z.enum(["private", "registrars", "department", "students"]);
export const resourceStatusSchema = z.enum(["draft", "approved", "archived"]);

export const editableResourceMetadataSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  categoryId: z.string().uuid(),
  topic: z.string().trim().max(120),
  subtopic: z.string().trim().max(120),
  tags: z.array(z.string().max(60)).max(30),
  audience: z.string().trim().max(120),
  difficulty: z.string().trim().max(80),
  visibility: resourceVisibilitySchema,
});

export type EditableResourceMetadata = z.infer<typeof editableResourceMetadataSchema>;
export type ResourceVisibility = z.infer<typeof resourceVisibilitySchema>;
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;

export type ResourceEditorMetadata = EditableResourceMetadata & {
  status: ResourceStatus;
};

export type ResourceCategoryOption = {
  id: string;
  slug: string;
  name: string;
};

type ResourceMetadataSource = {
  title: string;
  description: string | null;
  category_id: string | null;
  visibility: string;
  status: string;
  structured_content: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function tagsValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, 30);
}

export function coerceResourceEditorMetadata(resource: ResourceMetadataSource): ResourceEditorMetadata {
  const content = asRecord(resource.structured_content);
  const visibility = resourceVisibilitySchema.safeParse(resource.visibility);
  const status = resourceStatusSchema.safeParse(resource.status);

  return {
    title: resource.title,
    description: resource.description ?? "",
    categoryId: resource.category_id ?? "",
    topic: stringValue(content.topic ?? content.system),
    subtopic: stringValue(content.subtopic),
    tags: tagsValue(content.tags),
    audience: stringValue(content.audience),
    difficulty: stringValue(content.difficulty),
    visibility: visibility.success ? visibility.data : "registrars",
    status: status.success ? status.data : "draft",
  };
}

export function editableMetadataFromEditor(metadata: ResourceEditorMetadata): EditableResourceMetadata {
  return {
    title: metadata.title,
    description: metadata.description,
    categoryId: metadata.categoryId,
    topic: metadata.topic,
    subtopic: metadata.subtopic,
    tags: metadata.tags,
    audience: metadata.audience,
    difficulty: metadata.difficulty,
    visibility: metadata.visibility,
  };
}

export function mergeEditableMetadata(contentValue: unknown, metadata: EditableResourceMetadata) {
  const content = asRecord(contentValue);
  const schemaVersion = typeof content.schema_version === "number" ? content.schema_version : 1;
  const next: Record<string, unknown> = { ...content, schema_version: schemaVersion };

  const setOrDelete = (key: string, value: string) => {
    if (value.trim()) next[key] = value.trim();
    else delete next[key];
  };

  setOrDelete("topic", metadata.topic);
  setOrDelete("system", metadata.topic);
  setOrDelete("subtopic", metadata.subtopic);
  setOrDelete("audience", metadata.audience);
  setOrDelete("difficulty", metadata.difficulty);
  next.tags = [...new Set(metadata.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 30);

  return next;
}

export function duplicateStructuredContent(contentValue: unknown) {
  const content = asRecord(contentValue);
  delete content.starter_key;
  delete content.prototype_source;
  content.schema_version = typeof content.schema_version === "number" ? content.schema_version : 1;
  return content;
}
