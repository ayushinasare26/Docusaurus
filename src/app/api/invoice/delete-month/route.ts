import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  // Authenticate
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const tblname = searchParams.get('tblname');

  if (!tblname) {
    return NextResponse.json({ error: 'tblname is required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const upstream = await fetch(
      `${backendUrl}/api/invoice/delete-month?tblname=${encodeURIComponent(tblname)}`,
      { method: 'DELETE' }
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[delete-month proxy] error:', err);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}
