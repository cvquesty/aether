import { ResearchReport, CompanyProfile, Quote, KeyMetrics, Financials, NewsItem, ChartPoint, AIInsight, RiskAnalysis } from './types';

// Yahoo Finance unofficial endpoints (public, no key required)
// Note: Yahoo may rate-limit aggressive usage. Production apps should add caching + proper headers or migrate to Polygon/Finnhub.
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
const YAHOO_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        regularMarketPrice?: number;
        previousClose?: number;
        currency?: string;
        symbol: string;
        shortName?: string;
        exchangeName?: string;
        fiftyTwoWeekLow?: number;
        fiftyTwoWeekHigh?: number;
        regularMarketVolume?: number;
        regularMarketOpen?: number;
        regularMarketDayLow?: number;
        regularMarketDayHigh?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: unknown;
  };
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: {
        sector?: string;
        industry?: string;
        fullTimeEmployees?: number;
        longBusinessSummary?: string;
        website?: string;
        city?: string;
        state?: string;
        country?: string;
      };
      financialData?: {
        currentPrice?: { raw?: number };
        targetHighPrice?: { raw?: number };
        targetLowPrice?: { raw?: number };
        targetMeanPrice?: { raw?: number };
        recommendationMean?: { raw?: number };
        numberOfAnalystOpinions?: { raw?: number };
        totalCash?: { raw?: number };
        totalCashPerShare?: { raw?: number };
        ebitda?: { raw?: number };
        totalDebt?: { raw?: number };
        quickRatio?: { raw?: number };
        currentRatio?: { raw?: number };
        totalRevenue?: { raw?: number };
        debtToEquity?: { raw?: number };
        revenuePerShare?: { raw?: number };
        returnOnAssets?: { raw?: number };
        returnOnEquity?: { raw?: number };
        grossProfits?: { raw?: number };
        freeCashflow?: { raw?: number };
        operatingCashflow?: { raw?: number };
        earningsGrowth?: { raw?: number };
        revenueGrowth?: { raw?: number };
        grossMargins?: { raw?: number };
        ebitdaMargins?: { raw?: number };
        operatingMargins?: { raw?: number };
        profitMargins?: { raw?: number };
        financialCurrency?: string;
      };
      defaultKeyStatistics?: {
        enterpriseValue?: { raw?: number };
        forwardPE?: { raw?: number };
        pegRatio?: { raw?: number };
        priceToBook?: { raw?: number };
        priceToSalesTrailing12Months?: { raw?: number };
        enterpriseToRevenue?: { raw?: number };
        enterpriseToEbitda?: { raw?: number };
        beta?: { raw?: number };
        trailingPE?: { raw?: number };
        marketCap?: { raw?: number };
        trailingEps?: { raw?: number };
        fiftyTwoWeekLow?: { raw?: number };
        fiftyTwoWeekHigh?: { raw?: number };
      };
      incomeStatementHistory?: {
        incomeStatementHistory?: Array<{
          endDate?: { fmt?: string };
          totalRevenue?: { raw?: number };
          netIncome?: { raw?: number };
          operatingIncome?: { raw?: number };
          basicEPS?: { raw?: number };
        }>;
      };
      balanceSheetHistory?: {
        balanceSheetStatements?: Array<{
          endDate?: { fmt?: string };
          totalAssets?: { raw?: number };
          totalLiab?: { raw?: number };
          totalStockholderEquity?: { raw?: number };
          longTermDebt?: { raw?: number };
          cash?: { raw?: number };
        }>;
      };
    }>;
  };
}

interface YahooNewsResponse {
  news?: Array<{
    uuid?: string;
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    summary?: string;
  }>;
}

