"use client";

import { useMemo, useState } from "react";

type PracticeQuestion = {
  id: string;
  stem: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  source: string | null;
  imageUrl?: string | null;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PracticeRound({ questions }: { questions: PracticeQuestion[] }) {
  const initial = useMemo(() => shuffle(questions).slice(0, Math.min(10, questions.length)), [questions]);
  const [round, setRound] = useState(initial);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const question = round[index];

  function restart() {
    setRound(shuffle(questions).slice(0, Math.min(10, questions.length)));
    setIndex(0);
    setScore(0);
    setChoice(null);
    setFinished(false);
  }

  if (!question || questions.length === 0) {
    return <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white p-10 text-center text-sm text-[var(--muted)]">No approved practice questions are available yet.</div>;
  }

  if (finished) {
    return (
      <div className="rounded-[20px] border border-[var(--line)] bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Round complete</p>
        <p className="mt-3 text-5xl font-extrabold tracking-[-0.04em]">{score} / {round.length}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">Mixed practice across the BMCH teaching library.</p>
        <button onClick={restart} className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white">Start another round</button>
      </div>
    );
  }

  const answered = choice !== null;

  function answer(value: number) {
    if (answered) return;
    setChoice(value);
    if (value === question.correctAnswer) setScore((s) => s + 1);
  }

  function next() {
    if (index === round.length - 1) setFinished(true);
    else {
      setIndex((v) => v + 1);
      setChoice(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span>Question {index + 1} of {round.length}</span>
        <span className="font-bold text-[var(--accent)]">Score {score}/{index + (answered ? 1 : 0)}</span>
      </div>
      <div className="rounded-[20px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_28px_rgba(25,40,55,0.04)] sm:p-7">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent)]">{question.source ?? "Mixed practice"}</p>
        <h2 className="mt-2 text-xl font-bold leading-8 tracking-[-0.02em] sm:text-2xl">{question.stem}</h2>
        {question.imageUrl ? (
          <div className="mt-5 grid h-[330px] place-items-center overflow-hidden rounded-[14px] bg-[#0b0f12] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.imageUrl} alt="Practice question" className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
        <div className="mt-5 grid gap-2.5">
          {question.options.map((option, optionIndex) => {
            const correct = answered && optionIndex === question.correctAnswer;
            const wrong = answered && optionIndex === choice && choice !== question.correctAnswer;
            return (
              <button key={option} onClick={() => answer(optionIndex)} disabled={answered} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${correct ? "border-[#2b7a56] bg-[#f0faf5]" : wrong ? "border-[#b43b3b] bg-[#fff5f5]" : "border-[var(--line)] bg-white hover:border-[#9db8b5]"}`}>
                <span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>{option}
              </button>
            );
          })}
        </div>
        {answered ? (
          <div className="mt-5 rounded-[14px] bg-[#f4f7f7] p-4 text-sm leading-6">
            <p><strong>Answer:</strong> {question.options[question.correctAnswer]}</p>
            {question.explanation ? <p className="mt-1 text-[#4f5d66]">{question.explanation}</p> : null}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end">
          {answered ? <button onClick={next} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white">{index === round.length - 1 ? "Finish" : "Next question →"}</button> : null}
        </div>
      </div>
    </div>
  );
}
