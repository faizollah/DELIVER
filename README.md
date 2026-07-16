# DELIVER — Dental Practice Review Analysis

A web application that analyses patient reviews of dental practices and turns
them into actionable insight. Given a practice, it collects public Google Maps
reviews and applies two machine-learning models — a **sentiment classifier**
and a **multi-label theme classifier** — then visualises the results
(sentiment distribution, theme coverage and intensity, sentiment-per-theme,
trends over time, topic co-occurrence, and keyword extraction).

> **Note on scope.** This repository contains the web application only. The
> sentiment and theme-classifier models are served from separate GPU inference
> endpoints and are **not** included here (see [Models](#models)).

<!-- TODO: add a screenshot or short GIF of the practice-analysis dashboard. -->

## Features

- Search for a dental practice and fetch its public Google Maps reviews.
- **Sentiment analysis** — each review classified as `positive`, `negative`,
  `neutral`, or `mixed`.
- **Theme classification** — multi-label classification across 10 dental-care
  themes:
  Staff and Service Quality · Treatment and Procedures · Appointment Management ·
  Dental Anxiety Management · Patient Experience · Specific Procedures ·
  Emergency and Pain Management · NHS and Private Care · Facilities and
  Equipment · Children and Family Dentistry.
- Interactive dashboard: overall sentiment, per-theme coverage/intensity,
  sentiment-by-theme breakdown, monthly sentiment trend, theme co-occurrence,
  and keyword extraction, with click-to-filter by sentiment.
- Single-review analysis mode for ad-hoc text.

## Tech stack

- **Framework:** Next.js (App Router, React Server Components, Server Actions) + TypeScript
- **UI / charts:** Tailwind CSS, Chart.js (`react-chartjs-2`)
- **Data:** Prisma ORM + PostgreSQL (review cache + sentiment log)
- **Review providers:** SerpApi (primary) → Outscraper → Apify (fallback chain), Google Places API
- **Inference:** external HTTP model endpoints (sentiment + theme classifier)
- **Deployment:** Vercel

## Architecture

```
Browser
  │
  ├── Next.js App Router (pages + Server Actions)  ── src/app/
  │     ├── searchPractices / getPracticeDetails   ── Google Places API
  │     ├── getPracticeReviews                     ── SerpApi → Outscraper → Apify
  │     ├── callSentiment                           ── Sentiment endpoint  /predict
  │     └── callTopics / classifyTexts              ── Theme endpoint      /predict
  │
  ├── API routes (src/app/api/*)  ── chunked client-side classification
  └── Prisma  ── PostgreSQL (ReviewCache, SentimentLog)
```

Key modules:

- `src/app/actions.ts` — server actions: review fetching, model calls, aggregation.
- `src/lib/reviewProviders.ts` — SerpApi review fetching.
- `src/lib/themes.ts` — theme taxonomy and response processing/aggregation.
- `src/components/` — dashboard and chart components.
- `prisma/schema.prisma` — `ReviewCache` and `SentimentLog` models.

## Getting started

### Prerequisites

- Node.js 18.17+ (or 20+)
- A PostgreSQL database
- API keys for the review providers (see below)
- Two reachable model inference endpoints (sentiment + theme classifier)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local and fill in the values

# 3. Generate the Prisma client and create the schema
npx prisma generate
npx prisma db push

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

See [`.env.example`](./.env.example) for the full list. Required:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_PLACES_API_KEY` | Practice search and place details |
| `SERPAPI_KEY` | Primary Google Maps reviews provider |
| `OUTSCRAPER_API_KEY` | Fallback reviews provider |
| `APIFY_TOKEN` | Second fallback reviews provider |
| `POSTGRES_PRISMA_URL` | PostgreSQL connection string (Prisma) |

## Models

The two classifiers are served over HTTP and expose a `POST /predict` endpoint
that accepts `{ "texts": [...] }`:

- **Sentiment** — returns `{ results: [{ label, class_id, confidence }] }` with
  labels `positive` / `negative` / `neutral` / `mixed`.
- **Theme classifier** — multi-label; returns per-text `all_probabilities`
  (one score per theme), `predicted_labels` (above a threshold, default `0.38`),
  and the `threshold` used.

The endpoints are currently configured in `src/app/actions.ts`. The model
weights and training code are not part of this repository.
<!-- TODO: link to the archived model artifacts / training code (e.g. a
     separate Figshare/Zenodo record) so the pipeline is reproducible. -->

## Data protection & ethics

This application processes **public patient reviews**, which may contain
personal data and personal opinions about identifiable practices and
individuals. If you deploy or reuse it:

- Process review data only for legitimate research purposes and in line with
  the platform terms of the review sources and applicable data-protection law
  (e.g. UK GDPR / EU GDPR).
- Note that `SentimentLog` persists raw review text alongside its predicted
  sentiment. Consider disabling this, anonymising input, or applying data
  minimisation/retention limits before any production or shared deployment.
- Do not use model outputs to make consequential decisions about identifiable
  individuals without appropriate review.

## Citation

If you use this software, please cite it using the metadata in
[`CITATION.cff`](./CITATION.cff).
<!-- TODO: add the Figshare DOI once minted. -->

## Funding & acknowledgements

<!-- TODO: confirm the exact wording and grant number with your project office. -->
This work was carried out as part of the **DELIVER** project. This project has
received funding from the European Union's Horizon Europe research and
innovation programme under grant agreement No **[GRANT NUMBER]**.

<!-- TODO: confirm the copyright holder / participating institutions. -->

## License

Released under the [MIT License](./LICENSE).
<!-- TODO: confirm MIT is the intended licence and set the correct copyright
     holder (e.g. the coordinating institution or the consortium). -->
