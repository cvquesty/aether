import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ResearchReport } from './types';
import { formatCurrency, formatPercent, formatNumber } from './research';

export function exportReportToPDF(report: ResearchReport) {
  const doc = new jsPDF();
  const { profile, quote, metrics, financials, insights, risk, generatedAt, peers, dataSources } = report as any;

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 22;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('AETHER', 20, 14);
  doc.setFontSize(10);
  doc.text('EXECUTIVE RESEARCH BRIEF', 20, 22);

  doc.setFontSize(11);
  doc.text(new Date(generatedAt).toLocaleDateString(), pageWidth - 20, 14, { align: 'right' });
  doc.text(profile.ticker, pageWidth - 20, 22, { align: 'right' });

  y = 44;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(22);
  doc.text(profile.name, 20, y);

  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`${profile.sector}  •  ${profile.industry}  •  ${profile.exchange}`, 20, y);

  // Price
  y += 14;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const priceStr = `${formatCurrency(quote.price)}   ${quote.change >= 0 ? '+' : ''}${formatPercent(quote.changePercent)}`;
  doc.text(priceStr, 20, y);

  // Executive Summary
  y += 14;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE SUMMARY', 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(insights.summary, pageWidth - 45);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 5.5 + 6;

  // Key Metrics
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('KEY METRICS', 20, y);
  y += 8;

  const metricsRows = [
    ['Market Cap', formatCurrency(quote.marketCap, true)],
    ['P/E (TTM)', quote.peRatio ? quote.peRatio.toFixed(1) : '—'],
    ['EPS (TTM)', quote.eps ? quote.eps.toFixed(2) : '—'],
    ['Profit Margin', metrics.profitMargin ? formatPercent(metrics.profitMargin * 100) : '—'],
    ['Beta', metrics.beta ? metrics.beta.toFixed(2) : '—'],
    ['52 Week', `${formatCurrency(quote.fiftyTwoWeekLow)} – ${formatCurrency(quote.fiftyTwoWeekHigh)}`],
  ];

  (doc as any).autoTable({
    startY: y,
    margin: { left: 20, right: 20 },
    body: metricsRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { textColor: [100, 116, 139] }, 1: { fontStyle: 'bold' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Risk
  doc.setFontSize(12);
  doc.text('RISK ASSESSMENT', 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Composite Risk Score: ${risk.score}/100  (${risk.level})`, 20, y);
  y += 6;
  doc.text(`Volatility: ${risk.factors.volatility}   |   Leverage: ${risk.factors.leverage}   |   Profitability: ${risk.factors.profitability}   |   Valuation: ${risk.factors.valuation}`, 20, y);
  y += 10;

  // Insights
  doc.setFontSize(12);
  doc.text('KEY INSIGHTS', 20, y);
  y += 7;
  doc.setFontSize(10);
  insights.strengths.forEach((s: string) => { doc.text('• ' + s, 22, y); y += 5.5; });
  y += 2;
  doc.text('RISKS', 20, y);
  y += 5.5;
  insights.risks.forEach((r: string) => { doc.text('• ' + r, 22, y); y += 5.5; });

  // Peers if present
  if (peers && peers.length > 0) {
    y += 8;
    doc.setFontSize(12);
    doc.text('PEER COMPARISON', 20, y);
    y += 6;
    peers.slice(0, 3).forEach((p: any) => {
      doc.setFontSize(10);
      doc.text(`• ${p.ticker} (${p.name}): P/E ${p.peRatio || '—'}, Rel: ${p.relativeValuation}`, 22, y);
      y += 5;
    });
  }

  // Notes
  if ((report as any).notes) {
    y += 8;
    doc.setFontSize(12);
    doc.text('YOUR NOTES', 20, y);
    y += 6;
    const noteLines = doc.splitTextToSize((report as any).notes, pageWidth - 45);
    doc.setFontSize(10);
    doc.text(noteLines, 20, y);
    y += noteLines.length * 5 + 5;
  }

  // Financial table
  y += 6;
  if (financials.incomeStatement.length > 0) {
    doc.setFontSize(12);
    doc.text('FINANCIAL SNAPSHOT', 20, y);
    y += 4;

    const finRows = financials.incomeStatement.map((r: any) => [
      r.date,
      formatCurrency(r.totalRevenue, true),
      formatCurrency(r.netIncome, true),
      r.eps ? r.eps.toFixed(2) : '—',
    ]);

    (doc as any).autoTable({
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Period', 'Revenue', 'Net Income', 'EPS']],
      body: finRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Aether Research — Confidential. For informational purposes only. Not investment advice.', 20, doc.internal.pageSize.getHeight() - 12);
  }

  doc.save(`${profile.ticker}_Aether_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}
