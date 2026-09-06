import { z } from "zod";

export const investigationColumnSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().max(120),
});

export const investigationRowSchema = z.object({
  id: z.string().min(1).max(120),
  cells: z.record(z.string(), z.string().max(1000)),
  abnormal_cells: z.array(z.string().max(120)).max(20),
});

export const investigationTableSchema = z.object({
  columns: z.array(investigationColumnSchema).min(1).max(12),
  rows: z.array(investigationRowSchema).max(80),
});

export const investigationContentSchema = z.object({
  schema_version: z.literal(1),
  native_kind: z.literal("investigation"),
  subtitle: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  clinical_context: z.string().max(8000),
  student_prompt: z.string().max(4000),
  table: investigationTableSchema,
  interpretation: z.string().max(12000),
  differential: z.string().max(8000),
  next_step: z.string().max(8000),
  management_implication: z.string().max(8000),
  teaching_point: z.string().max(8000),
  warning: z.string().max(8000),
  image_url: z.string().max(2000).nullable().optional(),
  legacy_html: z.string().max(120000).optional(),
}).passthrough();

export type InvestigationColumn = z.infer<typeof investigationColumnSchema>;
export type InvestigationRow = z.infer<typeof investigationRowSchema>;
export type InvestigationContent = z.infer<typeof investigationContentSchema>;

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function newInvestigationTable() {
  const columns: InvestigationColumn[] = ["Test", "Result", "Unit", "Reference range"].map((label) => ({ id: makeId("col"), label }));
  const row: InvestigationRow = {
    id: makeId("row"),
    cells: Object.fromEntries(columns.map((column) => [column.id, ""])),
    abnormal_cells: [],
  };
  return { columns, rows: [row] };
}

export function newInvestigationContent(subtitle = ""): InvestigationContent {
  return {
    schema_version: 1,
    native_kind: "investigation",
    subtitle,
    tags: [],
    clinical_context: "",
    student_prompt: "Interpret the results and explain the most likely clinical significance.",
    table: newInvestigationTable(),
    interpretation: "",
    differential: "",
    next_step: "",
    management_implication: "",
    teaching_point: "",
    warning: "",
    image_url: null,
  };
}

export function coerceInvestigation(value: unknown): InvestigationContent {
  const parsed = investigationContentSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  const source = asRecord(value);
  const next = newInvestigationContent(typeof source.subtitle === "string" ? source.subtitle : "");
  const tags = Array.isArray(source.tags) ? source.tags.filter((item): item is string => typeof item === "string").slice(0, 30) : [];
  return {
    ...source,
    ...next,
    tags,
    image_url: typeof source.image_url === "string" ? source.image_url : null,
    legacy_html: typeof source.body_html === "string" ? source.body_html : undefined,
    body_html: undefined,
  } as InvestigationContent;
}

export function addInvestigationColumn(content: InvestigationContent, label = "New column"): InvestigationContent {
  const column: InvestigationColumn = { id: makeId("col"), label };
  return {
    ...content,
    table: {
      columns: [...content.table.columns, column],
      rows: content.table.rows.map((row) => ({ ...row, cells: { ...row.cells, [column.id]: "" } })),
    },
  };
}

export function addInvestigationRow(content: InvestigationContent): InvestigationContent {
  const row: InvestigationRow = {
    id: makeId("row"),
    cells: Object.fromEntries(content.table.columns.map((column) => [column.id, ""])),
    abnormal_cells: [],
  };
  return { ...content, table: { ...content.table, rows: [...content.table.rows, row] } };
}
