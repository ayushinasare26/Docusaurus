import { NextRequest, NextResponse } from 'next/server';

const BACKEND = () => process.env.BACKEND_URL || 'http://localhost:8000';

// Catch-all proxy: forwards GET and POST /api/gamma-ipdc/[...] to Express
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const { path } = await params;
    const qs = searchParams.toString();
    const url = `${BACKEND()}/api/gamma-ipdc/${path.join('/')}${qs ? '?' + qs : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[gamma-ipdc proxy GET] error:', err);
    return NextResponse.json({ error: 'Backend request failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const url = `${BACKEND()}/api/gamma-ipdc/${path.join('/')}`;
    const contentType = request.headers.get('content-type') || '';

    let body: BodyInit;
    let headers: HeadersInit = {};

    if (contentType.includes('multipart')) {
      body = await request.formData();
    } else {
      body = await request.text();
      headers = { 'Content-Type': contentType };
    }

    const res = await fetch(url, { method: 'POST', body, headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[gamma-ipdc proxy POST] error:', err);
    return NextResponse.json({ error: 'Backend request failed' }, { status: 500 });
  }
}
