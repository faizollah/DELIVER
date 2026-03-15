'use server';

import axios from 'axios';
import prisma from '@/lib/prisma';
import { fetchReviewsSerpApi } from '@/lib/reviewProviders';
import { processClassifierResponse, aggregatePracticeThemes, createEmptyThemeMap, ThemeResult } from '@/lib/themes';
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

// const http = axios.create({ timeout: 10000 });
const http = axios.create({ timeout: 30000 });

// const SENTIMENT_URL = 'http://173.249.57.169:8081/predict';
const SENTIMENT_URL = 'https://ohgoojezganoqm-8080.proxy.runpod.net/predict';
// const TOPICS_URL = 'http://173.249.57.169:8082/predict';
const TOPICS_URL = 'https://1afotp7vft4524-8080.proxy.runpod.net/predict';

const OUTSCRAPER_REVIEWS_URL = 'https://api.app.outscraper.com/maps/reviews-v3';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// type OutscraperReview = { review_text?: string; snippet?: string; text?: string };
// type OutscraperResponseItem = { reviews_data?: OutscraperReview[] };
interface OutscraperReview {
  review_text?: string;
  text?: string;
  review?: string;
  rating?: number;
  stars?: number;
  review_datetime_utc?: string;
  publishedAtDate?: string;
}

// Apify Client (dynamic import to keep edge/server bundles slim)
// async function getApifyClient() {
//   const { ApifyClient } = await import('apify-client');
//   return new ApifyClient({ token: process.env.APIFY_TOKEN || '' });
// }

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
  threshold?: number;
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

// Apify dataset item minimal shape (kept for commented-out Apify implementation)
// interface ApifyReviewItem {
//   reviewText?: string;
//   text?: string;
//   review?: string;
//   stars?: number;
//   rating?: number;
//   publishedAtDate?: string;
//   reviewDate?: string;
// }

// Fetch Google Maps reviews via SerpApi (primary), Outscraper as backup
export async function getPracticeReviews(place_id: string): Promise<Review[]> {
  // 1. Try SerpApi first
  try {
    const t0 = Date.now();
    const reviews = await fetchReviewsSerpApi(place_id, 100);
    console.log(`[timing] SerpApi: ${Date.now() - t0}ms (${reviews.length} reviews)`);
    if (reviews.length > 0) return reviews;
    console.warn('[serpapi] returned 0 reviews — falling back to Outscraper');
  } catch (err) {
    console.warn(`[serpapi] failed: ${err} — falling back to Outscraper`);
  }

  // 2. Fall back to Outscraper
  return getPracticeReviewsOutscraper(place_id);
}

// Outscraper backup (swap in if SerpApi is unavailable)
async function getPracticeReviewsOutscraper(place_id: string): Promise<Review[]> {
  // 1. Check DB cache first
  try {
    const cached = await prisma.reviewCache.findUnique({ where: { placeId: place_id } });
    if (cached) {
      const ageMs = Date.now() - cached.cachedAt.getTime();
      if (ageMs < CACHE_TTL_MS) {
        return cached.reviews as unknown as Review[];
      }
    }
  } catch {
    // DB unavailable — proceed to scrape
  }

  // 2. Fetch from Outscraper
  const apiKey = process.env.OUTSCRAPER_API_KEY || '';
  if (!apiKey) throw new Error('OUTSCRAPER_API_KEY is not set');

  const t0 = Date.now();
  const response = await http.get(OUTSCRAPER_REVIEWS_URL, {
    params: { query: place_id, limit: 100, async: false },
    headers: { 'X-API-KEY': apiKey },
    timeout: 120000,
  });
  console.log(`[timing] Outscraper: ${Date.now() - t0}ms`);

  const rawReviews = response.data?.data?.[0]?.reviews_data as OutscraperReview[] | undefined;
  const reviews: Review[] = (rawReviews || [])
    .map((it) => ({
      text: (it.review_text || it.text || it.review || '').toString(),
      date: it.review_datetime_utc || it.publishedAtDate || undefined,
      stars: it.rating ?? it.stars ?? undefined,
    }))
    .filter((r) => r.text && r.text.trim().length > 0);

  // 3. Store in DB cache (non-fatal if it fails)
  try {
    await prisma.reviewCache.upsert({
      where: { placeId: place_id },
      update: { reviews: reviews as object[], cachedAt: new Date() },
      create: { placeId: place_id, reviews: reviews as object[] },
    });
  } catch {
    // Continue without caching
  }

  return reviews;
}

