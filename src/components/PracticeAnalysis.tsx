'use client';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { AggregatedResults } from '@/lib/types';
import { TopicsBar } from './Charts';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PracticeAnalysis({ analysisResults }: { analysisResults: AggregatedResults }) {
  const { sentimentCounts, labelCounts } = analysisResults;
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
  const labels = Object.keys(sentimentCounts);
  const values = Object.values(sentimentCounts);

  const pieData = {
    labels: labels.map((l) => l[0].toUpperCase() + l.slice(1)),
    datasets: [
      {
        data: values,
        backgroundColor: ['#34d399', '#f87171', '#60a5fa', '#fbbf24'],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = ctx.parsed as number;
            const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${pct}%`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 320 }}>
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Overall Sentiment Distribution</h4>
        <Pie data={pieData} options={pieOptions} />
      </div>
      <TopicsBar probs={labelCounts as any} />
    </div>
  );
}
