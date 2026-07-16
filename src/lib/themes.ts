export const THEMES = [
  'Staff and Service Quality',
  'Treatment and Procedures',
  'Appointment Management',
  'Dental Anxiety Management',
  'Patient Experience',
  'Specific Procedures',
  'Emergency and Pain Management',
  'NHS and Private Care',
  'Facilities and Equipment',
  'Children and Family Dentistry',
]; // order matches the classifier /healthz classes 0–9

export type ThemeName = (typeof THEMES)[number];

export interface ThemeResult {
  predictedThemes: ThemeName[];
  themeProbabilities: Record<string, number>;
  threshold?: number;
}

export interface ThemeAggregates {
  coverage: Record<string, number>;
  intensity: Record<string, number>;
  coverageCounts: Record<string, number>;
  probabilitySums: Record<string, number>;
}

export function createEmptyThemeMap(): Record<string, number> {
  const map: Record<string, number> = {};
  THEMES.forEach((theme) => {
    map[theme] = 0;
  });
  return map;
}

export function processClassifierResponse(result: {
  predicted_labels?: string[];
  all_probabilities?: Record<string, number>;
  threshold?: number;
}): ThemeResult {
  const themeProbabilities = createEmptyThemeMap();

  Object.entries(result.all_probabilities || {}).forEach(([theme, prob]) => {
    themeProbabilities[theme] = prob || 0;
  });

  const predictedThemes = Array.from(new Set(result.predicted_labels || []));

  return { predictedThemes, themeProbabilities, threshold: result.threshold };
}

// --- Sentiment breakdown per theme ---

export type SentimentThemeBreakdown = Record<string, Record<string, number>>;

export function aggregateSentimentPerTheme(
  perReviewData: Array<{ sentiment: string; themeResult: ThemeResult }>,
): SentimentThemeBreakdown {
  const breakdown: SentimentThemeBreakdown = {};
  THEMES.forEach((theme) => {
    breakdown[theme] = {};
  });

  perReviewData.forEach(({ sentiment, themeResult }) => {
    themeResult.predictedThemes.forEach((theme) => {
      if (!breakdown[theme]) breakdown[theme] = {};
      breakdown[theme][sentiment] = (breakdown[theme][sentiment] || 0) + 1;
    });
  });

  return breakdown;
}

// --- Monthly sentiment buckets ---

export interface MonthlyBucket {
  month: string;
  label: string;
  sentimentCounts: Record<string, number>;
}

export function bucketReviewsByMonth(
  perReviewData: Array<{ index: number; sentiment: string }>,
  reviews: { date?: string }[],
): MonthlyBucket[] {
  const buckets: Record<string, Record<string, number>> = {};

  perReviewData.forEach(({ index, sentiment }) => {
    const review = reviews[index];
    if (!review?.date) return;
    const d = new Date(review.date);
    if (isNaN(d.getTime())) return;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[monthKey]) buckets[monthKey] = {};
    buckets[monthKey][sentiment] = (buckets[monthKey][sentiment] || 0) + 1;
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sentimentCounts]) => {
      const [y, m] = month.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      });
      return { month, label, sentimentCounts };
    });
}

export function aggregatePracticeThemes(results: ThemeResult[]): ThemeAggregates {
  const coverageCounts = createEmptyThemeMap();
  const probabilitySums = createEmptyThemeMap();

  results.forEach((res) => {
    res.predictedThemes.forEach((theme) => {
      coverageCounts[theme] = (coverageCounts[theme] || 0) + 1;
    });
    Object.entries(res.themeProbabilities).forEach(([theme, prob]) => {
      probabilitySums[theme] = (probabilitySums[theme] || 0) + Number(prob || 0);
    });
  });

  const totalReviews = results.length || 1;
  const coverage: Record<string, number> = {};
  const intensity: Record<string, number> = {};

  THEMES.forEach((theme) => {
    coverage[theme] = (coverageCounts[theme] || 0) / totalReviews;
    intensity[theme] = (probabilitySums[theme] || 0) / totalReviews;
  });

  return { coverage, intensity, coverageCounts, probabilitySums };
}
