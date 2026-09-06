import { z } from "zod";

export const procedureStepSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().max(240),
  instruction: z.string().max(12000),
  image_url: z.string().max(2000).nullable().optional(),
  safety_warning: z.string().max(5000),
  teaching_pearl: z.string().max(5000),
});

export const procedureReferenceSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().max(300),
  url: z.string().max(2000),
});

export const procedureContentSchema = z.object({
  schema_version: z.literal(1),
  native_kind: z.literal("procedure"),
  subtitle: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  overview: z.string().max(10000),
  indications: z.array(z.string().max(2000)).max(60),
  contraindications: z.array(z.string().max(2000)).max(60),
  equipment: z.array(z.string().max(2000)).max(80),
  preparation: z.array(z.string().max(2500)).max(80),
  steps: z.array(procedureStepSchema).max(60),
  complications: z.array(z.string().max(2500)).max(80),
  aftercare: z.array(z.string().max(2500)).max(80),
  common_errors: z.array(z.string().max(2500)).max(80),
  viva_questions: z.array(z.string().max(2500)).max(60),
  references: z.array(procedureReferenceSchema).max(40),
  overview_image_url: z.string().max(2000).nullable().optional(),
  legacy_html: z.string().max(120000).optional(),
}).passthrough();

export type ProcedureStep = z.infer<typeof procedureStepSchema>;
export type ProcedureReference = z.infer<typeof procedureReferenceSchema>;
export type ProcedureContent = z.infer<typeof procedureContentSchema>;

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function createProcedureStep(title = "New step"): ProcedureStep {
  return {
    id: makeId("step"),
    title,
    instruction: "",
    image_url: null,
    safety_warning: "",
    teaching_pearl: "",
  };
}

export function cloneProcedureStep(step: ProcedureStep): ProcedureStep {
  return { ...step, id: makeId("step") };
}

export function newProcedureContent(subtitle = ""): ProcedureContent {
  return {
    schema_version: 1,
    native_kind: "procedure",
    subtitle,
    tags: [],
    overview: "",
    indications: [""],
    contraindications: [""],
    equipment: [""],
    preparation: [""],
    steps: [createProcedureStep("Step 1")],
    complications: [""],
    aftercare: [""],
    common_errors: [""],
    viva_questions: [""],
    references: [],
    overview_image_url: null,
  };
}

export function coerceProcedure(value: unknown): ProcedureContent {
  const parsed = procedureContentSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  const source = asRecord(value);
  const next = newProcedureContent(typeof source.subtitle === "string" ? source.subtitle : "");
  const tags = Array.isArray(source.tags) ? source.tags.filter((item): item is string => typeof item === "string").slice(0, 30) : [];

  return {
    ...source,
    ...next,
    tags,
    overview_image_url: typeof source.image_url === "string" ? source.image_url : null,
    legacy_html: typeof source.body_html === "string" ? source.body_html : undefined,
    body_html: undefined,
    image_url: undefined,
  } as ProcedureContent;
}

export function newProcedureReference(): ProcedureReference {
  return { id: makeId("reference"), label: "", url: "" };
}
