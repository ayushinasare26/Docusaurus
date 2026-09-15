import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const tokenPayload = await getVerifiedToken()
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'month is required' }, { status: 400 })

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const upstream = await fetch(`${backendUrl}/api/invoice/download-manual-all?month=${encodeURIComponent(month)}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      let errMessage = `Backend responded with status: ${upstream.status}`
      try {
        const data = await upstream.json()
        if (data?.error) errMessage = data.error
      } catch {}
      return NextResponse.json({ error: errMessage }, { status: upstream.status })
    }

    const zipBuffer = Buffer.from(await upstream.arrayBuffer())
    const disposition = upstream.headers.get('content-disposition') || `attachment; filename="manual-invoices-${month}.zip"`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': disposition,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[manual-invoices download-all proxy] error:', err)
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 })
  }
}
