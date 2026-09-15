import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { getVerifiedToken } from '@/lib/auth'
import { renderManualInvoiceHTML } from './template'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken()
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const invoiceNo = sp.get('invoiceNo')
    const custid = sp.get('custid')
    const filenameParam = sp.get('filename')

    if (!invoiceNo || !custid) {
      return NextResponse.json({ error: 'invoiceNo and custid are required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const dataRes = await fetch(
      `${backendUrl}/api/manual-invoices/by-number?invoiceNo=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}`,
      {
        headers: { cookie: request.headers.get('cookie') || '' },
        cache: 'no-store',
      }
    )

    if (!dataRes.ok) {
      const errorBody = await dataRes.text()
      return NextResponse.json(
        { error: errorBody || 'Manual invoice not found' },
        { status: dataRes.status }
      )
    }

    const payload = await dataRes.json()
    const invoiceData = payload.invoiceData
    const items = Array.isArray(payload.items) ? payload.items : []

    let logoBase64 = ''
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Pinevox.svg')
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`
      }
    } catch (err) {
      console.error('Logo loading error:', err)
    }

    const html = renderManualInvoiceHTML({ ...invoiceData, items }, logoBase64)

    const isWindows = process.platform === 'win32'

    if (!process.env.PUPPETEER_CACHE_DIR) {
      process.env.PUPPETEER_CACHE_DIR = isWindows
        ? path.join(process.cwd(), '.cache', 'puppeteer')
        : '/tmp/.cache/puppeteer'
    }

    const possibleExecutables = [
      process.env.PUPPETEER_EXEC_PATH,
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ].filter(Boolean)

    let executablePath: string | undefined
    for (const p of possibleExecutables) {
      try {
        if (p && fs.existsSync(p)) {
          executablePath = p
          break
        }
      } catch {
        // ignore
      }
    }

    const launchOptions: any = {
      headless: true,
      timeout: 120000,
      protocolTimeout: 120000,
      args: isWindows ? ['--disable-gpu'] : ['--no-sandbox', '--disable-setuid-sandbox'],
    }
    if (executablePath) launchOptions.executablePath = executablePath
    if (!executablePath && isWindows) launchOptions.channel = 'chrome'

    const browser = await puppeteer.launch(launchOptions)
    try {
      const page = await browser.newPage()

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })

      const sanitizeFilename = (value: string) => {
        const trimmed = String(value || '').replace(/[\r\n]/g, '').trim()
        if (!trimmed) return ''
        const safe = trimmed.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
        if (!safe) return ''
        return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`
      }

      const customFilename = filenameParam ? sanitizeFilename(filenameParam) : ''
      const fallbackFilename = `Manual-Invoice-${invoiceNo}-${custid}.pdf`
      const finalFilename = customFilename || fallbackFilename
      const titleForPdf = finalFilename.replace(/\.pdf$/i, '')

      try {
        await page.evaluate((title: string) => {
          if (!title) return
          document.title = title
          let meta = document.querySelector('meta[name="title"]') as HTMLMetaElement | null
          if (!meta) {
            meta = document.createElement('meta')
            meta.setAttribute('name', 'title')
            document.head.appendChild(meta)
          }
          meta.setAttribute('content', title)
        }, titleForPdf)
      } catch {
        // ignore title injection failures
      }

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm',
        },
      })

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${finalFilename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error('Error generating manual invoice PDF:', err)
    return NextResponse.json({
      error: 'Failed to generate manual invoice PDF',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
