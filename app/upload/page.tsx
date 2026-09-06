import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadForm } from "./upload-form";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Upload Resource" };

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const profile = await requireActiveProfile();
  if (profile.role === "viewer") {
    redirect("/");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("resource_categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl pb-12">
      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
        ← Back to library
      </Link>
      <section className="mt-5 rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(25,40,55,0.04)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">Resource Library</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Upload Resource</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Upload the original file to private BMCH storage. New resources begin as drafts and can be reviewed before approval.
        </p>

        {error || !categories?.length ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Resource categories could not be loaded. Check the Supabase connection and your account permissions.
          </div>
        ) : (
          <UploadForm categories={categories} initialCategory={params.category} />
        )}
      </section>
    </main>
  );
}
