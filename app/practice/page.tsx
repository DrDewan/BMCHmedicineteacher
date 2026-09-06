import Link from "next/link";
import { PracticeRound } from "@/components/practice-round";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type OptionPayload = string[] | { choices?: unknown; image_url?: unknown; source?: unknown } | null;

export default async function PracticePage() {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("id, stem, options, correct_answer, explanation, topic")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const questions = (data ?? []).flatMap((question) => {
    const raw = question.options as unknown as OptionPayload;
    let choices: string[] = [];
    let imageUrl: string | null = null;
    let source: string | null = question.topic;
    if (Array.isArray(raw)) choices = raw.filter((item): item is string => typeof item === "string");
    else if (raw && typeof raw === "object") {
      if (Array.isArray(raw.choices)) choices = raw.choices.filter((item): item is string => typeof item === "string");
      if (typeof raw.image_url === "string") imageUrl = raw.image_url;
      if (typeof raw.source === "string") source = raw.source;
    }
    const answer = typeof question.correct_answer === "number" ? question.correct_answer : Number(question.correct_answer);
    if (choices.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= choices.length) return [];
    return [{ id: question.id, stem: question.stem, options: choices, correctAnswer: answer, explanation: question.explanation, source, imageUrl }];
  });

  return (
    <main className="mx-auto max-w-[920px] pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>
      <section className="mb-5 mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Mixed Teaching Assessment</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Practice Round</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Ten mixed questions drawn from clinical cases, investigations, procedures, teaching materials, clinical images, X-rays and ECGs.</p>
      </section>
      <PracticeRound questions={questions} />
    </main>
  );
}
