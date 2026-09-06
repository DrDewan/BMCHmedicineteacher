import Link from "next/link";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">← Back to library</Link>
      <section className="mt-5 rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(25,40,55,0.04)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Phase 1</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Upload Resource</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          This route is reserved for PDF, PowerPoint, Word and image upload. Storage-backed uploading will be enabled when the Supabase schema, authentication and private buckets are connected in the next phase.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-[#c9d4d8] bg-[#f8fafb] px-5 py-10 text-center">
          <p className="font-semibold">Upload interface foundation ready</p>
          <p className="mt-1 text-sm text-[var(--muted)]">No file is accepted until secure storage is configured.</p>
        </div>
      </section>
    </main>
  );
}
