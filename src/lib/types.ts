export interface Practice {
  place_id: string;
  name: string;
  address: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
}

export interface Review {
  text: string;
}

export interface PracticeDetails extends Practice {
  reviews: Review[];
}

export interface SentimentResult {
  sentiment: string; // e.g. "positive" | "negative" | "mixed" | "neutral"
  confidence: number;
}

export interface MultilabelResult {
  predictedThemes: string[];
  themeProbabilities: { [key: string]: number };
  threshold?: number;
}

export interface AnalysisResults {
  sentimentResult: SentimentResult;
  multilabelResult: MultilabelResult;
}

export type SentimentBatchResult = [number, SentimentResult][];
export type MultilabelBatchResult = [number, MultilabelResult][];

export interface AggregatedResults {
  sentimentCounts: { [key: string]: number };
  themeCoverage: { [key: string]: number };
  themeIntensity: { [key: string]: number };
}
