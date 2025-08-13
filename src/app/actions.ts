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

const http = axios.create({ timeout: 10000 });

const SENTIMENT_URL = 'http://38.54.126.14:8081/predict';
const TOPICS_URL = 'http://38.54.126.14:8082/predict';

// Outscraper (unused now) kept for reference
// const OUTSCRAPER_REVIEWS_URL = 'https://api.app.outscraper.com/maps/reviews-v3';
// type OutscraperReview = { review_text?: string; text?: string; review?: string };

// Apify Client (dynamic import to keep edge/server bundles slim)
async function getApifyClient() {
  const { ApifyClient } = await import('apify-client');
  return new ApifyClient({ token: process.env.APIFY_TOKEN || '' });
}

type GooglePlace = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  url?: string;
};

// Extend details with maps_url helper for internal flow
type PracticeDetailsWithUrl = PracticeDetails & { maps_url?: string };

type SentimentAPIResult = { label: string; class_id: number; confidence: number };

type TopicsAPIResult = {
  predicted_labels: string[];
  all_probabilities: Record<string, number>;
};

export async function searchPractices(query: string): Promise<Practice[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
  const params = {
    query: `dental practice ${query}`,
    key: process.env.GOOGLE_PLACES_API_KEY,
    type: 'dentist',
    language: 'en',
  };
  const response = await http.get(url, { params });
  const places = response.data.results as GooglePlace[];
  return places.map((p) => ({
    place_id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    formatted_address: p.formatted_address,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
  }));
}

export async function getPracticeDetails(place_id: string): Promise<PracticeDetails> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`;
  const params = {
    place_id,
    // Include the Google Maps URL so Apify can use it
    fields: 'name,formatted_address,url',
    key: process.env.GOOGLE_PLACES_API_KEY,
    language: 'en',
  };
  const response = await http.get(url, { params });
  const result = response.data.result as GooglePlace;
  const details: PracticeDetailsWithUrl = {
    place_id: result.place_id,
    name: result.name,
    address: result.formatted_address,
    formatted_address: result.formatted_address,
    rating: result.rating,
    user_ratings_total: result.user_ratings_total,
    reviews: [],
    maps_url: result.url,
  };
  return details;
}

// Apify dataset item minimal shape
interface ApifyReviewItem {
  reviewText?: string;
  text?: string;
  review?: string;
}

// Fetch Google Maps reviews via Apify (more than 5)
export async function getPracticeReviews(place_id: string): Promise<Review[]> {
  // Apify implementation: requires Google Maps place URL
  const details = (await getPracticeDetails(place_id)) as PracticeDetailsWithUrl;
  const mapsUrl = details.maps_url;
  if (!mapsUrl) throw new Error('Google Maps URL not available for this place');

  const token = process.env.APIFY_TOKEN || '';
  if (!token) throw new Error('APIFY_TOKEN is not set');

  const client = await getApifyClient();

  const input = {
    startUrls: [{ url: mapsUrl }],
    maxReviews: 100,
    reviewsSort: 'newest',
    language: 'en',
    reviewsOrigin: 'all',
    personalData: true,
  } as Record<string, unknown>;

  const run = await client.actor('Xb8osYTtOjlsgI6k9').call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  // Map results to Review[]
  const reviews: Review[] = (items as ApifyReviewItem[] | undefined || [])
    .map((it) => ({ text: (it.reviewText || it.text || it.review || '').toString() }))
    .filter((r) => r.text && r.text.trim().length > 0);

  return reviews;
}

export async function analyzeSingleReview(text: string): Promise<AnalysisResults> {
  const sentiment = await callSentiment([text]);

  let topics: TopicsAPIResult[];
  try {
    topics = await callTopics([text]);
  } catch {
    console.warn('Classification service unavailable for single review; continuing without labels.');
    topics = [{ predicted_labels: [], all_probabilities: {} }];
  }

  const firstSent = sentiment[0];
  const firstTopic = topics[0];

  const sentimentResult: SentimentResult = {
    sentiment: firstSent.label,
    confidence: firstSent.confidence,
  };

  const multilabelResult: MultilabelResult = {
    predicted_labels: firstTopic.predicted_labels,
    all_probabilities: firstTopic.all_probabilities,
  };

  // Best-effort logging: ignore DB errors in serverless env
  try {
    await prisma.sentimentLog.create({
      data: {
        inputText: text,
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
      },
    });
  } catch {
    console.warn('Skipping DB log (not configured or unavailable).');
  }

  return { sentimentResult, multilabelResult };
}

export async function analyzePracticeReviews(reviews: Review[]): Promise<{
  sentimentBatchResults: SentimentBatchResult;
  multilabelBatchResults: MultilabelBatchResult;
}> {
  const texts = reviews.map((r) => r.text);
  const sentiment = await callSentiment(texts);

  let topics: TopicsAPIResult[];
  try {
    topics = await callTopics(texts);
  } catch {
    console.warn('Classification service unavailable for practice batch; continuing without labels.');
    topics = texts.map(() => ({ predicted_labels: [], all_probabilities: {} }));
  }

  const sentimentBatchResults: SentimentBatchResult = sentiment.map((s, i) => [i, { sentiment: s.label, confidence: s.confidence }]);
  const multilabelBatchResults: MultilabelBatchResult = topics.map((t, i) => [i, { predicted_labels: t.predicted_labels, all_probabilities: t.all_probabilities }]);

  return { sentimentBatchResults, multilabelBatchResults };
}

async function callSentiment(texts: string[]): Promise<SentimentAPIResult[]> {
  try {
    const { data } = await http.post(SENTIMENT_URL, { texts }, { timeout: 15000 });
    return data.results as SentimentAPIResult[];
  } catch {
    throw new Error('Sentiment service is unavailable.');
  }
}

async function callTopics(texts: string[]): Promise<TopicsAPIResult[]> {
  try {
    const { data } = await http.post(TOPICS_URL, { texts, threshold: 0.3 }, { timeout: 20000 });
    return data.results as TopicsAPIResult[];
  } catch {
    throw new Error('Classification service is unavailable.');
  }
}
