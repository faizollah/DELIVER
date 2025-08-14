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

type BatchItem = [number, { predicted_labels: string[]; all_probabilities: Record<string, number> }];

function buildInsights(sentimentCounts: Record<string, number>, labelCounts: Record<string, number>): string {
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0) || 1;
  const topSent = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topTopics = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const sentPct = ((sentimentCounts[topSent] || 0) / total * 100).toFixed(0);
  const themes = topTopics.length > 0 ? topTopics.join(' and ') : 'no single dominant themes';
  return `Most reviews are ${topSent} (${sentPct}%). Frequent themes include ${themes}.`;
}

export default function PracticeAnalysis({ analysisResults, reviews }: PracticeAnalysisProps) {
  const { sentimentCounts, labelCounts, topicProbabilities } = analysisResults;
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0) || 1;
  const labels = Object.keys(sentimentCounts);
  const values = Object.values(sentimentCounts);

  const initialProbs = useMemo(() => (topicProbabilities && Object.keys(topicProbabilities).length > 0 ? topicProbabilities : null), [topicProbabilities]);
  const [intensity, setIntensity] = useState<Record<string, number> | null>(initialProbs);
  const [coverage, setCoverage] = useState<Record<string, number> | null>(null);
  const [metric, setMetric] = useState<'intensity' | 'coverage'>('intensity');
  const [progress, setProgress] = useState<number>(0);
  const [isClassifying, setIsClassifying] = useState<boolean>(!initialProbs);
  const [coocPairs, setCoocPairs] = useState<Array<{ a: string; b: string; count: number }>>([]);
  const [showReviews, setShowReviews] = useState<boolean>(false);

  useEffect(() => {
    if (initialProbs) return;
    const texts = reviews.map((r) => r.text).filter(Boolean);
    if (texts.length === 0) return;

    const chunkSize = 10;
    const totalCount = texts.length;
    let done = 0;

    const probSums: Record<string, number> = {};
    const coverCounts: Record<string, number> = {};
    const pairCounts: Record<string, number> = {};

    const classifyChunk = async (chunk: string[]) => {
      const res = await fetch('/api/classify-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: chunk }),
      });
      const data = await res.json();
      const results: BatchItem[] = data.results || [];

      results.forEach(([, r]) => {
        // Intensity (prob sums)
        Object.entries(r.all_probabilities || {}).forEach(([k, v]) => {
          probSums[k] = (probSums[k] || 0) + Number(v);
        });
        // Coverage (label presence)
        const uniqueLabels = Array.from(new Set(r.predicted_labels || []));
        uniqueLabels.forEach((lab) => (coverCounts[lab] = (coverCounts[lab] || 0) + 1));
        // Co-occurrence pairs
        for (let i = 0; i < uniqueLabels.length; i++) {
          for (let j = i + 1; j < uniqueLabels.length; j++) {
            const a = uniqueLabels[i];
            const b = uniqueLabels[j];
            const key = a < b ? `${a}||${b}` : `${b}||${a}`;
            pairCounts[key] = (pairCounts[key] || 0) + 1;
          }
        }
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
      // Finalise metrics
      const avgIntensity: Record<string, number> = {};
      Object.entries(probSums).forEach(([k, s]) => (avgIntensity[k] = s / totalCount));
      const percCoverage: Record<string, number> = {};
      Object.entries(coverCounts).forEach(([k, c]) => (percCoverage[k] = c / totalCount));

      const pairs = Object.entries(pairCounts)
        .map(([key, count]) => {
          const [a, b] = key.split('||');
          return { a, b, count };
        })
        .sort((x, y) => y.count - x.count)
        .slice(0, 8);

      setIntensity(avgIntensity);
      setCoverage(percCoverage);
      setCoocPairs(pairs);
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

  const currentData = metric === 'coverage' ? coverage : intensity;

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-slate-800">{insights}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 550 }}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Overall Sentiment Distribution</h4>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div className={`rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ${isClassifying ? 'animate-pulse' : ''}`} style={{ height: 550 }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-700">{metric === 'coverage' ? 'Topic coverage (% of reviews)' : 'Topic intensity (average confidence across reviews)'}</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => setMetric('intensity')} className={`px-3 py-1 text-xs rounded border ${metric === 'intensity' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300'}`}>Intensity</button>
              <button onClick={() => setMetric('coverage')} className={`px-3 py-1 text-xs rounded border ${metric === 'coverage' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300'}`}>Coverage</button>
              {isClassifying && (
                <div className="w-40 h-2 rounded bg-slate-200 overflow-hidden ml-2">
                  <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="h-[420px]">
            {currentData ? <TopicsBar probs={currentData} /> : <div className="h-full w-full flex items-center justify-center text-slate-500">Please wait…</div>}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            {metric === 'coverage'
              ? 'Coverage shows the share of reviews where each topic was selected (e.g., 40% means 40% of reviews explicitly mention that topic).'
              : 'Intensity shows the average model confidence that a random review mentions the topic.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Interpreting intensity (confidence)</h4>
        <p className="text-sm text-slate-800">By trusting the model as a reasonably trained expert, its confidence can act as a proxy for the clarity and strength of the signal in your data.</p>
        <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
          <li><span className="font-medium">High average confidence</span> (e.g., 90% for Staff Interaction): language is direct and unambiguous—the signal is strong.</li>
          <li><span className="font-medium">Low average confidence</span> (e.g., 30% for Cost and Value): language is vague/indirect—the signal is weak or mixed.</li>
          <li><span className="font-medium">Prominence and priorities</span>: compare scores to see what patients are “shouting” about versus “murmuring” about.</li>
          <li><span className="font-medium">Per‑review reading</span>: one label at ~95% is a focused review; many labels around 40–50% suggests a broader, less focused review.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Topic co‑occurrence (labels appearing together)</h4>
        {coocPairs.length === 0 ? (
          <p className="text-sm text-slate-600">Computed while classification runs. This highlights which topics tend to appear together in the same reviews.</p>
        ) : (
          <ul className="text-sm text-slate-800 space-y-2">
            {coocPairs.map(({ a, b, count }) => (
              <li key={`${a}-${b}`}>{a} and {b} appear together in {count} out of {reviews.length} reviews.</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-600">Use this to discover relationships between aspects of patient experience and prioritise improvements where co‑occurring topics indicate shared drivers.</p>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <button onClick={() => setShowReviews((s) => !s)} className="text-sm font-semibold text-slate-700 flex items-center gap-2">Reviews (from Google Maps) <span className="text-xs font-normal text-slate-500">{showReviews ? 'Hide' : 'Show'}</span></button>
        {showReviews && (
          <ul className="mt-3 space-y-3">
            {reviews.map((r, idx) => (
              <li key={idx} className="rounded-lg border border-slate-200/70 bg-white p-3 text-slate-800">{r.text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
