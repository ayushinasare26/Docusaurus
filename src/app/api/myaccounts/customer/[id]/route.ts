import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`--- [Proxy] /api/myaccounts/customer/${id} called ---`);

  // Prepare headers to forward
  const headers = new Headers();

  // Forward required headers
  const requiredHeaders = [
    'x-shared-api-key',
    'x-timestamp',
    'x-signature',
    'content-type'
  ];

  requiredHeaders.forEach((h) => {
    const value = request.headers.get(h);
    if (value) {
      headers.set(h, value);
    }
  });

  // Backend URL
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error('❌ BACKEND_URL is not defined');
    return NextResponse.json(
      { error: 'Backend URL not configured' },
      { status: 500 }
    );
  }

  const url = `${backendUrl}/api/myaccounts/customer/${id}`;

  console.log('Forwarding request to backend:', url);
  
  let backendResponse;

  try {
    backendResponse = await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch (error) {
    console.error('❌ Error while calling backend:', error);
    return NextResponse.json(
      { error: 'Failed to reach backend service' },
      { status: 500 }
    );
  }

  console.log('Backend response status:', backendResponse.status);

  // If backend returns JSON
  const contentType = backendResponse.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  }

  // If backend returns text or something else
  const textData = await backendResponse.text();
  return new NextResponse(textData, {
    status: backendResponse.status,
    headers: {
      'Content-Type': contentType || 'text/plain',
    }
  });
}
