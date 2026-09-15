import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { renderInvoiceHTML } from './template'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const invoiceNo = sp.get('invoiceNo')
    const custid = sp.get('custid')
    const resellerid = sp.get('resellerid')
    console.log(invoiceNo, custid, resellerid)
    if (!invoiceNo || !custid || !resellerid) {
      return NextResponse.json({ error: 'Invoice number, customer ID and reseller ID are required' }, { status: 400 })
    }

    // Call backend directly — avoids self-referencing through nginx on production
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    // Fetch invoice data
    const res = await fetch(`${backendUrl}/api/reseller/by-number?invoiceno=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}&resellerid=${encodeURIComponent(resellerid)}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoiceData = await res.json()

    // Fetch custom reseller settings
    let customSettings = null
    try {
      const settingsRes = await fetch(`${backendUrl}/api/reseller/custom-settings/${encodeURIComponent(resellerid)}`, {
        cache: 'no-store',
      })
      if (settingsRes.ok) {
        customSettings = await settingsRes.json()
      }
    } catch (err) {
      console.error('Error fetching custom settings for PDF:', err)
    }

    // Load logo as base64
    let logoBase64 = customSettings?.logo || ''
    if (!logoBase64) {
      try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Pinevox.svg')
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath)
          logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`
        }
      } catch (err) {
        console.error('Logo loading error:', err)
      }
    }

    // Load incoming/outgoing icons
    let incomingIconBase64 = ''
    let outgoingIconBase64 = ''
    try {
      const incomingPath = path.join(process.cwd(), 'public', 'images', 'icons', 'incoming.svg')
      const outgoingPath = path.join(process.cwd(), 'public', 'images', 'icons', 'outgoing.svg')
      if (fs.existsSync(incomingPath)) {
        const buffer = fs.readFileSync(incomingPath)
        incomingIconBase64 = `data:image/svg+xml;base64,${buffer.toString('base64')}`
      }
      if (fs.existsSync(outgoingPath)) {
        const buffer = fs.readFileSync(outgoingPath)
        outgoingIconBase64 = `data:image/svg+xml;base64,${buffer.toString('base64')}`
      }
    } catch (err) {
      console.error('Icon loading error:', err)
    }

    // Fetch CDRs based on invoice date (previous month)
    let cdrs = []

    if (invoiceData?.invoicedate) {
      // Parse invoice date and calculate previous month
      const invDate = new Date(invoiceData.invoicedate)
      const billingDate = new Date(invDate.getFullYear(), invDate.getMonth() - 1, 1)
      const cdrMonth = String(billingDate.getMonth() + 1)
      const cdrYear = String(billingDate.getFullYear())

      console.log(`Invoice date: ${invoiceData.invoicedate}, Fetching CDRs for: ${cdrYear}-${cdrMonth}`)

      try {
        const cdrRes = await fetch(`${backendUrl}/api/fetchCdr/cdrs?custid=${encodeURIComponent(custid)}&month=${encodeURIComponent(cdrMonth)}&year=${encodeURIComponent(cdrYear)}`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
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

    // Generate HTML
    const html = renderInvoiceHTML(invoiceData, cdrs, logoBase64, incomingIconBase64, outgoingIconBase64, customSettings)

    process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/.cache/puppeteer'

    const possibleExecutables = [
      process.env.PUPPETEER_EXEC_PATH,
      process.env.CHROME_PATH,
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ].filter(Boolean)

    let executablePath: string | undefined
    for (const p of possibleExecutables) {
      try {
        if (p && fs.existsSync(p)) { executablePath = p; break }
      } catch (e) {
        // ignore
      }
    }

    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-crash-reporter',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        `--homedir=/tmp`,
        `--disk-cache-dir=/tmp/.cache/chrome`,
        `--user-data-dir=/tmp/.chrome-user-data`,
      ]
    }
    if (executablePath) launchOptions.executablePath = executablePath

    const browser = await puppeteer.launch(launchOptions)

    try {
      const page = await browser.newPage()

      // Set content with longer timeout and don't wait for network idle since we use base64 images
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="
            width: 100%;
            font-size: 9pt;
            padding: 0 10mm;
            color: #000;
            font-weight: bold;
            display: flex;
            justify-content: flex-end;
          ">
            <span> <span class="pageNumber"></span></span>
          </div>
        `,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
        }
      })

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="Invoice-${invoiceNo}-${custid}.pdf"`,
          'Cache-Control': 'no-cache',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error('Error generating PDF:', err)
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
