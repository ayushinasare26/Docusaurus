import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invoiceNo = searchParams.get('invoiceNo');
  const custid = searchParams.get('custid');

  if (!invoiceNo || !custid) {
    return NextResponse.json({ error: 'invoiceNo and custid are required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const upstream = await fetch(
      `${backendUrl}/api/invoice/send-email?invoiceNo=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}`,
      { method: 'POST' }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[send-email proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
