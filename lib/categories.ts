export type Category = {
  slug: string;
  title: string;
  description: string;
  shortLabel: string;
};

export const categories: Category[] = [
  {
    slug: "clinical-cases",
    title: "Clinical Cases",
    description: "Progressive ward and classroom cases for clinical reasoning.",
    shortLabel: "CA",
  },
  {
    slug: "teaching-materials",
    title: "Teaching Materials",
    description: "Slide-ready frameworks, documents and registrar teaching resources.",
    shortLabel: "TM",
  },
  {
    slug: "clinical-images",
    title: "Clinical Images",
    description: "Physical signs, bedside findings and clinical photographs.",
    shortLabel: "CI",
  },
  {
    slug: "x-rays",
    title: "X-Rays",
    description: "Radiographic teaching material with interpretation tools.",
    shortLabel: "XR",
  },
  {
    slug: "ecg",
    title: "ECG",
    description: "Core ECG examples, patterns and structured interpretation.",
    shortLabel: "EC",
  },
  {
    slug: "investigations",
    title: "Investigations",
    description: "ABG, blood tests, CSF and fluid interpretation exercises.",
    shortLabel: "IN",
  },
  {
    slug: "procedures",
    title: "Procedures",
    description: "Illustrated clinical procedures, safety checks and aftercare.",
    shortLabel: "PR",
  },
  {
    slug: "question-bank",
    title: "Question Bank",
    description: "Reviewed viva, MCQ, SAQ and clinical reasoning questions.",
    shortLabel: "QB",
  },
  {
    slug: "guidelines",
    title: "Guidelines",
    description: "Department protocols and useful current clinical guidance.",
    shortLabel: "GL",
  },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
