import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/mysql';
import { renderReportHTML } from './template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get('type');
    const monthYear = sp.get('month'); // e.g. "2024-01"

    if (!type || !monthYear) {
      return NextResponse.json({ error: 'Report type and month are required' }, { status: 400 });
    }

    // Load Logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.error('Logo loading error:', err);
    }

    // Format month name for display
    const dateObj = new Date(`${monthYear}-01T00:00:00Z`);
    const displayMonthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let reportData: any[] = [];

    if (type === 'NORMAL') {
      const sql = `
        SELECT c.custid, c.custname, c.ddtrefno, i.invoiceno, DATE_FORMAT(i.invoicedate, '%Y-%m-%d') as invoicedate, i.prevbal, i.paymentreceived, i.total 
        FROM customer c
        JOIN invoices i ON c.custid = i.custid 
        WHERE (c.isSuspended = 0 OR c.isSuspended IS NULL)
        AND (c.joindate IS NULL OR DATE_FORMAT(c.joindate, '%Y-%m') <= ?)
        AND DATE_FORMAT(DATE_ADD(i.invoicedate, INTERVAL -1 MONTH), '%Y-%m') = ? 
        ORDER BY i.custid ASC, i.invoicedate DESC
      `;
      reportData = (await query(sql, [monthYear, monthYear])) as any[];
    } else if (type === 'DDTREP') {
      const sql = `
        SELECT c.custid, c.ddtrefno, c.custname, DATE_FORMAT(i.invoicedate, '%Y-%m-%d') as invoicedate, i.total 
        FROM customer c
        JOIN invoices i ON c.custid = i.custid 
        WHERE (c.isSuspended = 0 OR c.isSuspended IS NULL) AND c.ddtrefno <> 0 
        AND (c.joindate IS NULL OR DATE_FORMAT(c.joindate, '%Y-%m') <= ?)
        AND DATE_FORMAT(DATE_ADD(i.invoicedate, INTERVAL -1 MONTH), '%Y-%m') = ?
        ORDER BY c.custid ASC
      `;
      reportData = (await query(sql, [monthYear, monthYear])) as any[];
    } else if (type === 'NONDDTREP') {
      const sql = `
        SELECT c.custid, c.ddtrefno, c.custname, DATE_FORMAT(i.invoicedate, '%Y-%m-%d') as invoicedate, i.total 
        FROM customer c
        JOIN invoices i ON c.custid = i.custid 
        WHERE (c.isSuspended = 0 OR c.isSuspended IS NULL) AND (c.ddtrefno = 0 OR c.ddtrefno IS NULL OR c.ddtrefno = '')
        AND (c.joindate IS NULL OR DATE_FORMAT(c.joindate, '%Y-%m') <= ?)
        AND DATE_FORMAT(DATE_ADD(i.invoicedate, INTERVAL -1 MONTH), '%Y-%m') = ?
        ORDER BY c.custid ASC
      `;
      reportData = (await query(sql, [monthYear, monthYear])) as any[];
    } else if (type === 'MONTHLYREP') {
      const sql = `
        SELECT c.custid, c.custname, c.ddtrefno, i.invoiceno, DATE_FORMAT(i.invoicedate, '%Y-%m-%d') as invoicedate, 
               i.prevbal, i.paymentreceived, i.usagecharges, i.oneoffcharges, i.total, i.vat 
        FROM customer c
        JOIN invoices i ON c.custid = i.custid 

        WHERE (c.isSuspended = 0 OR c.isSuspended IS NULL)
        AND (c.joindate IS NULL OR DATE_FORMAT(c.joindate, '%Y-%m') <= ?)
        AND DATE_FORMAT(DATE_ADD(i.invoicedate, INTERVAL -1 MONTH), '%Y-%m') = ? 
        AND c.custid <= 276120000 
        ORDER BY i.custid ASC, i.invoicedate DESC
      `;
      const invoices = (await query(sql, [monthYear, monthYear])) as any[];

      // Now fetch invoicedetails for all these invoices
      // We will batch fetch or fetch individually if it's not too many. For simplicity and robustness, fetch all details for these invoices.
      if (invoices.length > 0) {
        // Collect pairs
        const conditions = invoices.map(inv => `(custid = ${mysqlEscape(inv.custid)} AND invoiceno = ${mysqlEscape(inv.invoiceno)})`);
        // Batch query if less than 1000 pairs, else fetch in chunks or just join.
        // Assuming typical invoice counts per month, we can do an IN clause.
        let invoiceDetails: any[] = [];
        if (conditions.length > 0) {
          const detailSql = `SELECT * FROM invoicedetails WHERE section IN ('C','D','O') AND (${conditions.join(' OR ')})`;
          invoiceDetails = (await query(detailSql)) as any[];
        }

        reportData = invoices.map(inv => {
          const details = invoiceDetails.filter(d => d.custid == inv.custid && d.invoiceno == inv.invoiceno);
          details.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
          let nMonthlyRentalTotal = 0;
          let nOneOffCharges = 0;

          details.forEach(d => {
            if (d.section === 'C') {
              nMonthlyRentalTotal += Number(d.total);
            } else if (d.section === 'D') {
              // Emulate PHP empty() check for unitprice. PHP considers "0" empty, but "0.00" is NOT empty.
              const isUnitPriceEmpty = !d.unitprice || d.unitprice === '0' || d.unitprice === 0;
              if (isUnitPriceEmpty) {
                nMonthlyRentalTotal -= (nMonthlyRentalTotal * Number(d.quantity) / 100);
              } else {
                nMonthlyRentalTotal -= Number(d.unitprice);
              }
            } else if (d.section === 'O') {
              nOneOffCharges += (Number(d.unitprice) * Number(d.quantity));
            }
          });

          const nSubTotal = nMonthlyRentalTotal + Number(inv.usagecharges);
          const nCurrentChargesVat = (nSubTotal * Number(inv.vat)) / 100;
          const nCurrentChargesTotal = nSubTotal + nCurrentChargesVat;

          const nOneOffChargesVat = (nOneOffCharges * Number(inv.vat)) / 100;
          const nOneOffTotal = nOneOffCharges + nOneOffChargesVat;

          const nInvoiceTotal = nCurrentChargesTotal + nOneOffTotal;

          return {
            ...inv,
            monthlyRentalTotal: nMonthlyRentalTotal,
            currentChargesVat: nCurrentChargesVat,
            currentChargesTotal: nCurrentChargesTotal,
            oneOffCharges: nOneOffCharges,
            oneOffChargesVat: nOneOffChargesVat,
            oneOffTotal: nOneOffTotal,
            invoiceTotal: nInvoiceTotal
          };
        });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 });
    }

    const html = renderReportHTML(type, displayMonthYear, logoBase64, reportData);

    const isWindows = process.platform === 'win32';
    if (!process.env.PUPPETEER_CACHE_DIR) {
      process.env.PUPPETEER_CACHE_DIR = isWindows
        ? path.join(process.cwd(), '.cache', 'puppeteer')
        : '/tmp/.cache/puppeteer';
    }
    
    // Ensure cache dir exists
    if (!fs.existsSync(process.env.PUPPETEER_CACHE_DIR)) {
      fs.mkdirSync(process.env.PUPPETEER_CACHE_DIR, { recursive: true });
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
      '/usr/bin/brave',
    ].filter(Boolean)

    let executablePath: string | undefined
    for (const p of possibleExecutables) {
      try {
        if (p && fs.existsSync(p as string)) {
          executablePath = p as string
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

    const browser = await puppeteer.launch(launchOptions);
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Set viewport/media to print
      await page.emulateMediaType('print');
      
      const landscape = true; // All currently supported reports are landscape

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '50px',
          left: '20px',
        },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size: 8pt; width: 100%; display: flex; justify-content: space-between; color: #8f3634; border-top: 1px solid #ccc; padding-top: 5px; margin: 0 20px;">
            <div style="text-align: left;">Billing System Generated Internal Report</div>
            <div style="text-align: right;">Page No : <span class="pageNumber"></span></div>
          </div>
        `
      });

      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="Report_${type}_${monthYear}.pdf"`);

      return new NextResponse(Buffer.from(pdfBuffer), { status: 200, headers });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Simple escape function to prevent extremely basic sql injections in the dynamically constructed IN clause
function mysqlEscape(val: any) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    return "'" + val.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%":
          return "\\" + char; 
        default: return char;
      }
    }) + "'";
  }
  return "'" + val + "'";
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type;
    const months = body.months || []; // array of 'YYYY-MM'
    const customers = body.customers || []; // array of custid strings
    const includeCustTotal = body.includeCustTotal || false;
    const includePrevCharges = body.includePrevCharges || false;

    if (type !== 'MONTHLYCUSTREPORT' && type !== 'USAGEREPORTWITHCHART') {
      return NextResponse.json({ error: 'Only MONTHLYCUSTREPORT and USAGEREPORTWITHCHART are supported via POST' }, { status: 400 });
    }
    if (!months || months.length === 0) {
      return NextResponse.json({ error: 'At least one month is required' }, { status: 400 });
    }

    // Load Logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.error('Logo loading error:', err);
    }

    // Format month name for display
    let displayMonthYear = '';
    if (months.length === 1) {
      const dateObj = new Date(`${months[0]}-01T00:00:00Z`);
      displayMonthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      displayMonthYear = 'Multiple Months';
    }

    const monthsCondition = months.map((m: string) => mysqlEscape(m)).join(',');
    
    let custCondition = '';
    if (customers.length > 0) {
      const custStr = customers.map((c: string) => mysqlEscape(c)).join(',');
      custCondition = `AND c.custid IN (${custStr})`;
    }

    const latestMonth = months.reduce((max: string, current: string) => current > max ? current : max, months[0]);
    const latestMonthEscaped = mysqlEscape(latestMonth);

    const sql = `
      SELECT c.custid, c.custname, c.ddtrefno, i.invoiceno, DATE_FORMAT(i.invoicedate, '%Y-%m-%d') as invoicedate, 
             i.prevbal, i.paymentreceived, i.usagecharges, i.oneoffcharges, i.total, i.vat 
      FROM customer c
      JOIN invoices i ON c.custid = i.custid 
      WHERE DATE_FORMAT(DATE_ADD(i.invoicedate, INTERVAL -1 MONTH), '%Y-%m') IN (${monthsCondition})
      ${custCondition}
      AND (c.joindate IS NULL OR DATE_FORMAT(c.joindate, '%Y-%m') <= ${latestMonthEscaped})
      AND c.custid <= 276120000 
      ORDER BY i.custid ASC, i.invoicedate DESC
    `;

    const invoices = (await query(sql)) as any[];
    let reportData: any[] = [];

    if (invoices.length > 0) {
      const conditions = invoices.map(inv => `(custid = ${mysqlEscape(inv.custid)} AND invoiceno = ${mysqlEscape(inv.invoiceno)})`);
      let invoiceDetails: any[] = [];
      
      // Batch in chunks of 500 to avoid too long query
      const chunkSize = 500;
      for (let i = 0; i < conditions.length; i += chunkSize) {
        const chunk = conditions.slice(i, i + chunkSize);
        const detailSql = `SELECT * FROM invoicedetails WHERE section IN ('C','D','O') AND (${chunk.join(' OR ')})`;
        const res = (await query(detailSql)) as any[];
        invoiceDetails = invoiceDetails.concat(res);
      }

      reportData = invoices.map(inv => {
        const details = invoiceDetails.filter(d => d.custid == inv.custid && d.invoiceno == inv.invoiceno);
        details.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
        let nMonthlyRentalTotal = 0;
        let nOneOffCharges = 0;

        details.forEach(d => {
          if (d.section === 'C') {
            nMonthlyRentalTotal += Number(d.total);
          } else if (d.section === 'D') {
            const isUnitPriceEmpty = !d.unitprice || d.unitprice === '0' || d.unitprice === 0;
            if (isUnitPriceEmpty) {
              nMonthlyRentalTotal -= (nMonthlyRentalTotal * Number(d.quantity) / 100);
            } else {
              nMonthlyRentalTotal -= Number(d.unitprice);
            }
          } else if (d.section === 'O') {
            nOneOffCharges += (Number(d.unitprice) * Number(d.quantity));
          }
        });

        const nSubTotal = nMonthlyRentalTotal + Number(inv.usagecharges);
        const nCurrentChargesVat = (nSubTotal * Number(inv.vat)) / 100;
        const nCurrentChargesTotal = nSubTotal + nCurrentChargesVat;

        const nOneOffChargesVat = (nOneOffCharges * Number(inv.vat)) / 100;
        const nOneOffTotal = nOneOffCharges + nOneOffChargesVat;
        const nInvoiceTotal = nCurrentChargesTotal + nOneOffTotal;

        return {
          ...inv,
          monthlyRentalTotal: nMonthlyRentalTotal,
          currentChargesVat: nCurrentChargesVat,
          currentChargesTotal: nCurrentChargesTotal,
          oneOffCharges: nOneOffCharges,
          oneOffChargesVat: nOneOffChargesVat,
          oneOffTotal: nOneOffTotal,
          invoiceTotal: nInvoiceTotal
        };
      });
    }

    const html = renderReportHTML(type, displayMonthYear, logoBase64, reportData, { includeCustTotal, includePrevCharges });

    const isWindows = process.platform === 'win32';
    if (!process.env.PUPPETEER_CACHE_DIR) {
      process.env.PUPPETEER_CACHE_DIR = isWindows
        ? path.join(process.cwd(), '.cache', 'puppeteer')
        : '/tmp/.cache/puppeteer';
    }
    
    if (!fs.existsSync(process.env.PUPPETEER_CACHE_DIR)) {
      fs.mkdirSync(process.env.PUPPETEER_CACHE_DIR, { recursive: true });
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
      '/usr/bin/brave',
    ].filter(Boolean)

    let executablePath: string | undefined
    for (const p of possibleExecutables) {
      try {
        if (p && fs.existsSync(p as string)) {
          executablePath = p as string
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
    };
    if (executablePath) launchOptions.executablePath = executablePath;
    if (!executablePath && isWindows) launchOptions.channel = 'chrome';

    const browser = await puppeteer.launch(launchOptions);
    try {
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Set viewport/media to print
      await page.emulateMediaType('print');
      
      const landscape = true; // All currently supported reports are landscape

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '50px',
          left: '20px',
        },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size: 8pt; width: 100%; display: flex; justify-content: space-between; color: #8f3634; border-top: 1px solid #ccc; padding-top: 5px; margin: 0 20px;">
            <div style="text-align: left;">Billing System Generated Internal Report</div>
            <div style="text-align: right;">Page No : <span class="pageNumber"></span></div>
          </div>
        `
      });

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Report_${type}_${new Date().getTime()}.pdf"`
        }
      });
    } finally {
      await browser.close();
    }

  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
