import { z } from "zod";

export const clinicalCaseStageTypeSchema = z.enum([
  "presentation",
  "pause",
  "history",
  "examination",
  "investigations",
  "differential",
  "diagnosis",
  "management",
  "escalation",
  "pearls",
  "references",
  "legacy",
]);

export const clinicalCaseStageStyleSchema = z.enum(["normal", "key", "warning", "danger"]);

export const clinicalCaseVitalSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().max(80),
  value: z.string().max(120),
});

export const clinicalCaseReferenceSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().max(240),
  url: z.string().max(1200),
});

export const clinicalCaseStageSchema = z.object({
  id: z.string().min(1).max(120),
  type: clinicalCaseStageTypeSchema,
  title: z.string().max(240),
  style: clinicalCaseStageStyleSchema,
  hidden: z.boolean(),
  text: z.string().max(16000).optional(),
  items: z.array(z.string().max(1200)).max(80).optional(),
  vitals: z.array(clinicalCaseVitalSchema).max(16).optional(),
  references: z.array(clinicalCaseReferenceSchema).max(30).optional(),
  html: z.string().max(120000).optional(),
});

export const clinicalCaseContentSchema = z.object({
  schema_version: z.literal(1),
  native_kind: z.literal("clinical_case"),
  subtitle: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  stages: z.array(clinicalCaseStageSchema).max(40),
}).passthrough();

export type ClinicalCaseStageType = z.infer<typeof clinicalCaseStageTypeSchema>;
export type ClinicalCaseStageStyle = z.infer<typeof clinicalCaseStageStyleSchema>;
export type ClinicalCaseVital = z.infer<typeof clinicalCaseVitalSchema>;
export type ClinicalCaseReference = z.infer<typeof clinicalCaseReferenceSchema>;
export type ClinicalCaseStage = z.infer<typeof clinicalCaseStageSchema>;
export type ClinicalCaseContent = z.infer<typeof clinicalCaseContentSchema>;

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const titles: Record<ClinicalCaseStageType, string> = {
  presentation: "Stage 1 — Presentation",
  pause: "Pause and ask",
  history: "Focused history",
  examination: "Examination",
  investigations: "Investigations",
  differential: "Differential diagnosis",
  diagnosis: "Diagnosis",
  management: "Management",
  escalation: "Escalation / red flags",
  pearls: "Exam traps / teaching pearls",
  references: "References",
  legacy: "Imported case content",
};

const styles: Record<ClinicalCaseStageType, ClinicalCaseStageStyle> = {
  presentation: "normal",
  pause: "key",
  history: "normal",
  examination: "normal",
  investigations: "normal",
  differential: "normal",
  diagnosis: "key",
  management: "normal",
  escalation: "danger",
  pearls: "warning",
  references: "normal",
  legacy: "normal",
};

export function createClinicalCaseStage(type: ClinicalCaseStageType): ClinicalCaseStage {
  const base: ClinicalCaseStage = {
    id: makeId("stage"),
    type,
    title: titles[type],
    style: styles[type],
    hidden: false,
  };

  if (type === "presentation") {
    base.text = "";
    base.vitals = ["Pulse", "BP", "RR", "SpO₂"].map((label) => ({ id: makeId("vital"), label, value: "" }));
  } else if (["pause", "history", "examination", "differential", "management", "pearls"].includes(type)) {
    base.items = [""];
  } else if (type === "references") {
    base.references = [{ id: makeId("reference"), label: "", url: "" }];
  } else if (type === "legacy") {
    base.html = "";
  } else {
    base.text = "";
  }

  return base;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function coerceClinicalCase(value: unknown): ClinicalCaseContent {
  const parsed = clinicalCaseContentSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  const source = asRecord(value);
  const legacyHtml = typeof source.body_html === "string" ? source.body_html : "";
  const subtitle = typeof source.subtitle === "string" ? source.subtitle : null;
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((item): item is string => typeof item === "string").slice(0, 30)
    : [];

  const importedStage = createClinicalCaseStage("legacy");
  importedStage.html = legacyHtml;

  return {
    ...source,
    schema_version: 1,
    native_kind: "clinical_case",
    subtitle,
    tags,
    stages: legacyHtml ? [importedStage] : [createClinicalCaseStage("presentation"), createClinicalCaseStage("pause")],
    body_html: undefined,
  } as ClinicalCaseContent;
}

export function cloneClinicalCaseStage(stage: ClinicalCaseStage): ClinicalCaseStage {
  return {
    ...stage,
    id: makeId("stage"),
    items: stage.items ? [...stage.items] : undefined,
    vitals: stage.vitals?.map((vital) => ({ ...vital, id: makeId("vital") })),
    references: stage.references?.map((reference) => ({ ...reference, id: makeId("reference") })),
  };
}

export function newClinicalCaseContent(subtitle = ""): ClinicalCaseContent {
  return {
    schema_version: 1,
    native_kind: "clinical_case",
    subtitle,
    tags: [],
    stages: [createClinicalCaseStage("presentation"), createClinicalCaseStage("pause")],
  };
}
