import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/rate-comparison/latest-results`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[rate-comparison/latest-results] error:', err);
    return NextResponse.json({ error: 'Failed to fetch latest results' }, { status: 500 });
  }
}