// Stub peer data for demo (in production use FMP/Polygon peers endpoint)
const PEER_STUBS: Record<string, Array<{ticker: string; name: string; pe: number | null; evRev: number | null; margin: number | null; growth: number | null}>> = {
  'AAPL': [
    {ticker: 'MSFT', name: 'Microsoft', pe: 35, evRev: 12, margin: 36, growth: 18},
    {ticker: 'GOOGL', name: 'Alphabet', pe: 22, evRev: 6, margin: 28, growth: 15},
    {ticker: 'META', name: 'Meta Platforms', pe: 25, evRev: 9, margin: 34, growth: 22},
  ],
  'MSFT': [
    {ticker: 'AAPL', name: 'Apple', pe: 32, evRev: 8, margin: 26, growth: 5},
    {ticker: 'GOOGL', name: 'Alphabet', pe: 22, evRev: 6, margin: 28, growth: 15},
    {ticker: 'AMZN', name: 'Amazon', pe: 40, evRev: 3, margin: 8, growth: 12},
  ],
  // Add more as needed for demo
};

async function fetchPeers(ticker: string, sector: string): Promise<any[]> {
  const stubs = PEER_STUBS[ticker.toUpperCase()] || [];
  if (stubs.length === 0) {
    // Fallback generic
    return [
      {ticker: 'PEER1', name: 'Peer One', pe: 25, evRev: 5, margin: 20, growth: 10},
      {ticker: 'PEER2', name: 'Peer Two', pe: 18, evRev: 4, margin: 15, growth: 8},
    ];
  }
  return stubs;
}

async function generateGrokInsights(reportData: any): Promise<AIInsight> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    // Fallback to heuristic
    return generateInsights(reportData.profile, reportData.quote, reportData.metrics, reportData.financials, reportData.chart);
  }

  const prompt = `You are a senior equity research analyst. Given this structured company data, produce a concise executive-grade report section.
Data: ${JSON.stringify(reportData, null, 2)}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary",
  "strengths": ["3 bullet strengths"],
  "risks": ["3 bullet risks"],
  "valuation": "valuation commentary",
  "catalysts": ["3 catalysts"]
}`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    return {
      summary: parsed.summary || 'Summary unavailable.',
      strengths: parsed.strengths || [],
      risks: parsed.risks || [],
      valuation: parsed.valuation || '',
      catalysts: parsed.catalysts || [],
    };
  } catch (e) {
    console.error('Grok call failed, falling back', e);
    return generateInsights(reportData.profile, reportData.quote, reportData.metrics, reportData.financials, reportData.chart);
  }
}

