import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const body = await request.json();
    const upstream = await fetch(`${backendUrl}/api/invoice/process-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[process-bulk proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
