import Header from '@/components/Header';
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export default function PracticeAnalysisPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
  };
}) {
  const query = searchParams?.query || '';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <main className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Analyze a Dental Practice</h2>
            <form action="/analysis/practice" method="GET">
              <input
                type="text"
                name="query"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200"
                placeholder="e.g., 'dentist in Manchester'"
                defaultValue={query}
              />
              <button
                type="submit"
                className="w-full mt-4 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300"
              >
                Search
              </button>
            </form>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <SearchResults query={query} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
