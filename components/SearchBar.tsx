'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface Props {
  onSelect: (ticker: string) => void;
  loading?: boolean;
  placeholder?: string;
  size?: 'large' | 'default';
}

export default function SearchBar({ onSelect, loading, placeholder = "Search company or ticker (e.g. AAPL, TSLA, NVDA)", size = 'large' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.results || []);
        setOpen(true);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(symbol);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= 1) {
        handleSelect(query.trim().toUpperCase());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[selectedIndex].symbol);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-[620px]">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input pl-20! pr-12 font-medium ${size === 'large' ? 'h-[60px] text-[17px]' : 'h-12 text-[15px]'}`}
          disabled={loading}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden">
          {results.map((r, idx) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol)}
              className={`w-full text-left px-5 py-[13px] flex justify-between items-center hover:bg-[#F8FAFC] transition ${idx === selectedIndex ? 'bg-[#F8FAFC]' : ''}`}
            >
              <div>
                <span className="font-semibold text-[#0F172A]">{r.symbol}</span>
                <span className="ml-3 text-[#475569]">{r.name}</span>
              </div>
              <div className="text-xs text-[#64748B] font-medium tracking-wide">{r.exchange}</div>
            </button>
          ))}
          <div className="px-5 py-2 text-[11px] text-[#94A3B8] border-t bg-[#FAFBFC]">
            Press Enter to search directly
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute right-5 top-4 text-xs text-[#0EA5E9] font-medium">Generating report...</div>
      )}
    </div>
  );
}
