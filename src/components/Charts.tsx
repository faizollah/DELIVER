'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  type TooltipItem,
  type ChartOptions,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import React from 'react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const animation = { duration: 700, easing: 'easeOutQuart' } as const;

export function SentimentPie({ label, confidence }: { label: string; confidence: number }) {
  const pct = Math.max(0, Math.min(1, confidence));
  const data = {
    labels: [label, 'Other'],
    datasets: [
      {
        data: [pct, 1 - pct],
        backgroundColor: [
          'rgba(14, 165, 233, 0.9)',
          'rgba(226, 232, 240, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    animation,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      tooltip: { enabled: true },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 260 }}>
      <h4 className="mb-3 text-sm font-semibold text-slate-700">Sentiment Confidence</h4>
      <Pie data={data} options={options} />
    </div>
  );
}

export function TopicsBar({ probs, topN = 12 }: { probs: Record<string, number>; topN?: number }) {
  const entries = Object.entries(probs || {}).sort((a, b) => b[1] - a[1]).slice(0, topN);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => Number(v));

  const data = {
    labels,
    datasets: [
      {
        label: 'Probability',
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${(i * 30) % 360} 90% 60% / 0.85)`),
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    animation,
    indexAxis: 'y',
    scales: {
      x: {
        min: 0,
        max: 1,
        grid: { color: 'rgba(226,232,240,0.6)' },
        ticks: { callback: (v: number | string) => `${Math.round(Number(v) * 100)}%` },
      },
      y: {
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.parsed.x !== undefined ? (ctx.parsed.x * 100).toFixed(1) : ctx.parsed}%`;
        },
      },
      title: {
        display: true,
        text: 'Topics (Top probabilities)',
        color: '#0f172a',
        font: { weight: 600 },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm" style={{ height: 400 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
