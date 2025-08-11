import { getPracticeDetails, analyzePracticeReviews, getPracticeReviews } from '@/app/actions';
import Header from '@/components/Header';
import PracticeAnalysis from '@/components/PracticeAnalysis';
import { SentimentBatchResult, MultilabelBatchResult, AggregatedResults, Review } from '@/lib/types';
import React from 'react';

function aggregateResults(sentimentResults: SentimentBatchResult, multilabelResults: MultilabelBatchResult): AggregatedResults {
    const sentimentCounts: { [key: string]: number } = {};
    const labelCounts: { [key: string]: number } = {};
    const topicProbSums: { [key: string]: number } = {};

    sentimentResults.forEach(result => {
        const sentiment = result[1].sentiment;
        sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
    });

    // Count topics and accumulate probabilities (to average later)
    multilabelResults.forEach(result => {
        const { predicted_labels, all_probabilities } = result[1] as { predicted_labels: string[]; all_probabilities: Record<string, number> };
        predicted_labels.forEach((label: string) => {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
        Object.entries(all_probabilities || {}).forEach(([label, prob]) => {
            topicProbSums[label] = (topicProbSums[label] || 0) + Number(prob);
        });
    });

    const numReviews = multilabelResults.length || 1;
    const topicProbabilities: { [key: string]: number } = Object.fromEntries(
      Object.entries(topicProbSums).map(([k, sum]) => [k, sum / numReviews])
    );

    return { sentimentCounts, labelCounts, topicProbabilities };
}

interface PracticeAnalysisPageProps { params: Promise<{ place_id: string }> }

export default async function PracticeAnalysisPage({ params }: PracticeAnalysisPageProps) {
  const { place_id } = await params;
  const details = await getPracticeDetails(place_id);

  // Old (max 5) using Google Place Details embedded reviews:
  // const reviews: Review[] = (details.reviews || [])
  //   .map((r: { text?: string }) => ({ text: r.text || '' }))
  //   .filter((r: Review) => r.text.length > 0);

  // New: fetch more reviews via Outscraper
  let reviews: Review[] = [];
  try {
    reviews = await getPracticeReviews(place_id);
  } catch (e) {
    // Fallback to any reviews that Google returned (likely 0–5)
    reviews = (details.reviews || [])
      .map((r: { text?: string }) => ({ text: r?.text || '' }))
      .filter((r: Review) => r.text.length > 0);
  }

  const analysisResults = await analyzePracticeReviews(reviews);
  const aggregatedResults = aggregateResults(analysisResults.sentimentBatchResults, analysisResults.multilabelBatchResults);

  const AnalysisComp = PracticeAnalysis as unknown as (p: { analysisResults: AggregatedResults; reviews: Review[] }) => React.ReactElement;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Header />
        <main className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
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
