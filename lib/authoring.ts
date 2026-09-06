export type NativeSlideType =
  | "title"
  | "objectives"
  | "content"
  | "case"
  | "investigation"
  | "question"
  | "summary"
  | "legacy";

export type NativeSlide = {
  id: string;
  type: NativeSlideType;
  title: string;
  body?: string;
  bullets?: string[];
  answer?: string;
  html?: string;
};

export type TeachingMaterialContent = {
  schema_version?: 1;
  native_kind?: "teaching_material";
  subtitle?: string | null;
  tags?: string[];
  topic?: string;
  subtopic?: string;
  audience?: string;
  difficulty?: string;
  slides?: NativeSlide[];
  slides_html?: string[];
  starter_key?: string;
  prototype_source?: string;
};

export function createSlide(type: NativeSlideType): NativeSlide {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const titles: Record<NativeSlideType, string> = {
    title: "New teaching session",
    objectives: "Learning objectives",
    content: "Teaching point",
    case: "Clinical case",
    investigation: "Investigation",
    question: "Question",
    summary: "Summary",
    legacy: "Imported slide",
  };

  return {
    id,
    type,
    title: titles[type],
    body: type === "title" ? "Final Year MBBS" : "",
    bullets: type === "objectives" || type === "summary" ? [""] : undefined,
    answer: type === "question" ? "" : undefined,
  };
}

export function coerceTeachingMaterial(value: unknown): TeachingMaterialContent {
  if (!value || typeof value !== "object") {
    return { schema_version: 1, native_kind: "teaching_material", subtitle: "", tags: [], slides: [] };
  }

  const content = value as TeachingMaterialContent;
  if (Array.isArray(content.slides) && content.slides.length > 0) {
    return {
      ...content,
      schema_version: 1,
      native_kind: "teaching_material",
      tags: Array.isArray(content.tags) ? content.tags : [],
    };
  }

  if (Array.isArray(content.slides_html) && content.slides_html.length > 0) {
    return {
      ...content,
      schema_version: 1,
      native_kind: "teaching_material",
      tags: Array.isArray(content.tags) ? content.tags : [],
      slides: content.slides_html.map((html, index) => ({
        id: `legacy-${index + 1}`,
        type: "legacy" as const,
        title: `Slide ${index + 1}`,
        html,
      })),
    };
  }

  return {
    ...content,
    schema_version: 1,
    native_kind: "teaching_material",
    tags: Array.isArray(content.tags) ? content.tags : [],
    slides: [],
  };
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value = "") {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function bulletList(items: string[] = []) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? `<ul>${cleaned.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
}

export function slideToHtml(slide: NativeSlide) {
  if (slide.type === "legacy") return slide.html ?? "";

  if (slide.type === "title") {
    return `<div class="deck-intro"><p class="deck-kicker">BMCH Medicine Teaching</p><h2>${escapeHtml(slide.title)}</h2>${slide.body ? `<p>${escapeHtml(slide.body)}</p>` : ""}</div>`;
  }

  if (slide.type === "objectives") {
    return `<div class="content-block key"><h4>${escapeHtml(slide.title || "Learning objectives")}</h4>${bulletList(slide.bullets)}</div>`;
  }

  if (slide.type === "case") {
    return `<div class="content-block key"><h4>${escapeHtml(slide.title || "Clinical case")}</h4>${paragraphs(slide.body)}</div>`;
  }

  if (slide.type === "investigation") {
    return `<div class="content-block"><h4>${escapeHtml(slide.title || "Investigation")}</h4>${paragraphs(slide.body)}</div>`;
  }

  if (slide.type === "question") {
    return `<div class="content-block key"><h4>${escapeHtml(slide.title || "Question")}</h4>${paragraphs(slide.body)}${slide.answer ? `<div class="mt-5 rounded-xl bg-[#eef5f4] p-4"><strong>Answer</strong>${paragraphs(slide.answer)}</div>` : ""}</div>`;
  }

  if (slide.type === "summary") {
    return `<div class="content-block key"><h4>${escapeHtml(slide.title || "Summary")}</h4>${bulletList(slide.bullets)}</div>`;
  }

  return `<div class="content-block"><h4>${escapeHtml(slide.title || "Teaching point")}</h4>${paragraphs(slide.body)}</div>`;
}
