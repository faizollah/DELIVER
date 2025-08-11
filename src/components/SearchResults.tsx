import { searchPractices } from '@/app/actions';
import NextLink from 'next/link';
import React from 'react';

type LinkLike = (props: { href: string; children: React.ReactNode; className?: string }) => JSX.Element;

const DefaultLink: LinkLike = ({ href, children, className }) => (
  <NextLink href={href} className={className}>
    {children}
  </NextLink>
);

export default async function SearchResults({ query, LinkComponent = DefaultLink }: { query: string; LinkComponent?: LinkLike }) {
  if (!query) return null;
  const practices = await searchPractices(query);
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search Results</h2>
      {practices.length > 0 ? (
        <ul className="space-y-4">
          {practices.map((practice) => (
            <li key={practice.place_id} className="border-b pb-4">
              <LinkComponent href={`/analysis/practice/${practice.place_id}`} className="block hover:bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-600">{practice.name}</h3>
                <p className="text-gray-600">{practice.address}</p>
                <p className="text-yellow-500">Rating: {practice.rating} ({practice.user_ratings_total} reviews)</p>
              </LinkComponent>
            </li>
          ))}
        </ul>
      ) : (
        <p>No practices found for your search.</p>
      )}
    </div>
  );
}
