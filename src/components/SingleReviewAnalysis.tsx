'use client';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { AnalysisResults } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function SingleReviewAnalysis({ analysisResults }: { analysisResults: AnalysisResults }) {
  const { sentimentResult, multilabelResult } = analysisResults;

  const sentimentData = {
    labels: [sentimentResult.sentiment, 'Other'],
    datasets: [
      {
        data: [sentimentResult.confidence, 1 - sentimentResult.confidence],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const multilabelData = {
    labels: Object.keys(multilabelResult.all_probabilities),
    datasets: [
      {
        label: 'Probability',
        data: Object.values(multilabelResult.all_probabilities),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Sentiment</h3>
        <Pie data={sentimentData} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Themes</h3>
        <Bar data={multilabelData} options={{ indexAxis: 'y' }} />
      </div>
    </div>
  );
}
