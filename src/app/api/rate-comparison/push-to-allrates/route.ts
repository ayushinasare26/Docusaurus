import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/rate-comparison/push-to-allrates`, {
      method: 'POST',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[rate-comparison/push-to-allrates] error:', err);
    return NextResponse.json({ error: 'Failed to push rates to allrates' }, { status: 500 });
  }
}
