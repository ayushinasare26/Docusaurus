import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const body = await request.json().catch(() => ({}));

    const upstream = await fetch(
      `${backendUrl}/api/invoice/send-email-month?month=${encodeURIComponent(month)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[send-email-month proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
