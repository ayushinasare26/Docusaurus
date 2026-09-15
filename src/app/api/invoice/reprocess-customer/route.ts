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
  const invoiceno = searchParams.get('invoiceno');
  const invoicedate = searchParams.get('invoicedate');
  const mode = searchParams.get('mode') || 'all';

  const hasInvoiceKeys = Boolean(invoiceno && invoicedate);
  const hasLegacyKeys = Boolean(tblname && custid);
  if (!hasInvoiceKeys && !hasLegacyKeys) {
    return NextResponse.json(
      { error: 'Either invoiceno+invoicedate or tblname+custid are required' },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const qp = new URLSearchParams({ mode });
    if (tblname) qp.set('tblname', tblname);
    if (custid) qp.set('custid', custid);
    if (invoiceno) qp.set('invoiceno', invoiceno);
    if (invoicedate) qp.set('invoicedate', invoicedate);
    const upstream = await fetch(
      `${backendUrl}/api/invoice/reprocess-customer?${qp.toString()}`,
      { method: 'POST' }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[reprocess-customer proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
