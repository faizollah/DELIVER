export interface Practice {
  place_id: string;
  name: string;
  address: string;
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
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  confidence: number;
}

export interface MultilabelResult {
  predicted_labels: string[];
  all_probabilities: { [key: string]: number };
}

export interface AnalysisResults {
  sentimentResult: SentimentResult;
  multilabelResult: MultilabelResult;
}

export type SentimentBatchResult = [number, SentimentResult][];
export type MultilabelBatchResult = [number, { predicted_labels: string[] }][];


export interface AggregatedResults {
  sentimentCounts: { [key: string]: number };
  labelCounts: { [key: string]: number };
}
