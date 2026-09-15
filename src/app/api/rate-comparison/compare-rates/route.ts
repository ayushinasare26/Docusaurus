import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Proxy multipart file upload to Express compare-rates endpoint
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const formData = await request.formData();

    const res = await fetch(`${backendUrl}/api/rate-comparison/compare-rates`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[rate-comparison/compare-rates] error:', err);
    return NextResponse.json({ error: 'Failed to run rate comparison' }, { status: 500 });
  }
}