export async function fetchResearchReport(ticker: string): Promise<ResearchReport> {
  const upperTicker = ticker.toUpperCase().trim();

  // 1. Fetch chart + basic meta (1 year daily)
  const chartRes = await fetch(
    `${YAHOO_CHART}/${upperTicker}?interval=1d&range=1y&includePrePost=false&indicators=quote`,
    { next: { revalidate: 300 } } // 5 min cache
  );
  if (!chartRes.ok) throw new Error(`Unable to fetch data for ${upperTicker}`);
  const chartJson: YahooChartResponse = await chartRes.json();

  const chartResult = chartJson.chart?.result?.[0];
  if (!chartResult) throw new Error(`No data found for ${upperTicker}`);

  const meta = chartResult.meta;
  const timestamps = chartResult.timestamp || [];
  const closes = chartResult.indicators?.quote?.[0]?.close || [];
  const volumes = chartResult.indicators?.quote?.[0]?.volume || [];

  const chart: ChartPoint[] = timestamps
    .map((ts, i) => ({
      timestamp: ts * 1000,
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: closes[i] ?? 0,
      volume: volumes[i] ?? 0,
    }))
    .filter((p) => p.close > 0);

  // 2. Fetch detailed quote summary
  const modules = [
    'assetProfile',
    'financialData',
    'defaultKeyStatistics',
    'incomeStatementHistory',
    'balanceSheetHistory',
  ].join(',');

  const quoteRes = await fetch(
    `${YAHOO_QUOTE_SUMMARY}/${upperTicker}?modules=${modules}`,
    { next: { revalidate: 600 } }
  );
  const quoteJson: YahooQuoteSummaryResponse = quoteRes.ok ? await quoteRes.json() : { quoteSummary: { result: [] } };
  const summary = quoteJson.quoteSummary?.result?.[0] || {};

  const profileRaw = summary.assetProfile || {};
  const finData = summary.financialData || {};
  const keyStats = summary.defaultKeyStatistics || {};
  const incomeHist = summary.incomeStatementHistory?.incomeStatementHistory || [];
  const balHist = summary.balanceSheetHistory?.balanceSheetStatements || [];

  const profile: CompanyProfile = {
    ticker: upperTicker,
    name: meta.shortName || upperTicker,
    exchange: meta.exchangeName || 'N/A',
    sector: profileRaw.sector || 'Unknown',
    industry: profileRaw.industry || 'Unknown',
    employees: profileRaw.fullTimeEmployees ?? null,
    description: profileRaw.longBusinessSummary || 'No description available.',
    website: profileRaw.website || '',
    city: profileRaw.city || '',
    state: profileRaw.state || '',
    country: profileRaw.country || '',
  };

  const currentPrice = meta.regularMarketPrice ?? finData.currentPrice?.raw ?? chart[chart.length - 1]?.close ?? 0;
  const prevClose = meta.previousClose ?? currentPrice;

  const quote: Quote = {
    price: currentPrice,
    change: currentPrice - prevClose,
    changePercent: prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
    previousClose: prevClose,
    open: meta.regularMarketOpen ?? (finData as any).open?.raw ?? 0,
    dayLow: meta.regularMarketDayLow ?? (finData as any).dayLow?.raw ?? 0,
    dayHigh: meta.regularMarketDayHigh ?? (finData as any).dayHigh?.raw ?? 0,
    volume: meta.regularMarketVolume ?? (finData as any).volume?.raw ?? 0,
    marketCap: keyStats.marketCap?.raw ?? (finData as any).marketCap?.raw ?? null,
    peRatio: keyStats.trailingPE?.raw ?? (finData as any).trailingPE?.raw ?? null,
    eps: keyStats.trailingEps?.raw ?? null,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? keyStats.fiftyTwoWeekLow?.raw ?? null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? keyStats.fiftyTwoWeekHigh?.raw ?? null,
  };

  const metrics: KeyMetrics = {
    marketCap: keyStats.marketCap?.raw ?? null,
    enterpriseValue: keyStats.enterpriseValue?.raw ?? null,
    trailingPE: keyStats.trailingPE?.raw ?? null,
    forwardPE: keyStats.forwardPE?.raw ?? null,
    pegRatio: keyStats.pegRatio?.raw ?? null,
    priceToBook: keyStats.priceToBook?.raw ?? null,
    priceToSales: keyStats.priceToSalesTrailing12Months?.raw ?? null,
    profitMargin: finData.profitMargins?.raw ?? null,
    operatingMargin: finData.operatingMargins?.raw ?? null,
    returnOnAssets: finData.returnOnAssets?.raw ?? null,
    returnOnEquity: finData.returnOnEquity?.raw ?? null,
    revenueGrowth: finData.revenueGrowth?.raw ?? null,
    earningsGrowth: finData.earningsGrowth?.raw ?? null,
    debtToEquity: finData.debtToEquity?.raw ?? null,
    currentRatio: finData.currentRatio?.raw ?? null,
    quickRatio: finData.quickRatio?.raw ?? null,
    beta: keyStats.beta?.raw ?? null,
  };

  // Financials (last 4 periods if available)
  const incomeStatement: Financials['incomeStatement'] = incomeHist.slice(0, 4).map((row: any) => ({
    date: row.endDate?.fmt || 'N/A',
    totalRevenue: row.totalRevenue?.raw ?? null,
    netIncome: row.netIncome?.raw ?? null,
    operatingIncome: row.operatingIncome?.raw ?? null,
    eps: row.basicEPS?.raw ?? null,
  })).reverse(); // oldest first

  const latestBal = balHist[0] || {};
  const financials: Financials = {
    incomeStatement,
    balanceSheet: balHist.length > 0 ? {
      totalAssets: latestBal.totalAssets?.raw ?? null,
      totalLiabilities: latestBal.totalLiab?.raw ?? null,
      totalEquity: latestBal.totalStockholderEquity?.raw ?? null,
      longTermDebt: latestBal.longTermDebt?.raw ?? null,
      cash: latestBal.cash?.raw ?? null,
    } : null,
  };

  // Fill missing key metrics from available income data for demo (since Yahoo quoteSummary limited)
  const latestIncome = incomeStatement.length > 0 ? incomeStatement[incomeStatement.length-1] : null;
  if (latestIncome) {
    if (!quote.eps && latestIncome.eps) quote.eps = latestIncome.eps;
    if (!metrics.profitMargin && latestIncome.totalRevenue && latestIncome.netIncome) {
      metrics.profitMargin = latestIncome.netIncome / latestIncome.totalRevenue;
    }
  }
  // For PE, calculate if we have eps and price
  if (!quote.peRatio && quote.eps && quote.price && quote.eps > 0) {
    quote.peRatio = quote.price / quote.eps;
  }

  // 3. Fetch news (via search or direct)
  let news: NewsItem[] = [];
  try {
    const newsRes = await fetch(
      `${YAHOO_SEARCH}?q=${upperTicker}&newsCount=8&enableFuzzyQuery=false&quotesCount=0&newsCount=8`,
      { next: { revalidate: 600 } }
    );
    if (newsRes.ok) {
      const newsJson: YahooNewsResponse = await newsRes.json();
      news = (newsJson.news || []).slice(0, 6).map((n) => ({
        uuid: n.uuid || Math.random().toString(36),
        title: n.title || '',
        publisher: n.publisher || 'Yahoo Finance',
        link: n.link || '#',
        publishTime: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
        summary: n.summary,
      }));
    }
  } catch {
    // graceful fallback
  }

  // 4. Risk analysis
  const risk = calculateRisk(quote, metrics, chart);

  // Supplement missing metrics with FMP (free tier after signup at financialmodelingprep.com - 250 calls/day)
  // Set FMP_API_KEY env for full data on Market Cap, PE, EPS, Beta, Profit Margin
  const fmpKey = process.env.FMP_API_KEY;
  if (fmpKey && (!quote.marketCap || !quote.peRatio || !quote.eps || !metrics.beta || !metrics.profitMargin)) {
    try {
      const fmpRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/${upperTicker}?apikey=${fmpKey}`, { next: { revalidate: 600 } });
      if (fmpRes.ok) {
        const fmpData = await fmpRes.json();
        const fmp = fmpData && fmpData[0] ? fmpData[0] : {};
        if (!quote.marketCap && fmp.marketCap) quote.marketCap = fmp.marketCap;
        if (!quote.peRatio && fmp.pe) quote.peRatio = fmp.pe;
        if (!quote.eps && fmp.eps) quote.eps = fmp.eps;
        if (!metrics.beta && fmp.beta) metrics.beta = fmp.beta;
        if (!metrics.profitMargin && fmp.profitMargin) metrics.profitMargin = fmp.profitMargin;
      }
    } catch (e) {
      console.error("FMP supplement failed", e);
    }
  }

  // Demo fallback for common tickers while data source is limited (remove or replace with real provider)
  const demoMetrics: Record<string, Partial<Quote & KeyMetrics>> = {
    'AAPL': { marketCap: 2500000000000, peRatio: 30.5, eps: 6.15, beta: 1.25, profitMargin: 0.26 },
    'MSFT': { marketCap: 3100000000000, peRatio: 35.2, eps: 9.8, beta: 0.9, profitMargin: 0.36 },
    'GOOGL': { marketCap: 1800000000000, peRatio: 22.1, eps: 5.8, beta: 1.05, profitMargin: 0.28 },
    'AMZN': { marketCap: 1900000000000, peRatio: 45.0, eps: 3.5, beta: 1.15, profitMargin: 0.08 },
    'TSLA': { marketCap: 800000000000, peRatio: 55.0, eps: 4.2, beta: 2.0, profitMargin: 0.15 },
  };
  const demo = demoMetrics[upperTicker];
  if (demo) {
    if (!quote.marketCap && demo.marketCap) quote.marketCap = demo.marketCap;
    if (!quote.peRatio && demo.peRatio) quote.peRatio = demo.peRatio;
    if (!quote.eps && demo.eps) quote.eps = demo.eps;
    if (!metrics.beta && demo.beta) metrics.beta = demo.beta;
    if (!metrics.profitMargin && demo.profitMargin) metrics.profitMargin = demo.profitMargin;
  }

  // Add peers
  const rawPeers = await fetchPeers(upperTicker, profile.sector);
  const peers = rawPeers.map((p: any) => ({
    ticker: p.ticker,
    name: p.name,
    peRatio: p.pe,
    evRevenue: p.evRev,
    profitMargin: p.margin,
    revenueGrowth: p.growth,
    relativeValuation: p.pe && quote.peRatio ? (p.pe > quote.peRatio ? `${Math.round(((p.pe - quote.peRatio)/p.pe)*100)}% discount` : `${Math.round(((quote.peRatio - p.pe)/quote.peRatio)*100)}% premium`) : 'Comparable',
  }));

  // Grok or heuristic insights (LLM preferred)
  const insights = await generateGrokInsights({ profile, quote, metrics, financials, chart, news });

  return {
    profile,
    quote,
    metrics,
    financials,
    chart,
    news,
    insights,
    risk,
    generatedAt: new Date().toISOString(),
    peers,
    dataSources: ['Yahoo Finance (prices, summaries)', 'Heuristic + Grok (insights)', 'SEC EDGAR (future)'],
  };
}

// Simple but high-quality deterministic "AI" insights generator
// In production this would call an LLM with the structured data for nuanced narrative.
function generateInsights(
  profile: CompanyProfile,
  quote: Quote,
  metrics: KeyMetrics,
  financials: Financials,
  chart: ChartPoint[]
): AIInsight {
  const name = profile.name;
  const sector = profile.sector;

  const latestRevenue = financials.incomeStatement.length > 0 ? financials.incomeStatement[financials.incomeStatement.length - 1].totalRevenue : null;
  const prevRevenue = financials.incomeStatement.length > 1 ? financials.incomeStatement[financials.incomeStatement.length - 2].totalRevenue : null;
  const revGrowth = (latestRevenue && prevRevenue && prevRevenue > 0) ? ((latestRevenue - prevRevenue) / prevRevenue) * 100 : (metrics.revenueGrowth ? metrics.revenueGrowth * 100 : null);

  const profitMargin = metrics.profitMargin ? metrics.profitMargin * 100 : null;
  const roe = metrics.returnOnEquity ? metrics.returnOnEquity * 100 : null;
  const pe = quote.peRatio;

  const isExpensive = pe != null && pe > 35;
  const isCheap = pe != null && pe < 15 && pe > 0;
  const strongGrowth = revGrowth != null && revGrowth > 15;
  const profitable = (profitMargin ?? 0) > 10;

  const summary = `${name} operates in the ${sector} sector. ` +
    (profitable ? `It maintains healthy profitability with a ${profitMargin?.toFixed(1)}% net margin. ` : 'Profitability has been mixed in recent periods. ') +
    (roe && roe > 15 ? `Return on equity stands at a robust ${roe.toFixed(1)}%. ` : '') +
    (strongGrowth ? 'Revenue growth has been strong recently. ' : revGrowth ? `Recent revenue growth was ${revGrowth.toFixed(1)}%. ` : '') +
    (isExpensive ? 'Valuation appears premium relative to historical norms.' : isCheap ? 'Valuation screens attractively on traditional multiples.' : 'Valuation is broadly in line with sector peers.');

  const strengths: string[] = [];
  if (profitable) strengths.push(`Strong net margins of ${profitMargin?.toFixed(1)}%`);
  if (roe && roe > 12) strengths.push(`Solid return on equity (${roe.toFixed(1)}%)`);
  if (strongGrowth) strengths.push('Consistent top-line growth');
  if ((metrics.currentRatio ?? 0) > 1.5) strengths.push('Healthy liquidity position');
  if (strengths.length === 0) strengths.push('Established market position');

  const risks: string[] = [];
  if (isExpensive) risks.push('Elevated valuation increases downside risk if growth disappoints');
  if ((metrics.debtToEquity ?? 0) > 80) risks.push('Elevated leverage relative to equity');
  if ((metrics.beta ?? 1) > 1.4) risks.push('High beta – sensitive to broad market swings');
  if (!profitable) risks.push('Margin pressure observed in recent results');
  if (risks.length === 0) risks.push('Limited near-term red flags visible in reported data');

  const valuation = pe
    ? (isExpensive
        ? `Forward P/E of ${pe.toFixed(1)}x reflects high growth expectations. Monitor execution closely.`
        : isCheap
          ? `At ${pe.toFixed(1)}x trailing earnings, the stock trades at a discount to many peers.`
          : `Trading at ${pe.toFixed(1)}x earnings — reasonable but watch for multiple contraction.`)
    : 'Valuation multiples not available in current data.';

  const catalysts = [
    strongGrowth ? 'Continued execution on growth initiatives' : 'Potential margin expansion opportunities',
    'Sector tailwinds in ' + sector,
    'Possible capital return or M&A activity',
    'Next earnings release as a catalyst event',
  ].slice(0, 3);

  return {
    summary,
    strengths,
    risks,
    valuation,
    catalysts,
  };
}

function calculateRisk(quote: Quote, metrics: KeyMetrics, chart: ChartPoint[]): RiskAnalysis {
  let score = 30; // baseline

  const beta = metrics.beta ?? 1;
  score += Math.min(Math.max((beta - 1) * 18, -10), 25);

  const debtEq = metrics.debtToEquity ?? 40;
  if (debtEq > 120) score += 18;
  else if (debtEq > 70) score += 9;

  const margin = (metrics.profitMargin ?? 0.08) * 100;
  if (margin < 5) score += 12;
  else if (margin > 18) score -= 6;

  // Volatility proxy: range of last 60 closes relative to price
  if (chart.length > 30) {
    const recent = chart.slice(-60);
    const closes = recent.map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const vol = ((max - min) / (closes[closes.length - 1] || 1)) * 100;
    if (vol > 35) score += 14;
    else if (vol > 22) score += 6;
    else if (vol < 12) score -= 4;
  }

  const pe = quote.peRatio ?? 22;
  if (pe > 45) score += 10;

  score = Math.max(8, Math.min(92, Math.round(score)));

  let level: RiskAnalysis['level'];
  if (score < 28) level = 'Low';
  else if (score < 45) level = 'Moderate';
  else if (score < 65) level = 'Elevated';
  else level = 'High';

  return {
    score,
    level,
    factors: {
      volatility: beta > 1.3 ? 'Above-average' : beta < 0.85 ? 'Below-average' : 'Market-like',
      leverage: debtEq > 100 ? 'High' : debtEq > 50 ? 'Moderate' : 'Conservative',
      profitability: margin > 15 ? 'Strong' : margin > 7 ? 'Adequate' : 'Weak',
      valuation: pe > 40 ? 'Expensive' : pe < 14 ? 'Attractive' : 'Fair',
    },
  };
}

export async function searchTickers(query: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  if (!query || query.length < 1) return [];
  try {
    const res = await fetch(`${YAHOO_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`);
    if (!res.ok) return [];
    const json = await res.json();
    const quotes = json.quotes || [];
    return quotes
      .filter((q: any) => q.symbol && q.shortname)
      .slice(0, 8)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange || q.exchDisp || '',
      }));
  } catch {
    return [];
  }
}

// Format helpers
export function formatCurrency(n: number | null | undefined, compact = false): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (compact && abs >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (compact && abs >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (compact && abs >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number | null | undefined, compact = false): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (compact && abs >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (compact && abs >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (compact && abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (compact && abs >= 10000) return Math.round(n).toLocaleString();
  return n.toLocaleString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
