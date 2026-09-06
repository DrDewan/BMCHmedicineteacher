export const metadata = { title: "Account pending" };

export default function PendingPage() {
  return (
    <main className="mx-auto max-w-xl py-16">
      <section className="rounded-[22px] border border-[var(--line)] bg-white p-6 text-center shadow-[0_18px_50px_rgba(25,40,55,0.06)] sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef7f5] text-xl font-extrabold text-[var(--accent)]">
          BM
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">Account awaiting activation</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
          Your login exists, but access to BMCH Medicine Education has not yet been activated by a department administrator.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
