import { Review } from './types';

const SERPAPI_BASE = 'https://serpapi.com/search.json';

interface SerpApiReview {
  snippet?: string;
  rating?: number;
  iso_date?: string;
}

interface SerpApiResponse {
  error?: string;
  reviews?: SerpApiReview[];
  serpapi_pagination?: { next_page_token?: string };
}

export async function fetchReviewsSerpApi(placeId: string, targetCount = 100): Promise<Review[]> {
  const apiKey = process.env.SERPAPI_KEY || '';
  if (!apiKey) throw new Error('SERPAPI_KEY is not set');

  const allReviews: Review[] = [];
  let nextPageToken: string | undefined;

  while (allReviews.length < targetCount) {
    const params = new URLSearchParams({
      engine: 'google_maps_reviews',
      place_id: placeId,
      hl: 'en',
      sort_by: 'newestFirst',
      api_key: apiKey,
    });

    if (nextPageToken) {
      params.set('next_page_token', nextPageToken);
      params.set('num', '20');
    }

    const res = await fetch(`${SERPAPI_BASE}?${params}`, { cache: 'no-store' });
    const json: SerpApiResponse = await res.json();

    if (json.error) throw new Error(`SerpApi error: ${json.error}`);

    const page = json.reviews ?? [];
    if (page.length === 0) break;

    for (const r of page) {
      if (!r.snippet?.trim()) continue;
      allReviews.push({
        text: r.snippet.trim(),
        stars: r.rating,
        date: r.iso_date,
      });
      if (allReviews.length >= targetCount) break;
    }

    nextPageToken = json.serpapi_pagination?.next_page_token;
    if (!nextPageToken) break;
  }

  return allReviews;
}
