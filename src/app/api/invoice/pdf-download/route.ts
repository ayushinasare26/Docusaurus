import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import { InvoicePDF } from '../pdf-html/InvoicePDF'
import fs from 'fs'
import path from 'path'
import React from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ZIP_BATCH_SIZE = 500

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const log = (stage: string, extra: Record<string, unknown> = {}) => {
    const mu = process.memoryUsage()
    console.log(`[invoice-zip] ${stage}`, {
      ...extra,
      elapsedMs: Date.now() - startedAt,
      rssMB: Number((mu.rss / 1024 / 1024).toFixed(1)),
      heapUsedMB: Number((mu.heapUsed / 1024 / 1024).toFixed(1)),
      heapTotalMB: Number((mu.heapTotal / 1024 / 1024).toFixed(1)),
      externalMB: Number((mu.external / 1024 / 1024).toFixed(1)),
      arrayBuffersMB: Number(((mu.arrayBuffers || 0) / 1024 / 1024).toFixed(1)),
    })
  }

  try {
    const sp = request.nextUrl.searchParams
    const invoiceNo = sp.get('invoiceNo')
    const custid = sp.get('custid')
    const filenameParam = sp.get('filename')
    log('request-start', { invoiceNo, custid, filenameParam })

    if (!invoiceNo || !custid) {
      return NextResponse.json({ error: 'Invoice number and customer ID are required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const invoiceRes = await fetch(
      `${backendUrl}/api/invoice/by-number?invoiceno=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}`,
      { cache: 'no-store' }
    )
    if (!invoiceRes.ok) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const invoiceData = await invoiceRes.json()
    log('invoice-data-loaded', {
      invoiceDate: invoiceData?.invoicedate,
      invoiceKeys: Object.keys(invoiceData || {}).length,
    })

    let logoBase64 = ''
    try {
      const pngPaths = [
        path.join(process.cwd(), 'public', 'images', 'logo.png'),
        path.join(process.cwd(), 'public', 'images', 'logo', 'Pinevox-cropped.svg'),
      ]
      for (const p of pngPaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p)
          if (p.endsWith('.png')) logoBase64 = `data:image/png;base64,${buf.toString('base64')}`
          break
        }
      }
    } catch (err) {
      console.error('[invoice-zip] logo-load-error', err)
    }

    let cdrs: any[] = []
    if (invoiceData?.invoicedate) {
      const invDate = new Date(invoiceData.invoicedate)
      const billingDate = new Date(invDate.getFullYear(), invDate.getMonth() - 1, 1)
      const cdrMonth = String(billingDate.getMonth() + 1)
      const cdrYear = String(billingDate.getFullYear())
      log('cdr-fetch-start', { cdrMonthYear: `${cdrYear}-${cdrMonth}` })
      const cdrRes = await fetch(
        `${backendUrl}/api/fetchCdr/cdrs?custid=${encodeURIComponent(custid)}&month=${encodeURIComponent(cdrMonth)}&year=${encodeURIComponent(cdrYear)}`,
        { cache: 'no-store' }
      )
      if (cdrRes.ok) {
        const cdrData = await cdrRes.json()
        cdrs = Array.isArray(cdrData?.cdrs) ? cdrData.cdrs : Array.isArray(cdrData?.data) ? cdrData.data : Array.isArray(cdrData) ? cdrData : []
      }
      log('cdr-fetch-complete', { cdrCount: cdrs.length })
    }

    const env = {
      invoiceEmail: 'billing@pinevox.com',
      invoiceVat: '985207886',
      invoiceBankName: 'Barclays Bank',
      invoiceBankSort: '203721',
      invoiceBankAcc: '83788164',
      invoicePayee: 'Pioneer Global Services Ltd',
    }

    const batchCount = Math.max(Math.ceil(cdrs.length / ZIP_BATCH_SIZE), 1)
    log('batch-plan', { batchSize: ZIP_BATCH_SIZE, batchCount, cdrCount: cdrs.length })

    const zipNameBase = filenameParam
      ? String(filenameParam).replace(/[\r\n]/g, '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
      : `Invoice-${invoiceNo}-${custid}`
    const finalPdfName = `${zipNameBase}.pdf`
    const masterPdf = await PDFDocument.create()

    const totalBatches = batchCount
    for (let i = 0; i < totalBatches; i++) {
      let chunkBatch = cdrs.splice(0, ZIP_BATCH_SIZE)
      log('batch-render-start', { batchIndex: i + 1, totalBatches, batchRows: chunkBatch.length, includeSummary: i === 0 })
      let chunkBuffer = await renderToBuffer(
        React.createElement(InvoicePDF, {
          invoiceData,
          cdrs: chunkBatch,
          logoBase64,
          includeSummary: i === 0,
          env,
        }) as any
      )
      log('batch-render-complete', { batchIndex: i + 1, totalBatches, batchRows: chunkBatch.length, pdfBytes: chunkBuffer.length })

      let chunkPdf = await PDFDocument.load(chunkBuffer, { ignoreEncryption: true })
      const copiedPages = await masterPdf.copyPages(chunkPdf, chunkPdf.getPageIndices())
      copiedPages.forEach((page) => masterPdf.addPage(page))
      log('batch-pages-merged', { batchIndex: i + 1, totalBatches, batchRows: chunkBatch.length, pages: copiedPages.length })

      chunkBatch = null as unknown as typeof chunkBatch
      chunkBuffer = null as unknown as typeof chunkBuffer
      chunkPdf = null as unknown as typeof chunkPdf
      await new Promise(resolve => setTimeout(resolve, 100))
      if (global && typeof global.gc === 'function') {
        global.gc()
      }
      log('batch-yield-complete', { batchIndex: i + 1, totalBatches })
    }

    const finalPdfBytes = await masterPdf.save()
    log('final-pdf-ready', { pdfBytes: finalPdfBytes.length, batchCount: totalBatches })

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalPdfName}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[invoice-zip] failed', err)
    return NextResponse.json(
      {
        error: 'Failed to generate invoice zip',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
