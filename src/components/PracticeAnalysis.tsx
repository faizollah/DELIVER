'use client';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { AggregatedResults, Review } from '@/lib/types';
import { TopicsBar } from './Charts';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface PracticeAnalysisProps {
  analysisResults: AggregatedResults;
  reviews: Review[];
}

function buildInsights(sentimentCounts: Record<string, number>, labelCounts: Record<string, number>): string {
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0) || 1;
  const topSent = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topTopics = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const sentPct = ((sentimentCounts[topSent] || 0) / total * 100).toFixed(0);
  return `Most reviews are ${topSent} (${sentPct}%). Frequent themes include ${topTopics.join(' and ')}.`;
}

export default function PracticeAnalysis({ analysisResults, reviews }: PracticeAnalysisProps) {
  const { sentimentCounts, labelCounts, topicProbabilities } = analysisResults;
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0) || 1;
  const labels = Object.keys(sentimentCounts);
  const values = Object.values(sentimentCounts);

  const [probs, setProbs] = useState<Record<string, number> | null>(topicProbabilities && Object.keys(topicProbabilities).length > 0 ? topicProbabilities : null);
  const [isClassifying, setIsClassifying] = useState<boolean>(!probs);

  useEffect(() => {
    if (probs) return;
    const texts = reviews.map((r) => r.text);
    if (texts.length === 0) return;

    let cancelled = false;

    const fetchWithRetry = async () => {
      setIsClassifying(true);
      const start = Date.now();
      let attempt = 0;
      let backoff = 800;
      while (!cancelled && Date.now() - start < 60000) { // retry up to 60s
        try {
          const res = await fetch('/api/classify-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts }),
          });
          const data = await res.json();
          const results: [number, { predicted_labels: string[]; all_probabilities: Record<string, number> }][] = data.results || [];
          const sums: Record<string, number> = {};
          results.forEach(([, r]) => {
            Object.entries(r.all_probabilities || {}).forEach(([k, v]) => {
              sums[k] = (sums[k] || 0) + Number(v);
            });
          });
          const avg: Record<string, number> = {};
          const n = results.length || 1;
          Object.entries(sums).forEach(([k, s]) => (avg[k] = s / n));
          if (Object.keys(avg).length > 0) {
            if (!cancelled) setProbs(avg);
            break;
          }
        } catch {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, backoff));
        attempt += 1;
        backoff = Math.min(backoff * 1.6, 4000);
      }
      if (!cancelled) setIsClassifying(false);
    };

    fetchWithRetry();
    return () => { cancelled = true; };
  }, [probs, reviews]);

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

  const topicEntries = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-slate-800">{insights}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 360 }}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Overall Sentiment Distribution</h4>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div className={`rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ${isClassifying ? 'animate-pulse' : ''}`} style={{ height: 400 }}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Classification (Top probabilities)</h4>
          {probs ? <TopicsBar probs={probs} /> : <div className="h-full w-full flex items-center justify-center text-slate-500">Waiting for classification...</div>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Top Topics</h4>
        <table className="w-full text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="text-left py-2">Topic</th>
              <th className="text-right py-2">Count</th>
              <th className="text-right py-2">% of reviews</th>
            </tr>
          </thead>
          <tbody>
            {topicEntries.map(([topic, count]) => (
              <tr key={topic} className="border-t border-slate-100">
                <td className="py-2 text-slate-800">{topic}</td>
                <td className="py-2 text-right text-slate-800">{count}</td>
                <td className="py-2 text-right text-slate-800">{((count / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Reviews (from Google Maps)</h4>
        <ul className="space-y-3">
          {reviews.map((r, idx) => (
            <li key={idx} className="rounded-lg border border-slate-200/70 bg-white p-3 text-slate-800">{r.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
