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

function buildInsights(sentimentCounts: Record<string, number>, labelCounts: Record<string, number>): string {
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0) || 1;
  const topSent = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topTopics = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const sentPct = ((sentimentCounts[topSent] || 0) / total * 100).toFixed(0);
  return `Most reviews are ${topSent} (${sentPct}%). Frequent themes include ${topTopics.join(' and ')}.`;
}

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
          label: (ctx: { parsed: number; label: string }) => {
            const v = ctx.parsed;
            const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${pct}%`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const insights = buildInsights(sentimentCounts as Record<string, number>, labelCounts as Record<string, number>);

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-slate-800">{insights}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 320 }}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Overall Sentiment Distribution</h4>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <TopicsBar probs={labelCounts as Record<string, number>} />
      </div>
    </div>
  );
}
