import { getPracticeDetails, getPracticeReviews, analyzePracticeReviews, analyzeSentimentBatch } from '@/app/actions';
import Header from '@/components/Header';
import PracticeAnalysis from '@/components/PracticeAnalysis';
import ReviewLimitSelector from '@/components/ReviewLimitSelector';
import { AggregatedResults, Review } from '@/lib/types';
import React from 'react';

function aggregateSentiment(sentimentBatch: [number, { sentiment: string; confidence: number }][]) {
    const sentimentCounts: { [key: string]: number } = {};
    sentimentBatch.forEach(([, r]) => {
        sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
    });
    return sentimentCounts;
}

interface PracticeAnalysisPageProps {
  params: Promise<{ place_id: string }>;
  searchParams: Promise<{ limit?: string }>;
}

export default async function PracticeAnalysisPage({ params, searchParams }: PracticeAnalysisPageProps) {
  const { place_id } = await params;
  const { limit: limitParam } = await searchParams;
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const details = await getPracticeDetails(place_id);
  const totalReviews = details.user_ratings_total ?? 0;

  let reviews: Review[] = [];
  try {
    reviews = await getPracticeReviews(place_id, limit);
  } catch {
    reviews = [];
  }

  const aggregatedResults: AggregatedResults = { sentimentCounts: {}, themeCoverage: {}, themeIntensity: {} };

  if (reviews.length > 0) {
    try {
      const { sentimentBatchResults, multilabelBatchResults, themeAggregates } = await analyzePracticeReviews(reviews);
      aggregatedResults.sentimentCounts = aggregateSentiment(sentimentBatchResults);
      aggregatedResults.themeCoverage = themeAggregates.coverage;
      aggregatedResults.themeIntensity = themeAggregates.intensity;
      aggregatedResults.sentimentBatch = sentimentBatchResults;
      aggregatedResults.multilabelBatch = multilabelBatchResults;
    } catch {
      const sentimentBatch = await analyzeSentimentBatch(reviews);
      aggregatedResults.sentimentCounts = aggregateSentiment(sentimentBatch);
      aggregatedResults.sentimentBatch = sentimentBatch;
    }
  }

  const AnalysisComp = PracticeAnalysis as unknown as (p: { analysisResults: AggregatedResults; reviews: Review[] }) => React.ReactElement;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Header />
        <main className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-center mb-2">{details.name}</h2>
          <p className="text-center text-slate-600">{details.formatted_address}</p>
          {reviews.length > 0 ? (
            <>
              <ReviewLimitSelector
                reviewCount={reviews.length}
                totalReviews={totalReviews}
                currentLimit={limit}
              />
              <AnalysisComp analysisResults={aggregatedResults} reviews={reviews} />
            </>
          ) : (
            <p className="text-center text-gray-600">No reviews found for this practice.</p>
          )}
        </main>
      </div>
    </div>
  );
}
