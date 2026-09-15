import { NextRequest } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 7200; // 2 hours for long-running invoice processing (~1 hour typical)

// SSE proxy — streams Express process-month events to the browser
export async function GET(request: NextRequest) {
  // Authenticate
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const tblname = searchParams.get('tblname');

  if (!tblname) {
    return new Response(JSON.stringify({ error: 'tblname is required' }), { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const upstreamUrl = `${backendUrl}/api/invoice/process-month?tblname=${encodeURIComponent(tblname)}`;

  try {
    const upstream = await fetch(upstreamUrl);

    if (!upstream.ok || !upstream.body) {
      return new Response('Backend error', { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (err) {
    console.error('[process-month proxy] error:', err);
    return new Response('Failed to connect to backend', { status: 502 });
  }
}
