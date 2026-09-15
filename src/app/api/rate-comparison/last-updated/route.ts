import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/rate-comparison/last-updated`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[rate-comparison/last-updated] error:', err);
    return NextResponse.json({ error: 'Failed to fetch last updated' }, { status: 500 });
  }
}
