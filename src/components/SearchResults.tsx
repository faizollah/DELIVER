import { searchPractices } from '@/app/actions';
import Link from 'next/link';

export default async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return null;
  }

  const practices = await searchPractices(query);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search Results</h2>
      {practices.length > 0 ? (
        <ul className="space-y-4">
          {practices.map((practice) => (
            <li key={practice.place_id} className="border-b pb-4">
              <Link href={`/analysis/practice/${practice.place_id}`} className="block hover:bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-600">{practice.name}</h3>
                <p className="text-gray-600">{practice.address}</p>
                <p className="text-yellow-500">Rating: {practice.rating} ({practice.user_ratings_total} reviews)</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No practices found for your search.</p>
      )}
    </div>
  );
}
