import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tblname = searchParams.get('tblname');
  const custid = searchParams.get('custid');
  const invoiceno = searchParams.get('invoiceno');

  if (!tblname || !custid || !invoiceno) {
    return NextResponse.json({ error: 'tblname, custid and invoiceno are required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const qp = new URLSearchParams({ tblname, custid, invoiceno });

    const upstream = await fetch(
      `${backendUrl}/api/invoice/delete-customer-invoice?${qp.toString()}`,
      { method: 'DELETE' }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[delete-customer-invoice proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
