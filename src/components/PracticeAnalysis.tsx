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
import { useEffect, useMemo, useState } from 'react';

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

  const initialProbs = useMemo(() => (topicProbabilities && Object.keys(topicProbabilities).length > 0 ? topicProbabilities : null), [topicProbabilities]);
  const [probs, setProbs] = useState<Record<string, number> | null>(initialProbs);
  const [progress, setProgress] = useState<number>(0);
  const [isClassifying, setIsClassifying] = useState<boolean>(!initialProbs);

  useEffect(() => {
    if (initialProbs) return;
    const texts = reviews.map((r) => r.text).filter(Boolean);
    if (texts.length === 0) return;

    const chunkSize = 10;
    const totalCount = texts.length;
    let done = 0;

    const sums: Record<string, number> = {};

    const classifyChunk = async (chunk: string[]) => {
      const res = await fetch('/api/classify-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: chunk }),
      });
      const data = await res.json();
      const results: [number, { predicted_labels: string[]; all_probabilities: Record<string, number> }][] = data.results || [];
      results.forEach(([, r]) => {
        Object.entries(r.all_probabilities || {}).forEach(([k, v]) => {
          sums[k] = (sums[k] || 0) + Number(v);
        });
      });
      done += chunk.length;
      setProgress(Math.round((done / totalCount) * 100));
    };

    const run = async () => {
      setIsClassifying(true);
      for (let i = 0; i < texts.length; i += chunkSize) {
        const batch = texts.slice(i, i + chunkSize);
        try {
          await classifyChunk(batch);
        } catch {
          // continue with next chunk
        }
      }
      const avg: Record<string, number> = {};
      const n = totalCount || 1;
      Object.entries(sums).forEach(([k, s]) => (avg[k] = s / n));
      setProbs(avg);
      setIsClassifying(false);
    };

    run();
  }, [initialProbs, reviews]);

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
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 550 }}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Overall Sentiment Distribution</h4>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div className={`rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ${isClassifying ? 'animate-pulse' : ''}`} style={{ height: 550 }}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Topic intensity (average confidence across reviews)</h4>
            {isClassifying && (
              <div className="w-40 h-2 rounded bg-slate-200 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <div className="h-[420px]">
            {probs ? <TopicsBar probs={probs} /> : <div className="h-full w-full flex items-center justify-center text-slate-500">Please wait…</div>}
          </div>
          <p className="mt-3 text-xs text-slate-600">Each bar shows the average model confidence that a review mentions the topic. It reflects intensity across all reviews, not the share of reviews. For “share”, we can instead show the percentage of reviews where the topic was selected.</p>
        </div>
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
