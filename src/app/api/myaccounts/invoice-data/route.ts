import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Please use a POST request in Postman with the required body parameters.' },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  console.log('--- [Proxy] /api/myaccounts/invoice-data called ---');

  // Read raw body (important for HMAC)
  const body = await request.text();

  console.log('Incoming headers:', Object.fromEntries(request.headers.entries()));
  console.log('Incoming body:', body);

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

  //  TEMP DEBUG (helps confirm headers)
  if (!headers.get('x-shared-api-key')) {
    console.warn('⚠️ Missing x-shared-api-key header');
  }

  // Backend URL
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error('❌ BACKEND_URL is not defined');
    return NextResponse.json(
      { error: 'Backend URL not configured' },
      { status: 500 }
    );
  }

  const url = `${backendUrl}/api/myaccounts/invoice/invoice-data`;

  console.log('Forwarding request to backend:', url);
  console.log('Forwarded headers:', Object.fromEntries(headers.entries()));

  let backendResponse;

  try {
    backendResponse = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
  } catch (error) {
    console.error('❌ Error while calling backend:', error);
    return NextResponse.json(
      { error: 'Failed to reach backend service' },
      { status: 500 }
    );
  }

  console.log('Backend response status:', backendResponse.status);

  const contentType = backendResponse.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await backendResponse.json();
    console.log('Backend JSON response received.');
    return NextResponse.json(data, { status: backendResponse.status });
  }

  // If the backend returns something else
  const textData = await backendResponse.text();
  return new NextResponse(textData, {
    status: backendResponse.status,
    headers: {
      'Content-Type': contentType || 'text/plain',
    },
  });
}