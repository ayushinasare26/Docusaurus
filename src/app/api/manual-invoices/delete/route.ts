import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
  const tokenPayload = await getVerifiedToken()
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const miid = searchParams.get('miid')
  if (!miid) return NextResponse.json({ error: 'miid is required' }, { status: 400 })

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const upstream = await fetch(`${backendUrl}/api/manual-invoices/delete?miid=${encodeURIComponent(miid)}`, {
      method: 'DELETE',
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
    })

    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    })
  } catch (err: any) {
    console.error('Error deleting manual invoice proxy:', err)
    return NextResponse.json({ error: err?.message || 'Failed to delete manual invoice' }, { status: 500 })
  }
}
