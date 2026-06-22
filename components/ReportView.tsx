'use client';

import React, { useState, useEffect } from 'react';
import { ResearchReport, ChartPoint } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '@/lib/research';
import { ArrowUp, ArrowDown, Download, Star, TrendingUp, AlertTriangle, Shield, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface Props {
  report: ResearchReport;
  onAddToWatchlist?: () => void;
  onExportPDF?: () => void;
  isPro?: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export default function ReportView({ report, onAddToWatchlist, onExportPDF, isPro = true, notes = '', onNotesChange }: Props) {
  const { profile, quote, metrics, financials, chart, news, insights, risk, generatedAt } = report;

  const isUp = quote.change >= 0;
  const priceColor = isUp ? 'price-up' : 'price-down';

  const [chartPeriod, setChartPeriod] = useState<'1y' | '5d15m' | '1d15m'>('1y');
  const [displayChart, setDisplayChart] = useState(chart.map((p) => ({
    date: p.date,
    close: p.close,
    vol: p.volume,
  })));
  const [chartLabel, setChartLabel] = useState('1-Year Daily');

  useEffect(() => {
    async function loadChart() {
      let interval = '1d';
      let range = '1y';
      let label = '1-Year Daily';

      if (chartPeriod === '5d15m') {
        interval = '15m';
        range = '5d';
        label = '5-Day 15min Delayed';
      } else if (chartPeriod === '1d15m') {
        interval = '15m';
        range = '1d';
        label = '1-Day 15min Delayed';
      }

      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${profile.ticker}?interval=${interval}&range=${range}&includePrePost=false&indicators=quote`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!res.ok) throw new Error('Chart fetch failed');
        const json = await res.json();
        const result = json.chart?.result?.[0];
        const ts = result?.timestamp || [];
        const closes = result?.indicators?.quote?.[0]?.close || [];
        const vols = result?.indicators?.quote?.[0]?.volume || [];
        const newData = ts.map((t: number, i: number) => ({
          date: new Date(t * 1000).toLocaleString([], { month:'short', day:'numeric', hour: interval.includes('m') ? '2-digit' : undefined, minute: interval.includes('m') ? '2-digit' : undefined }),
          close: closes[i] ?? 0,
          vol: vols[i] ?? 0,
        })).filter((p: any) => p.close > 0);
        setDisplayChart(newData);
        setChartLabel(label);
      } catch (e) {
        // fallback to original
        setDisplayChart(chart.map((p) => ({ date: p.date, close: p.close, vol: p.volume })));
        setChartLabel('1-Year Daily (fallback)');
      }
    }
    if (chartPeriod !== '1y') {
      loadChart();
    } else {
      setDisplayChart(chart.map((p) => ({ date: p.date, close: p.close, vol: p.volume })));
      setChartLabel('1-Year Daily');
    }
  }, [chartPeriod, profile.ticker, chart]);

  const latestIncome = financials.incomeStatement.length > 0 
    ? financials.incomeStatement[financials.incomeStatement.length - 1] 
    : null;

  const formatCompact = (n: number | null) => formatCurrency(n, true);

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Sticky section nav for usability */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b py-2 mb-4 hidden md:block">
        <div className="flex gap-4 text-sm text-[#475569] px-2">
          <a href="#summary" className="hover:text-[#0F172A]">Summary</a>
          <a href="#metrics" className="hover:text-[#0F172A]">Metrics</a>
          <a href="#chart" className="hover:text-[#0F172A]">Chart</a>
          <a href="#risk" className="hover:text-[#0F172A]">Risk</a>
          <a href="#peers" className="hover:text-[#0F172A]">Peers</a>
          <a href="#notes" className="hover:text-[#0F172A]">Notes</a>
          <a href="#news" className="hover:text-[#0F172A]">News</a>
        </div>
      </div>

      {/* Executive Header */}
      <div className="report-header rounded-2xl px-8 py-8 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-4xl font-semibold tracking-tighter">{profile.name}</div>
              <div className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium mt-1">{profile.ticker}</div>
              <div className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium mt-1">{profile.exchange}</div>
            </div>
            <div className="text-white/70 text-lg">
              {profile.sector} • {profile.industry}
            </div>
            <div className="text-white/50 text-sm mt-1">
              Generated {new Date(generatedAt).toLocaleString()} • Data via Yahoo Finance
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-3">
              <div className="text-5xl font-semibold tabular-nums tracking-tighter">
                {formatCurrency(quote.price)}
              </div>
              <div className={`flex items-center gap-1 text-2xl font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                {formatPercent(quote.changePercent)}
              </div>
            </div>
            <div className="text-white/70 text-sm mt-1">
              {formatCurrency(quote.previousClose)} previous close
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onExportPDF}
            className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={onAddToWatchlist}
            className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Star className="w-4 h-4" /> Add to Watchlist
          </button>
          {!isPro && (
            <div className="ml-auto text-xs px-3 py-1.5 bg-white/10 rounded-lg flex items-center text-white/70">
              Pro features active in demo
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <div id="summary" className="card p-8 mb-6">
        <div className="section-title mb-3">Executive Summary</div>
        <p className="text-[15px] leading-relaxed text-[#1E2937] max-w-[85ch]">
          {insights.summary}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {insights.strengths.slice(0, 3).map((s, i) => (
            <div key={i} className="flex gap-3 text-sm bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <Target className="w-4 h-4 mt-0.5 text-[#0EA5E9] flex-shrink-0" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6">
        <div className="section-title mb-3 px-1">Key Metrics</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Metric label="Market Cap" value={formatCompact(quote.marketCap)} />
          <Metric label="P/E Ratio" value={quote.peRatio ? quote.peRatio.toFixed(1) : '—'} />
          <Metric label="EPS (TTM)" value={quote.eps ? quote.eps.toFixed(2) : '—'} />
          <Metric label="52w Range" value={`${formatCurrency(quote.fiftyTwoWeekLow)} – ${formatCurrency(quote.fiftyTwoWeekHigh)}`} />
          <Metric label="Day's Range" value={`${formatCurrency(quote.dayLow)} – ${formatCurrency(quote.dayHigh)}`} />
          <Metric label="Volume" value={formatNumber(quote.volume, true)} />
          <Metric label="Beta" value={metrics.beta ? metrics.beta.toFixed(2) : '—'} />
          <Metric label="Profit Margin" value={metrics.profitMargin ? formatPercent(metrics.profitMargin * 100) : '—'} />
        </div>
      </div>

      {/* Price Chart */}
      <div id="chart" className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
          <div className="section-title">Price Performance</div>
          <div className="flex gap-1 text-xs">
            <button onClick={() => setChartPeriod('1y')} className={`px-3 py-1 rounded ${chartPeriod==='1y' ? 'bg-[#0F172A] text-white' : 'border border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>1Y Daily</button>
            <button onClick={() => setChartPeriod('5d15m')} className={`px-3 py-1 rounded ${chartPeriod==='5d15m' ? 'bg-[#0F172A] text-white' : 'border border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>5D 15m Delayed</button>
            <button onClick={() => setChartPeriod('1d15m')} className={`px-3 py-1 rounded ${chartPeriod==='1d15m' ? 'bg-[#0F172A] text-white' : 'border border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>1D 15m Delayed</button>
          </div>
          <div className="text-xs text-[#64748B]">{chartLabel} • {displayChart.length} points</div>
        </div>
        <div className="chart-container">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  tickLine={false}
                  tickFormatter={(v) => '$' + v}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Close']}
                />
                <Area 
                  type="natural" 
                  dataKey="close" 
                  stroke="#0EA5E9" 
                  strokeWidth={2.5} 
                  fill="url(#priceGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Financial Snapshot */}
        <div className="lg:col-span-3 card p-7">
          <div className="section-title mb-4">Financial Snapshot (Recent Periods)</div>
          {financials.incomeStatement.length > 0 ? (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Net Income</th>
                    <th className="text-right">Op. Income</th>
                    <th className="text-right">EPS</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.incomeStatement.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-[#334155]">{row.date}</td>
                      <td className="text-right tabular-nums">{formatCompact(row.totalRevenue)}</td>
                      <td className="text-right tabular-nums">{formatCompact(row.netIncome)}</td>
                      <td className="text-right tabular-nums">{formatCompact(row.operatingIncome)}</td>
                      <td className="text-right tabular-nums">{row.eps ? row.eps.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-[#64748B] py-6">Detailed historical financial statements not available for this ticker.</div>
          )}

          {financials.balanceSheet && (
            <div className="mt-6 pt-6 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-5 gap-y-4 text-sm">
              <BalanceItem label="Total Assets" value={formatCompact(financials.balanceSheet.totalAssets)} />
              <BalanceItem label="Total Equity" value={formatCompact(financials.balanceSheet.totalEquity)} />
              <BalanceItem label="Cash" value={formatCompact(financials.balanceSheet.cash)} />
              <BalanceItem label="Long-term Debt" value={formatCompact(financials.balanceSheet.longTermDebt)} />
              <BalanceItem label="Total Liab." value={formatCompact(financials.balanceSheet.totalLiabilities)} />
            </div>
          )}
        </div>

        {/* Risk Analysis */}
        <div id="risk" className="lg:col-span-2 card p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Risk Assessment</div>
            <div className={`text-xs font-semibold px-3 py-1 rounded-full ${risk.level === 'Low' ? 'bg-emerald-100 text-emerald-700' : risk.level === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {risk.level} Risk — {risk.score}/100
            </div>
          </div>

          {/* Visual gauge for risk */}
          <div className="mb-4">
            <div className="h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${risk.score > 65 ? 'bg-red-500' : risk.score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>

          <div className="space-y-5">
            {Object.entries(risk.factors).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <div className="capitalize text-[#475569]">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t text-xs text-[#64748B] leading-relaxed">
            Composite score incorporates leverage, profitability, valuation premium, and observed price volatility. Not investment advice.
          </div>
        </div>
      </div>

      {/* Peer Benchmarking - new feature */}
      {report.peers && report.peers.length > 0 && (
        <div id="peers" className="card p-7 mb-6">
          <div className="section-title mb-4 flex items-center gap-2">Peer Benchmarking &amp; Relative Valuation</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>P/E</th>
                  <th>EV/Rev</th>
                  <th>Margin</th>
                  <th>Growth</th>
                  <th>vs Peers</th>
                </tr>
              </thead>
              <tbody>
                {report.peers.map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium">{p.ticker}</td>
                    <td>{p.name}</td>
                    <td>{p.peRatio ? p.peRatio.toFixed(1) : '—'}</td>
                    <td>{p.evRevenue ? p.evRevenue.toFixed(1) + 'x' : '—'}</td>
                    <td>{p.profitMargin ? formatPercent(p.profitMargin) : '—'}</td>
                    <td>{p.revenueGrowth ? formatPercent(p.revenueGrowth) : '—'}</td>
                    <td className="text-xs text-[#0EA5E9]">{p.relativeValuation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-[#64748B] mt-3">Peers selected by sector/size. Relative valuation vs company metrics.</div>
        </div>
      )}

      {/* Notes / Annotations - new */}
      <div id="notes" className="card p-7 mb-6">
        <div className="section-title mb-3">Your Notes &amp; Annotations</div>
        <textarea 
          value={notes}
          onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
          placeholder="Add private notes, follow-ups, or thesis here. Saved with the report."
          className="w-full h-24 p-3 border border-[#E2E8F0] rounded-xl text-sm resize-y"
        />
        <div className="text-xs text-[#64748B] mt-1">Notes are included in PDF exports for Pro users.</div>
      </div>

      {/* Provenance */}
      {report.dataSources && (
        <div className="text-xs text-[#64748B] px-1 mb-4">
          Data sources: {report.dataSources.join(' • ')} • Generated {new Date(generatedAt).toLocaleString()}
        </div>
      )}

      {/* Insights & Catalysts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-7">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#0EA5E9]" />
            <div className="section-title">Risk Factors</div>
          </div>
          <ul className="space-y-2.5 text-[14.5px]">
            {insights.risks.map((r, i) => (
              <li key={i} className="flex gap-3"><span className="text-[#EF4444] mt-1">•</span> {r}</li>
            ))}
          </ul>
        </div>

        <div className="card p-7">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <div className="section-title">Potential Catalysts</div>
          </div>
          <ul className="space-y-2.5 text-[14.5px]">
            {insights.catalysts.map((c, i) => (
              <li key={i} className="flex gap-3"><span className="text-[#10B981] mt-1">•</span> {c}</li>
            ))}
          </ul>
          <div className="mt-6 text-sm border-t pt-5 text-[#475569]">
            {insights.valuation}
          </div>
        </div>
      </div>

      {/* News */}
      <div id="news" className="card p-7 mb-8">
        <div className="section-title mb-4">Recent News &amp; Developments</div>
        {news.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {news.map((item) => (
              <a 
                key={item.uuid} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="news-item block group"
              >
                <div className="flex justify-between gap-6">
                  <div>
                    <div className="font-medium text-[#0F172A] group-hover:text-[#0EA5E9] transition-colors pr-2">{item.title}</div>
                    <div className="text-xs text-[#64748B] mt-1">{item.publisher} • {formatDate(item.publishTime)}</div>
                  </div>
                  <div className="text-[#0EA5E9] opacity-0 group-hover:opacity-100 transition text-sm self-start shrink-0">→</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#64748B]">No recent news available through data provider at this time.</div>
        )}
      </div>

      <div className="text-center text-xs text-[#94A3B8] pb-10">
        This report is for informational purposes only and does not constitute investment advice. Always conduct your own due diligence.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card metric">
      <div className="text-xs uppercase tracking-[0.5px] text-[#64748B] mb-1.5">{label}</div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight text-[#0F172A]">{value}</div>
    </div>
  );
}

function BalanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[#64748B] text-xs">{label}</div>
      <div className="font-semibold text-lg tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
