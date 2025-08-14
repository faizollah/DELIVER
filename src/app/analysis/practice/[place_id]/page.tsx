import { getPracticeDetails, getPracticeReviews, analyzeSentimentBatch } from '@/app/actions';
import Header from '@/components/Header';
import PracticeAnalysis from '@/components/PracticeAnalysis';
import { AggregatedResults, Review } from '@/lib/types';
import React from 'react';

function aggregateSentiment(sentimentBatch: [number, { sentiment: string; confidence: number }][]): AggregatedResults {
    const sentimentCounts: { [key: string]: number } = {};
    sentimentBatch.forEach(([, r]) => {
        sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
    });
    return { sentimentCounts, labelCounts: {}, topicProbabilities: {} };
}

interface PracticeAnalysisPageProps { params: Promise<{ place_id: string }> }

export default async function PracticeAnalysisPage({ params }: PracticeAnalysisPageProps) {
  const { place_id } = await params;
  const details = await getPracticeDetails(place_id);

  // Fetch more reviews via Apify (fallback handled in actions)
  let reviews: Review[] = [];
  try {
    reviews = await getPracticeReviews(place_id);
  } catch {
    reviews = [];
  }

  const sentimentBatch = await analyzeSentimentBatch(reviews);
  const aggregatedResults = aggregateSentiment(sentimentBatch);

  const AnalysisComp = PracticeAnalysis as unknown as (p: { analysisResults: AggregatedResults; reviews: Review[] }) => React.ReactElement;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Header />
        <main className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-center mb-2">{details.name}</h2>
          <p className="text-center text-slate-600">{details.formatted_address}</p>
          <p className="text-center text-slate-500 mb-6">{reviews.length} reviews analysed</p>
          {reviews.length > 0 ? (
            <AnalysisComp analysisResults={aggregatedResults} reviews={reviews} />
          ) : (
            <p className="text-center text-gray-600">No reviews found for this practice.</p>
          )}
        </main>
      </div>
    </div>
  );
}
