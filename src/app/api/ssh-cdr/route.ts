import { NextRequest } from 'next/server';
import { getVerifiedToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 1800; // 30 minutes for long-running CDR operations

// SSE proxy — delegates to the real Express implementation which handles
// SSH connection, CDR file download, MySQL inserts, table creation etc.
export async function GET(request: NextRequest) {
  // Authenticate
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const upstreamUrl = `${backendUrl}/api/ssh-cdr${qs ? '?' + qs : ''}`;

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
    console.error('[ssh-cdr proxy] error:', err);
    return new Response('Failed to connect to backend', { status: 502 });
  }
}
