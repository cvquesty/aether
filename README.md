# Aether

**Institutional-grade company research. Instant.**

Aether turns any public company ticker into a clean, executive-ready research brief in seconds. Designed for executives, family offices, wealth managers, and serious individual investors who need better than free finance sites — without paying Bloomberg prices.

> One search. Structured financials. Valuation. Risks. News. Insights. PDF export.

## The Product

- Modern, professional interface built for demanding users
- Real-time data pulled from public market sources
- Beautiful, scannable reports with price history, financial tables, risk scoring, and synthesized insights
- One-click professional PDF exports
- Watchlists + subscription model (Starter / Professional / Enterprise)

This is a complete, production-ready MVP for a high-willingness-to-pay finance SaaS.

## Key Features

- **Instant Research** — Search any ticker. Get a full report.
- **Executive Summaries** — Clear narrative + bullet strengths/risks.
- **Live Charts** — 1-year performance.
- **Financial Snapshot** — Income statement history + balance highlights.
- **Risk Analysis** — Composite scoring + factor breakdown.
- **News** — Latest relevant developments.
- **PDF Export** — Board-ready, clean formatting.
- **Watchlist** — Save companies across sessions (local).
- **Subscription UX** — Professional pricing page + upgrade flow.

## Stack

- Next.js 16 + TypeScript + Tailwind 4
- Recharts, Framer Motion, jsPDF
- Yahoo Finance public endpoints (no keys required for MVP)
- Fully client + server rendered

## Quick Start

```bash
cd workspace/aether
npm install
npm run dev
```

Open http://localhost:3000

Try: AAPL, NVDA, MSFT, TSLA, COST, JPM

## Architecture Notes

See [AGENTS.md](./AGENTS.md) for detailed guidance.

Data layer lives in:
- `lib/research.ts` — Yahoo fetchers + heuristic insights + risk scoring
- `app/api/research/[ticker]/route.ts` — edge API route
- `components/ReportView.tsx` — the beautiful report renderer

## Production Roadmap

1. Real auth (Clerk / Auth.js)
2. Stripe subscriptions + webhooks + customer portal
3. Persistent storage (reports, watchlists, users)
4. Replace heuristic insights with real LLM (Grok / Claude / GPT) for higher quality narrative
5. Upgrade data source (Polygon.io or Finnhub recommended)
6. Email alerts, saved history, team workspaces
7. Rate limiting, caching, usage quotas

## Data Attribution

Financial data provided via Yahoo Finance public endpoints for demonstration.  
In production you should use a commercial provider with proper licensing and SLAs.

## Deployment (to openvox.questy.org pattern)

The project follows the same deployment conventions as openvox-gui.

### One-command deploy from laptop
```bash
cd workspace/aether
./scripts/update_remote.sh --host openvox.questy.org --user jsheets --yes
# or set env:
# AETHER_DEPLOY_HOST=openvox.questy.org AETHER_DEPLOY_USER=jsheets ./scripts/update_remote.sh --yes
```

This rsyncs the source, runs `npm ci && npm run build` on the server under the `puppet` user, and restarts the service.

### Server layout
- Code & build: `/opt/aether`
- Runs as: `puppet` user (via systemd)
- Backend port: 3100 (internal only)
- Apache reverse proxy: `aether.questy.org`

### First time / DNS + SSL
1. Point DNS A record for `aether.questy.org` to the public IP that serves `openvox.questy.org` (currently ~153.66.103.232 range).
2. On the server after DNS propagates:
   ```bash
   sudo certbot --apache -d aether.questy.org
   ```
3. Certbot will create/ update the vhost with proper LE certs.
   - Use the full example in `docs/aether-ssl.conf.example` if you want to manage manually.

Current temporary HTTP proxy is in place at `/etc/httpd/conf.d/30-aether-ssl.conf`.

### Useful server commands
```bash
# Status & logs
sudo systemctl status aether -l
sudo journalctl -u aether -f

# Redeploy manually on server (after rsync or git pull)
sudo /opt/aether/scripts/deploy.sh /path/to/source

# Restart
sudo systemctl restart aether
```

Service file: `/etc/systemd/system/aether.service` (installed from `scripts/aether.service`).

## License

Private project. All rights reserved.
