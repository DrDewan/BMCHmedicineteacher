import { login } from "./actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-[72vh] max-w-md items-center py-12">
      <section className="w-full rounded-[22px] border border-[var(--line)] bg-white p-6 shadow-[0_18px_50px_rgba(25,40,55,0.08)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Bangladesh Medical College Hospital
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em]">Medicine Education</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Internal Department of Medicine teaching library. Sign in with an approved BMCH account.
        </p>

        {params.error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </div>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />

          <label className="block text-sm font-semibold">
            Username
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={64}
              className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none transition focus:border-[var(--accent)]"
              placeholder="drraphael"
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none transition focus:border-[var(--accent)]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
          Accounts are created and activated by the department. Public self-registration is not part of this application.
        </p>
      </section>
    </main>
  );
}
