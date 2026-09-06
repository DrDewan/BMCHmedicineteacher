export default function Loading() {
  return (
    <main className="animate-pulse pb-12">
      <section className="pb-6 pt-4 sm:pb-7 sm:pt-5">
        <div className="h-9 w-64 rounded-lg bg-[#e7edef]" />
        <div className="mt-3 h-5 w-full max-w-xl rounded bg-[#eef2f3]" />
        <div className="mt-2 h-5 w-72 rounded bg-[#eef2f3]" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading teaching resources">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="min-h-[170px] rounded-[18px] border border-[#dde5e7] bg-white p-[22px]">
            <div className="h-12 w-12 rounded-[14px] bg-[#e7edef]" />
            <div className="mt-8 h-6 w-36 rounded bg-[#e7edef]" />
            <div className="mt-2 h-4 w-48 max-w-full rounded bg-[#eef2f3]" />
          </div>
        ))}
      </section>
    </main>
  );
}
