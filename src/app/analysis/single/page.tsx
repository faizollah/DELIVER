import Header from '@/components/Header';

export default function SingleReviewPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(14,165,233,0.12),transparent)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-10">
        <Header />

        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Analyse a Single Review</h2>
          <form action="/analyze" method="POST" className="mt-4 space-y-4">
            <textarea
              name="text"
              rows={6}
              placeholder="e.g., ‘The staff were friendly but I had to wait a long time…’"
              className="w-full rounded-lg border border-slate-200/70 bg-white/80 p-3 text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button type="submit" className="w-full rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:shadow-xl hover:brightness-110">
              Analyse
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
