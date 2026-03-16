'use client';

import { useRouter, usePathname } from 'next/navigation';

interface ReviewLimitSelectorProps {
  reviewCount: number;
  totalReviews: number;
  currentLimit: number;
}

export default function ReviewLimitSelector({ reviewCount, totalReviews, currentLimit }: ReviewLimitSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Build options: 100, 200, 300, ... up to totalReviews, then "All"
  const options: { label: string; value: number }[] = [];
  for (let n = 100; n < totalReviews; n += 100) {
    options.push({ label: `${n}`, value: n });
  }
  if (totalReviews > 0) {
    options.push({ label: `All (${totalReviews})`, value: totalReviews });
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`${pathname}?limit=${e.target.value}`);
  };

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
