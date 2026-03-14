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
import type { SentimentThemeBreakdown, MonthlyBucket } from '@/lib/themes';

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
    layout: { padding: { left: 12, right: 12, top: 4, bottom: 8 } },
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

export function TopicsBar({ probs, topN }: { probs: Record<string, number>; topN?: number }) {
  const entries = Object.entries(probs || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN ?? Object.keys(probs || {}).length);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => Number(v));

  const data = {
    labels,
    datasets: [
      {
        label: 'Average confidence',
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${(i * 30) % 360} 90% 60% / 0.85)`),
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    animation,
    layout: { padding: { left: 18, right: 120 } },
    indexAxis: 'y',
    scales: {
      x: {
        min: 0,
        max: 1,
        grid: { color: 'rgba(226,232,240,0.6)' },
        ticks: { callback: (v: number | string) => `${Math.round(Number(v) * 100)}%` },
      },
      y: {
        offset: true,
        grid: { display: false },
        ticks: { autoSkip: false, padding: 10 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.parsed.x !== undefined ? (ctx.parsed.x * 100).toFixed(1) : ctx.parsed}%`,
        },
      },
      title: {
        display: true,
        text: 'Topic intensity (average confidence across reviews)',
        color: '#0f172a',
        font: { weight: 600 },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  );
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#009E73',
  negative: '#D55E00',
  neutral: '#0072B2',
  mixed: '#E69F00',
};
const SENTIMENT_ORDER = ['positive', 'negative', 'mixed', 'neutral'];

export function SentimentPerThemeBar({ breakdown }: { breakdown: SentimentThemeBreakdown }) {
  const themes = Object.keys(breakdown)
    .map((theme) => ({
      theme,
      total: Object.values(breakdown[theme]).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .map((t) => t.theme);

  const datasets = SENTIMENT_ORDER.map((sentiment) => ({
    label: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
    data: themes.map((theme) => breakdown[theme]?.[sentiment] || 0),
    backgroundColor: SENTIMENT_COLORS[sentiment],
    borderRadius: 4,
    borderWidth: 0,
  }));

  const data = { labels: themes, datasets };

  const options: ChartOptions<'bar'> = {
    animation,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(226,232,240,0.6)' },
        title: { display: true, text: 'Number of reviews' },
        ticks: { stepSize: 1, precision: 0 },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { autoSkip: false },
      },
    },
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  );
}

export function SentimentTrendChart({ buckets }: { buckets: MonthlyBucket[] }) {
  const labels = buckets.map((b) => b.label);

  const datasets = SENTIMENT_ORDER.map((sentiment) => ({
    label: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
    data: buckets.map((b) => b.sentimentCounts[sentiment] || 0),
    backgroundColor: SENTIMENT_COLORS[sentiment],
    borderRadius: 4,
    borderWidth: 0,
  }));

  const data = { labels, datasets };

  const options: ChartOptions<'bar'> = {
    animation,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(226,232,240,0.6)' },
        title: { display: true, text: 'Number of reviews' },
        ticks: { stepSize: 1, precision: 0 },
      },
    },
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  );
}