// Apify implementation (commented out — replaced by Outscraper)
// export async function getPracticeReviewsApify(place_id: string): Promise<Review[]> {
//   const details = (await getPracticeDetails(place_id)) as PracticeDetailsWithUrl;
//   const mapsUrl = details.maps_url;
//   if (!mapsUrl) throw new Error('Google Maps URL not available for this place');
//   const token = process.env.APIFY_TOKEN || '';
//   if (!token) throw new Error('APIFY_TOKEN is not set');
//   const client = await getApifyClient();
//   const input = {
//     startUrls: [{ url: mapsUrl }],
//     maxReviews: 100,
//     reviewsSort: 'newest',
//     language: 'en',
//     reviewsOrigin: 'all',
//     personalData: true,
//   } as Record<string, unknown>;
//   const run = await client.actor('Xb8osYTtOjlsgI6k9').call(input);
//   const { items } = await client.dataset(run.defaultDatasetId).listItems();
//   return (items as ApifyReviewItem[] | undefined || [])
//     .map((it) => ({
//       text: (it.reviewText || it.text || it.review || '').toString(),
//       date: it.publishedAtDate || it.reviewDate || undefined,
//       stars: it.stars ?? it.rating ?? undefined,
//     }))
//     .filter((r) => r.text && r.text.trim().length > 0);
// }

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
  const themeResult = processClassifierResponse(firstTopic);

  const sentimentResult: SentimentResult = {
    sentiment: firstSent.label,
    confidence: firstSent.confidence,
  };

  const multilabelResult: MultilabelResult = {
    predictedThemes: themeResult.predictedThemes,
    themeProbabilities: themeResult.themeProbabilities,
    threshold: themeResult.threshold,
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

// New: separate sentiment-first pathway for large batches
export async function analyzeSentimentBatch(reviews: Review[]): Promise<SentimentBatchResult> {
  const texts = reviews.map((r) => r.text);
  const sentiment = await callSentiment(texts);
  return sentiment.map((s, i) => [i, { sentiment: s.label, confidence: s.confidence }]);
}

export async function classifyTexts(texts: string[]): Promise<MultilabelBatchResult> {
  try {
    const topics = await callTopics(texts);
    return topics.map((t, i) => [i, processClassifierResponse(t)]);
  } catch {
    // Return empty results to keep UI responsive
    return texts.map((_, i) => [i, { predictedThemes: [], themeProbabilities: createEmptyThemeMap() }]);
  }
}

export async function analyzePracticeReviews(reviews: Review[]): Promise<{
  sentimentBatchResults: SentimentBatchResult;
  multilabelBatchResults: MultilabelBatchResult;
  themeAggregates: ReturnType<typeof aggregatePracticeThemes>;
}> {
  const texts = reviews.map((r) => r.text);

  const t1 = Date.now();
  const sentiment = await callSentiment(texts);
  console.log(`[timing] Sentiment: ${Date.now() - t1}ms`);

  // Topics skipped server-side — client handles chunk classification after page loads
  // const t2 = Date.now();
  // let topics: TopicsAPIResult[];
  // try {
  //   topics = await callTopics(texts);
  //   console.log(`[timing] Topics: ${Date.now() - t2}ms`);
  // } catch {
  //   console.warn('Classification service unavailable for practice batch; continuing without labels.');
  //   topics = texts.map(() => ({ predicted_labels: [], all_probabilities: {} }));
  // }

  const sentimentBatchResults: SentimentBatchResult = sentiment.map((s, i) => [i, { sentiment: s.label, confidence: s.confidence }]);
  const multilabelBatchResults: MultilabelBatchResult = [];
  const themeAggregates = aggregatePracticeThemes([]);

  return { sentimentBatchResults, multilabelBatchResults, themeAggregates };
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
