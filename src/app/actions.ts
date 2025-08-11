'use server';

import axios from 'axios';
import prisma from '@/lib/prisma';
import {
  Practice,
  PracticeDetails,
  AnalysisResults,
  SentimentResult,
  MultilabelResult,
  Review,
  SentimentBatchResult,
  MultilabelBatchResult,
} from '@/lib/types';

const SENTIMENT_URL = 'http://38.54.126.14:8081/predict';
const TOPICS_URL = 'http://38.54.126.14:8082/predict';

export async function searchPractices(query: string): Promise<Practice[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
  const params = {
    query: `dental practice ${query}`,
    key: process.env.GOOGLE_PLACES_API_KEY,
    type: 'dentist',
    language: 'en',
  };
  const response = await axios.get(url, { params });
  return response.data.results.map((p: any) => ({
    place_id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
  }));
}

export async function getPracticeDetails(place_id: string): Promise<PracticeDetails> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`;
  const params = {
    place_id,
    fields: 'name,formatted_address,reviews',
    key: process.env.GOOGLE_PLACES_API_KEY,
    language: 'en',
  };
  const response = await axios.get(url, { params });
  return response.data.result;
}

// Single text analysis via new REST endpoints
export async function analyzeSingleReview(text: string): Promise<AnalysisResults> {
  const sentiment = await callSentiment([text]);
  const topics = await callTopics([text]);

  const firstSent = sentiment[0];
  const firstTopic = topics[0];

  const sentimentResult: SentimentResult = {
    sentiment: firstSent.label,
    confidence: firstSent.confidence,
  } as any;

  const multilabelResult: MultilabelResult = {
    predicted_labels: firstTopic.predicted_labels,
    all_probabilities: firstTopic.all_probabilities,
  };

  await prisma.sentimentLog.create({
    data: {
      inputText: text,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
    },
  });

  return { sentimentResult, multilabelResult };
}

// Batch review analysis for a practice
export async function analyzePracticeReviews(reviews: Review[]): Promise<{
  sentimentBatchResults: SentimentBatchResult;
  multilabelBatchResults: MultilabelBatchResult;
}> {
  const texts = reviews.map((r) => r.text);
  const sentiment = await callSentiment(texts);
  const topics = await callTopics(texts);

  const sentimentBatchResults: SentimentBatchResult = sentiment.map((s, i) => [i, { sentiment: s.label, confidence: s.confidence } as any]);
  const multilabelBatchResults: MultilabelBatchResult = topics.map((t, i) => [i, { predicted_labels: t.predicted_labels }]);

  return { sentimentBatchResults, multilabelBatchResults };
}

async function callSentiment(texts: string[]) {
  const { data } = await axios.post(SENTIMENT_URL, { texts });
  return data.results as { label: string; class_id: number; confidence: number }[];
}

async function callTopics(texts: string[]) {
  const { data } = await axios.post(TOPICS_URL, { texts, threshold: 0.3 });
  return data.results as { predicted_labels: string[]; all_probabilities: Record<string, number> }[];
}
