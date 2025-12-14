'use client';
import Header from '@/components/Header';
import { useState } from 'react';
import { SentimentPie, TopicsBar } from '@/components/Charts';

export default function SingleReviewPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sentiment: string; confidence: number; themes: string[]; probs?: Record<string, number> } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const res = await fetch('/api/analyze-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to analyse');
      setResult({
        sentiment: payload.sentimentResult.sentiment,
        confidence: payload.sentimentResult.confidence,
        themes: payload.multilabelResult.predictedThemes,
        probs: payload.multilabelResult.themeProbabilities,
      });
    } catch {
      setError('Sorry, something went wrong analysing this text. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(14,165,233,0.12),transparent)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-10">
        <Header />

        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Analyse a Single Review</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="e.g., ‘The staff were friendly but I had to wait a long time…’"
              className="w-full rounded-lg border border-slate-200/70 bg-white/80 p-3 text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button disabled={loading || text.trim().length === 0} type="submit" className="w-full rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:shadow-xl hover:brightness-110 disabled:opacity-50">
              {loading ? 'Analysing…' : 'Analyse'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {loading && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="h-[260px] animate-pulse rounded-xl bg-slate-200/70" />
              <div className="h-[400px] animate-pulse rounded-xl bg-slate-200/70" />
            </div>
          )}

          {result && !loading && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4">
                <p className="text-slate-800"><span className="font-semibold">Sentiment:</span> {result.sentiment} ({(result.confidence*100).toFixed(1)}%)</p>
                <p className="mt-2 text-slate-800"><span className="font-semibold">Top themes:</span> {result.themes.slice(0,5).join(', ')}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SentimentPie label={result.sentiment} confidence={result.confidence} />
                {result.probs && <TopicsBar probs={result.probs} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
