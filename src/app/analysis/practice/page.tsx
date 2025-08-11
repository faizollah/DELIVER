import Header from '@/components/Header';
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';
import LoadingLink from '@/components/LoadingLink';

export default function PracticeAnalysisPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || '';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Header />
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Analyse a Dental Practice</h2>
          <form action="/analysis/practice" method="GET" className="flex gap-3">
            <input name="query" defaultValue={query} placeholder="e.g., 'dentist in Manchester'" className="flex-1 rounded-lg border border-slate-200/70 bg-white/80 p-3 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
            <button className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:shadow-xl hover:brightness-110">Search</button>
          </form>
        </div>

        <Suspense fallback={<div className="mt-6 text-slate-600">Loading…</div>}>
          <div className="mx-auto mt-6 max-w-4xl">
            <SearchResults query={query} LinkComponent={LoadingLink} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
