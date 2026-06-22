# AGENTS.md — Aether Research

## Project Overview
Aether is a premium subscription SaaS that delivers clean, executive-grade company research reports instantly.

**Value Proposition**: "Just give us the company name. We give you the clean report."

Target users: Executives, family offices, professional investors, corporate strategy teams. High willingness to pay.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Recharts (price charts)
- Framer Motion (subtle motion)
- jsPDF + autotable (professional PDF exports)
- Sonner (toasts)
- Lucide icons

## Core Flow
1. User enters ticker or company on landing or in-app search
2. Server calls Yahoo Finance public endpoints (no API key)
3. Structured report returned with:
   - Profile + current quote
   - Key metrics
   - 1-year price chart
   - Income statement history
   - Data-driven insights + risk score
   - Recent news
4. User can export PDF, add to watchlist

## Data Sources
- Yahoo Finance (query1.finance.yahoo.com) — chart + quoteSummary modules + search
- No paid data provider in MVP. For production, consider:
  - Polygon.io (excellent fundamentals + news)
  - Finnhub (free tier available)
  - Financial Modeling Prep
  - Direct SEC EDGAR for filings

## Subscription Model (Current)
- Starter (free tier) — 3 reports/month
- Professional ($49/mo) — unlimited, watchlists, full features
- Enterprise (custom)

Current implementation uses localStorage mock auth + "upgrade" button that sets isPro flag. Real Stripe integration needed for launch.

## Running Locally
```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Production Notes
- Add real authentication (Clerk, NextAuth, or Supabase)
- Add Stripe Checkout + webhook for subscriptions + customer portal
- Add a proper Postgres + user reports storage
- LLM-enhanced insights (use Grok, Claude, or OpenAI) — current is deterministic heuristics
- Add email alerts, saved report history, team sharing
- Rate limiting + caching layer (Redis)
- Consider dedicated financial data provider

## Design Principles
- Extremely high visual and functional quality
- Scannable executive summaries first
- Numbers must be clean and tabular-nums
- No clutter. If it isn't decision-useful, cut it.
- Professional, calm, trustworthy palette (navy + sky accent)

## Important
- Never mock financial numbers in real usage. Always surface real source.
- PDF export must look board-ready.
- Respect rate limits on Yahoo (use caching).
