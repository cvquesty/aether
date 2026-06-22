export interface CompanyProfile {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  employees: number | null;
  description: string;
  website: string;
  city: string;
  state: string;
  country: string;
}

export interface Quote {
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  volume: number;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
}

export interface KeyMetrics {
  marketCap: number | null;
  enterpriseValue: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  beta: number | null;
}

export interface FinancialPeriod {
  date: string;
  totalRevenue: number | null;
  netIncome: number | null;
  operatingIncome: number | null;
  eps: number | null;
}

export interface Financials {
  incomeStatement: FinancialPeriod[];
  balanceSheet: {
    totalAssets: number | null;
    totalLiabilities: number | null;
    totalEquity: number | null;
    longTermDebt: number | null;
    cash: number | null;
  } | null;
}

export interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishTime: string;
  summary?: string;
}

export interface ChartPoint {
  date: string;
  timestamp: number;
  close: number;
  volume: number;
}

export interface AIInsight {
  summary: string;
  strengths: string[];
  risks: string[];
  valuation: string;
  catalysts: string[];
}

export interface RiskAnalysis {
  score: number; // 0-100, higher = riskier
  level: 'Low' | 'Moderate' | 'Elevated' | 'High';
  factors: {
    volatility: string;
    leverage: string;
    profitability: string;
    valuation: string;
  };
}

export interface ResearchReport {
  profile: CompanyProfile;
  quote: Quote;
  metrics: KeyMetrics;
  financials: Financials;
  chart: ChartPoint[];
  news: NewsItem[];
  insights: AIInsight;
  risk: RiskAnalysis;
  generatedAt: string;
  peers?: PeerComparison[];
  dataSources?: string[];  // provenance
}

export interface PeerComparison {
  ticker: string;
  name: string;
  peRatio: number | null;
  evRevenue: number | null;
  profitMargin: number | null;
  revenueGrowth: number | null;
  relativeValuation: string; // e.g. "15% premium to peers"
}

export interface SavedReport extends ResearchReport {
  id: string;
  notes?: string;
  savedAt: string;
}
