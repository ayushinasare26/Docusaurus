import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tblname = searchParams.get('tblname');
  const custid = searchParams.get('custid');

  if (!tblname || !custid) {
    return NextResponse.json({ error: 'tblname and custid are required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const upstream = await fetch(
      `${backendUrl}/api/invoice/process-customer?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(custid)}`,
      { method: 'POST' }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[process-customer proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
