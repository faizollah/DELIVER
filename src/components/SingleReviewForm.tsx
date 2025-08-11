'use client';

import { useState } from 'react';
import { analyzeSingleReview } from '@/app/actions';
import SingleReviewAnalysis from './SingleReviewAnalysis';

export default function SingleReviewForm() {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const text = formData.get('text') as string;
    const results = await analyzeSingleReview(text);
    setAnalysisResults(results);
    setIsLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          name="text"
          rows={5}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
          placeholder="e.g., 'The staff was friendly but I had to wait a long time...'"
        />
        <button
          type="submit"
          className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {analysisResults && (
        <div className="mt-8">
          <SingleReviewAnalysis analysisResults={analysisResults} />
        </div>
      )}
    </div>
  );
}
