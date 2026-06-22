'use client';

import React, { useState, useEffect } from 'react';
import { ResearchReport } from '@/lib/types';
import ReportView from '@/components/ReportView';
import SearchBar from '@/components/SearchBar';
import { exportReportToPDF } from '@/lib/exportPdf';
import { 
  ArrowRight, Check, Star, Users, Zap, Shield, TrendingUp, 
  BarChart3, Clock, FileText, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Simple auth + subscription simulation
interface User {
  email: string;
  name: string;
  isPro: boolean;
}

export default function AetherLanding() {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTicker, setCurrentTicker] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [showApp, setShowApp] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [savedReports, setSavedReports] = useState<any[]>([]);  // history with notes

  // Load persisted state
  useEffect(() => {
    const savedUser = localStorage.getItem('aether_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // DEMO: Auto-login as admin for the public demo site
      // This makes the full pro experience immediately available without manual login.
      const demoUser: User = {
        email: 'admin@aether.demo',
        name: 'Demo Admin',
        isPro: true,
      };
      localStorage.setItem('aether_user', JSON.stringify(demoUser));
      setUser(demoUser);
    }

    const savedWatch = localStorage.getItem('aether_watchlist');
    if (savedWatch) setWatchlist(JSON.parse(savedWatch));

    const savedHist = localStorage.getItem('aether_history');
    if (savedHist) setSavedReports(JSON.parse(savedHist));

    // Demo: auto-load a nice example on first visit (non-intrusive)
  }, []);

  const persistUser = (u: User | null) => {
    if (u) localStorage.setItem('aether_user', JSON.stringify(u));
    else localStorage.removeItem('aether_user');
    setUser(u);
  };

  const persistWatchlist = (w: string[]) => {
    localStorage.setItem('aether_watchlist', JSON.stringify(w));
    setWatchlist(w);
  };

  const saveCurrentReport = () => {
    if (!report) return;
    const saved = {
      ...report,
      notes: currentNotes,
      savedAt: new Date().toISOString(),
      id: Date.now().toString(),
    };
    const updated = [saved, ...savedReports.filter((r: any) => r.profile.ticker !== report.profile.ticker)].slice(0, 20);
    setSavedReports(updated);
    localStorage.setItem('aether_history', JSON.stringify(updated));
    toast.success('Report saved to history with notes');
  };

  const loadSaved = (saved: any) => {
    setReport(saved);
    setCurrentNotes(saved.notes || '');
    setCurrentTicker(saved.profile.ticker);
    setShowApp(true);
    toast.success(`Loaded saved report for ${saved.profile.ticker}`);
  };

  // Generate report - core value prop
  const generateReport = async (ticker: string) => {
    if (!ticker) return;

    setLoading(true);
    setCurrentTicker(ticker.toUpperCase());
    setShowApp(true);

    try {
      const res = await fetch(`/api/research/${encodeURIComponent(ticker)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate report');
      }
      const data: ResearchReport = await res.json();
      setReport(data);
      setCurrentNotes('');  // reset for new
      
      // Auto-scroll into view on desktop
      setTimeout(() => {
        const el = document.getElementById('report-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);

      toast.success(`Report generated for ${data.profile.ticker}`);
    } catch (e: any) {
      toast.error(e.message || 'Could not retrieve data. Try AAPL, MSFT, or NVDA.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    exportReportToPDF(report);
    toast.success('Report downloaded as PDF');
  };

  const handleAddWatchlist = () => {
    if (!report) return;
    const t = report.profile.ticker;
    if (watchlist.includes(t)) {
      toast.info('Already in your watchlist');
      return;
    }
    const next = [...watchlist, t];
    persistWatchlist(next);
    toast.success(`Added ${t} to watchlist`);
  };

  const removeFromWatchlist = (ticker: string) => {
    const next = watchlist.filter((t) => t !== ticker);
    persistWatchlist(next);
  };

  const loadFromWatchlist = (ticker: string) => {
    generateReport(ticker);
  };

  // Mock auth
  const handleAuth = () => {
    if (!authEmail) return;
    const demoUser: User = {
      email: authEmail,
      name: authEmail.split('@')[0],
      isPro: authMode === 'signup' || authEmail.includes('pro'),
    };
    persistUser(demoUser);
    setShowAuth(false);
    setAuthEmail('');
    toast.success(`Welcome, ${demoUser.name.split('.')[0]}`);
    
    // If they just signed up, show pricing
    if (authMode === 'signup') {
      setTimeout(() => setShowPricing(true), 600);
    }
  };

  const logout = () => {
    persistUser(null);
    toast('Signed out');
  };

  const upgradeToPro = () => {
    if (!user) {
      setAuthMode('signup');
      setShowAuth(true);
      return;
    }
    const upgraded = { ...user, isPro: true };
    persistUser(upgraded);
    setShowPricing(false);
    toast.success('You now have Aether Professional. Thank you.');
  };

  const quickPicks = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'JPM', 'XOM'];

  return (
    <div className="min-h-screen">
      {/* Professional Top Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center">
                <span className="text-white font-semibold text-lg leading-none mt-px">A</span>
              </div>
              <div className="font-semibold tracking-[-1.2px] text-2xl">Aether</div>
            </div>

            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]">
              <a href="#features" className="hover:text-[#0F172A]">Features</a>
              <a href="#pricing" className="hover:text-[#0F172A]">Pricing</a>
              <button onClick={() => setShowApp(true)} className="hover:text-[#0F172A]">Research</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm pr-3">
                  <span className="text-[#475569]">Hi, {user.name.split('.')[0]}</span>
                  {user.isPro && <span className="badge-pro">PRO</span>}
                </div>
                <button onClick={logout} className="btn-ghost text-sm flex items-center gap-1.5 px-4 py-2">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="btn-ghost px-4 py-2 text-sm">
                Sign in
              </button>
            )}
            <button 
              onClick={() => { setShowApp(true); window.scrollTo({ top: 420, behavior: 'smooth' }); }} 
              className="btn-primary px-5 py-2 text-sm"
            >
              Launch Research
            </button>
            <button onClick={() => setShowPricing(true)} className="btn-secondary px-5 py-2 text-sm hidden md:block">
              Pricing
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-4 py-1 text-xs font-medium tracking-[1px] mb-6 text-[#475569]">
          BUILT FOR EXECUTIVES • INSTITUTIONAL-GRADE CLARITY
        </div>

        <h1 className="text-6xl md:text-7xl font-semibold tracking-[-3.8px] leading-[0.92] mb-6">
          Institutional-grade<br />research.<br />Instant.
        </h1>
        <p className="max-w-[640px] mx-auto text-xl text-[#475569] mb-10 tracking-tight">
          One search. A complete, beautifully designed brief with financials, valuation, 
          risk analysis, and clear insights. No noise. No tabs.
        </p>

        {/* Primary Search - The hero promise */}
        <div className="flex justify-center mb-3">
          <div className="w-full max-w-[620px]">
            <SearchBar 
              onSelect={generateReport} 
              loading={loading}
              placeholder="Type company or ticker — AAPL, Costco, JPMorgan..."
              size="large"
            />
          </div>
        </div>
        <p className="text-xs text-[#64748B] mb-6">Real-time market data • Clean executive briefs • One-click PDF</p>

        {/* Quick picks - premium pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {quickPicks.map((t) => (
            <button 
              key={t} 
              onClick={() => generateReport(t)}
              className="px-5 py-1.5 text-sm rounded-full border border-[#E2E8F0] bg-white hover:border-[#0EA5E9] hover:text-[#0EA5E9] font-medium transition-colors shadow-sm active:scale-[0.985]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Trust indicators */}
      <div className="border-y border-[#E2E8F0] bg-white py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm text-[#64748B] font-medium tracking-wide">
          <div>PRIVATE EQUITY</div>
          <div>FAMILY OFFICES</div>
          <div>CORPORATE STRATEGY</div>
          <div>WEALTH MANAGERS</div>
          <div>INDEPENDENT INVESTORS</div>
        </div>
      </div>

      {/* Live Report Area - The product */}
      <AnimatePresence>
        {showApp && (
          <div id="report-section" className="max-w-6xl mx-auto px-6 pt-10 pb-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="uppercase tracking-[2px] text-xs font-semibold text-[#64748B]">RESEARCH TERMINAL</div>
                <div className="text-3xl font-semibold tracking-tight">Generate a Report</div>
              </div>
              <button onClick={() => setShowApp(false)} className="text-sm text-[#64748B] hover:text-[#0F172A]">Close</button>
            </div>

            {/* Compact search inside app */}
            <div className="mb-8 max-w-xl">
              <SearchBar 
                onSelect={generateReport} 
                loading={loading} 
                placeholder="Search another ticker..."
                size="default"
              />
            </div>

            {/* Watchlist */}
            {watchlist.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="section-title">Your Watchlist</div>
                  <div className="text-xs text-[#64748B]">{watchlist.length} companies</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchlist.map((t) => (
                    <div key={t} className="flex items-center rounded-full border border-[#E2E8F0] bg-white pl-4 pr-1.5 py-1 text-sm">
                      <button onClick={() => loadFromWatchlist(t)} className="font-medium pr-3 hover:text-[#0EA5E9]">{t}</button>
                      <button onClick={() => removeFromWatchlist(t)} className="text-[#94A3B8] hover:text-red-500 px-1.5">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History / Persistent Reports - new feature */}
            {savedReports.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="section-title">Research History &amp; Annotations</div>
                  <div className="text-xs text-[#64748B]">{savedReports.length} saved</div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {savedReports.slice(0, 5).map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-[#F8FAFC]" onClick={() => loadSaved(s)}>
                      <div>
                        <span className="font-medium">{s.profile.ticker}</span> — {s.profile.name} 
                        <span className="text-[#64748B] ml-2 text-xs">{new Date(s.savedAt).toLocaleDateString()}</span>
                      </div>
                      <button className="text-xs text-[#0EA5E9]">Load + Notes</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Renderer */}
            {loading && (
              <div className="card p-16 text-center">
                <div className="animate-pulse text-[#0EA5E9] mb-2">
                  <BarChart3 className="w-8 h-8 mx-auto" />
                </div>
                <div className="font-semibold">Pulling latest data and building your brief...</div>
                <div className="text-sm text-[#64748B] mt-1">This usually takes 1–3 seconds</div>
              </div>
            )}

            {!loading && report && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <ReportView 
                  report={report} 
                  onExportPDF={handleExport} 
                  onAddToWatchlist={handleAddWatchlist}
                  isPro={user?.isPro ?? true}
                  notes={currentNotes}
                  onNotesChange={setCurrentNotes}
                />
                <div className="flex justify-end mt-2">
                  <button onClick={saveCurrentReport} className="text-sm text-[#0EA5E9] hover:underline">Save this report + notes to history</button>
                </div>
              </motion.div>
            )}

            {!loading && !report && (
              <div className="text-center py-12 text-[#64748B]">
                Search for a company above to generate an executive research report.
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Features */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-20 border-t">
        <div className="text-center mb-14">
          <div className="text-[#0EA5E9] text-xs font-semibold tracking-[2px] mb-2">WHY EXECUTIVES CHOOSE AETHER</div>
          <div className="text-4xl font-semibold tracking-tight">Everything you need.<br />Nothing you don&apos;t.</div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: <Zap className="w-5 h-5" />, title: "Instant Clean Reports", desc: "One search. Structured financials, valuation, risks, news, and synthesized insights. No noise." },
            { icon: <FileText className="w-5 h-5" />, title: "PDF-Ready Deliverables", desc: "Beautiful exportable briefs you can confidently forward to your team or board." },
            { icon: <Shield className="w-5 h-5" />, title: "Risk & Valuation Clarity", desc: "Composite risk scoring, leverage analysis, and data-driven valuation commentary." },
            { icon: <BarChart3 className="w-5 h-5" />, title: "Live Market Data", desc: "Charts and key metrics refreshed from live market sources. Always current." },
            { icon: <Clock className="w-5 h-5" />, title: "Time Back in Your Day", desc: "What used to take 45 minutes now takes under 60 seconds." },
            { icon: <Users className="w-5 h-5" />, title: "Built for Professionals", desc: "Designed for people who make capital allocation decisions and need to be right." },
          ].map((f, i) => (
            <div key={i} className="card p-7 group">
              <div className="w-11 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] mb-6 group-hover:bg-[#0EA5E9] group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <div className="font-semibold text-[21px] mb-2.5 tracking-[-0.3px]">{f.title}</div>
              <p className="text-[#475569] leading-relaxed text-[15px]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-y py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="section-title mb-2">THREE STEPS</div>
            <div className="text-3xl font-semibold tracking-tight">From question to decision</div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { n: "01", title: "Search", desc: "Type any ticker or company name." },
              { n: "02", title: "Read", desc: "Get a crisp, scannable, executive-grade report." },
              { n: "03", title: "Decide", desc: "Export, save, or add to your ongoing watchlist." },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F172A] text-white font-semibold text-2xl mb-4">
                  {step.n}
                </div>
                <div className="text-xl font-semibold tracking-tight mb-2">{step.title}</div>
                <p className="text-[#475569] text-[15px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-[#0EA5E9] text-xs font-semibold tracking-[2px] mb-2">PRICING</div>
          <div className="text-4xl font-semibold tracking-[-1.5px]">Simple. Transparent. Powerful.</div>
          <p className="text-[#475569] mt-3">Start free. Upgrade when you need the full power.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="card p-8">
            <div className="font-semibold text-xl">Starter</div>
            <div className="mt-2 mb-6">
              <span className="text-5xl font-semibold tracking-tighter">$0</span>
              <span className="text-[#64748B]">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> 3 reports per month</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Core financials &amp; charts</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> News feed</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> PDF export</li>
            </ul>
            <button onClick={() => { setShowApp(true); }} className="btn-secondary w-full py-3 text-sm">Start Free</button>
          </div>

          {/* Pro - Recommended */}
          <div className="card p-8 border-[#0F172A] relative overflow-hidden">
            <div className="absolute top-6 right-6 badge-pro">RECOMMENDED</div>
            <div className="font-semibold text-xl">Professional</div>
            <div className="mt-2 mb-6">
              <span className="text-5xl font-semibold tracking-tighter">$49</span>
              <span className="text-[#64748B]">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Unlimited reports</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Full risk analysis &amp; valuation models</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Watchlists &amp; saved briefs</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Priority data refresh</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Email alerts (coming soon)</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Team sharing</li>
            </ul>
            <button onClick={upgradeToPro} className="btn-primary w-full py-3 text-sm">Start 14-day free trial</button>
            <div className="text-center text-[10px] text-[#64748B] mt-3">Cancel anytime. No credit card required to try.</div>
          </div>

          {/* Enterprise */}
          <div className="card p-8">
            <div className="font-semibold text-xl">Enterprise</div>
            <div className="mt-2 mb-6">
              <span className="text-5xl font-semibold tracking-tighter">Custom</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Everything in Professional</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Dedicated data sources &amp; API access</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> White-glove onboarding</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> SSO &amp; advanced permissions</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Bulk report generation</li>
              <li className="flex gap-2"><Check className="w-4 h-4 mt-px text-[#10B981]" /> Custom integrations</li>
            </ul>
            <button onClick={() => window.open('mailto:enterprise@aether.finance?subject=Enterprise%20inquiry', '_blank')} className="btn-secondary w-full py-3 text-sm">Contact sales</button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-[#0F172A] text-white py-16">
        <div className="max-w-xl mx-auto text-center px-6">
          <div className="text-3xl font-semibold tracking-tight mb-3">Ready to stop wasting time on research?</div>
          <p className="text-white/60 mb-8">Join executives who make faster, better-informed capital decisions.</p>
          <button 
            onClick={() => { setShowApp(true); window.scrollTo({ top: 420, behavior: 'smooth' }); }} 
            className="btn-accent px-8 py-3.5 text-base inline-flex items-center gap-2"
          >
            Generate your first report <ArrowRight className="w-4 h-4" />
          </button>
          <div className="text-xs text-white/50 mt-4">No account required to try. Real data, real reports.</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-y-2 justify-between">
          <div>© {new Date().getFullYear()} Aether Research. For informational purposes only. Not investment advice.</div>
          <div className="flex gap-5">
            <span>Data sourced from public market feeds</span>
            <button onClick={() => setShowPricing(true)}>Pricing</button>
            <a href="#features">Features</a>
          </div>
        </div>
      </footer>

      {/* Simple Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowAuth(false)}>
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="modal w-full max-w-[380px] p-8"
            >
              <div className="text-2xl font-semibold tracking-tight mb-1">Welcome to Aether</div>
              <p className="text-[#475569] text-sm mb-7">Sign in to save reports and unlock Pro features.</p>

              <input 
                type="email" 
                placeholder="you@company.com" 
                className="input mb-4" 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />

              <button onClick={handleAuth} className="btn-primary w-full py-3 mb-3">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center text-sm">
                {authMode === 'login' ? (
                  <>Don&apos;t have an account? <button className="underline" onClick={() => setAuthMode('signup')}>Sign up</button></>
                ) : (
                  <>Already have access? <button className="underline" onClick={() => setAuthMode('login')}>Sign in</button></>
                )}
              </div>

              <div className="text-[11px] text-center text-[#94A3B8] mt-6">Demo mode — any email works.</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing modal trigger from nav */}
      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6" onClick={() => setShowPricing(false)}>
            <div onClick={e => e.stopPropagation()} className="max-w-3xl w-full">
              {/* reuse pricing content */}
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <div className="flex justify-between mb-6">
                  <div className="font-semibold text-2xl">Choose your plan</div>
                  <button onClick={() => setShowPricing(false)} className="text-[#64748B]">Close</button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-[#E2E8F0] p-6 rounded-2xl">
                    <div>Starter — Free</div>
                    <div className="text-sm text-[#64748B] mt-1">Limited to 3 reports/mo</div>
                    <button onClick={() => { setShowPricing(false); setShowApp(true); }} className="mt-6 w-full btn-secondary text-sm py-2">Use Free</button>
                  </div>
                  <div className="border border-[#0F172A] p-6 rounded-2xl relative">
                    <div className="badge-pro absolute -top-2 right-4">MOST POPULAR</div>
                    <div>Professional — $49/mo</div>
                    <div className="text-sm text-[#64748B] mt-1">Unlimited + watchlists + exports</div>
                    <button onClick={upgradeToPro} className="mt-6 w-full btn-primary text-sm py-2">Start Pro Trial</button>
                  </div>
                  <div className="border border-[#E2E8F0] p-6 rounded-2xl">
                    <div>Enterprise</div>
                    <div className="text-sm text-[#64748B] mt-1">Custom pricing and onboarding</div>
                    <button onClick={() => window.open('mailto:enterprise@aether.finance', '_blank')} className="mt-6 w-full btn-secondary text-sm py-2">Talk to Sales</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
