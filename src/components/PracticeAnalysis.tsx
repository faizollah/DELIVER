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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PracticeAnalysis({ analysisResults }: { analysisResults: any }) {
  const { sentimentCounts, labelCounts } = analysisResults;

  const sentimentData = {
    labels: Object.keys(sentimentCounts),
    datasets: [
      {
        data: Object.values(sentimentCounts),
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
      },
    ],
  };

  const topLabels = Object.entries(labelCounts).sort(([, a], [, b]) => b - a).slice(0, 15);

  const multilabelData = {
    labels: topLabels.map(([label]) => label),
    datasets: [
      {
        label: 'Frequency',
        data: topLabels.map(([, count]) => count),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Overall Sentiment</h3>
        <Pie data={sentimentData} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Themes</h3>
        <Bar data={multilabelData} options={{ indexAxis: 'y' }} />
      </div>
    </div>
  );
}
