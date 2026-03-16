'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ReviewLimitSelectorProps {
  reviewCount: number;
  totalReviews: number;
  currentLimit: number;
}

export default function ReviewLimitSelector({ reviewCount, totalReviews, currentLimit }: ReviewLimitSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Build options: 100, 200, 300, ... up to totalReviews, then "All"
  const options: { label: string; value: number }[] = [];
  for (let n = 100; n < totalReviews; n += 100) {
    options.push({ label: `${n}`, value: n });
  }
  if (totalReviews > 0) {
    options.push({ label: `All (${totalReviews})`, value: totalReviews });
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    router.push(`${pathname}?limit=${e.target.value}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
        <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Fetching reviews, please wait...</span>
      </div>
    );
  }

  if (options.length <= 1) {
    return (
      <p className="text-center text-slate-500 text-sm mt-4">
        {reviewCount} reviews analysed
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-4 text-sm text-slate-600">
      <span>{reviewCount} reviews analysed</span>
      <select
        value={currentLimit}
        onChange={handleChange}
        className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 bg-white cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="text-slate-400">reviews</span>
    </div>
  );
}
