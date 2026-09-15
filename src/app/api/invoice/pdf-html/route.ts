import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import fs from 'fs'
import path from 'path'
import React from 'react'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const invoiceNo = sp.get('invoiceNo')
    const custid = sp.get('custid')
    const filenameParam = sp.get('filename')
    console.log(invoiceNo, custid)
    if (!invoiceNo || !custid) {
      return NextResponse.json({ error: 'Invoice number and customer ID are required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    // Fetch invoice data
    const res = await fetch(
      `${backendUrl}/api/invoice/by-number?invoiceno=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const invoiceData = await res.json()

    let logoBase64 = ''
    try {
      const pngPaths = [
        path.join(process.cwd(), 'public', 'images', 'logo.png'),
        path.join(process.cwd(), 'public', 'images', 'logo', 'Pinevox-cropped.svg'),
      ]
      for (const p of pngPaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p)
          const ext = p.endsWith('.png') ? 'png' : 'svg+xml'
          if (ext === 'png') {
            logoBase64 = `data:image/png;base64,${buf.toString('base64')}`
          }
          break
        }
      }
    } catch (err) {
      console.error('Logo loading error:', err)
    }

    let cdrs: any[] = []
    if (invoiceData?.invoicedate) {
      const invDate = new Date(invoiceData.invoicedate)
      const billingDate = new Date(invDate.getFullYear(), invDate.getMonth() - 1, 1)
      const cdrMonth = String(billingDate.getMonth() + 1)
      const cdrYear = String(billingDate.getFullYear())
      console.log(`Invoice date: ${invoiceData.invoicedate}, Fetching CDRs for: ${cdrYear}-${cdrMonth}`)
      try {
        const cdrRes = await fetch(
          `${backendUrl}/api/fetchCdr/cdrs?custid=${encodeURIComponent(custid)}&month=${encodeURIComponent(cdrMonth)}&year=${encodeURIComponent(cdrYear)}`,
          { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }
        )
        if (cdrRes.ok) {
          const cdrData = await cdrRes.json()
          cdrs = Array.isArray(cdrData?.cdrs) ? cdrData.cdrs :
            Array.isArray(cdrData?.data) ? cdrData.data :
              Array.isArray(cdrData) ? cdrData : []
          console.log(`Fetched ${cdrs.length} CDRs`)
        }
      } catch (err) {
        console.error('CDR fetch error:', err)
      }
    }

    const env = {
      invoiceEmail: 'billing@pinevox.com',
      invoiceVat: '985207886',
      invoiceBankName:'Barclays Bank',
      invoiceBankSort: '203721',
      invoiceBankAcc: '83788164',
      invoicePayee: 'Pioneer Global Services Ltd',
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoiceData, cdrs, logoBase64, env }) as any
    )

    // Build filename
    const sanitizeFilename = (value: string) => {
      const trimmed = String(value || '').replace(/[\r\n]/g, '').trim()
      if (!trimmed) return ''
      const safe = trimmed.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
      if (!safe) return ''
      return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`
    }
    const customFilename = filenameParam ? sanitizeFilename(filenameParam) : ''
    const fallbackFilename = `Invoice-${invoiceNo}-${custid}.pdf`
    const finalFilename = customFilename || fallbackFilename

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${finalFilename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('Error generating PDF:', err)
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
