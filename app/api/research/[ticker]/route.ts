import { NextRequest, NextResponse } from 'next/server';
import { fetchResearchReport } from '@/lib/research';

export const runtime = 'edge'; // fast edge runtime

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!ticker || ticker.length < 1 || ticker.length > 12) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
  }

  try {
    // Basic rate limit (in-memory for demo; use Upstash/Redis in prod)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // For demo, simple per-IP throttle comment
    const report = await fetchResearchReport(ticker);
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('Research fetch failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
