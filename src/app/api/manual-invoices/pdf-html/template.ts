export function renderManualInvoiceHTML(invoiceData: any, logoBase64: string = ''): string {
  const num = (v: any) => Number(v || 0)
  const money = (v: any, format: '£' | 'GBP' = 'GBP') => {
    const n = num(v)
    const absVal = Math.abs(n).toFixed(2)
    const negative = n < 0
    if (format === 'GBP') {
      return negative ? `(${absVal}) GBP` : `${absVal} GBP`
    }
    return negative ? `£(${absVal})` : `£${absVal}`
  }
  const safe = (v: any, d = '') => (v === undefined || v === null ? d : String(v))

  const formatDate = (dateRaw: any) => {
    const date = new Date(dateRaw)
    if (Number.isNaN(date.getTime())) return ''
    const dd = String(date.getDate()).padStart(2, '0')
    const mmm = date.toLocaleString('en-GB', { month: 'short' })
    const yyyy = date.getFullYear()
    return `${dd}-${mmm}-${yyyy}`
  }

  const formatInvoiceNo = (invNo: any, custId: any, joinDate: any) => {
    let part1 = ''
    if (joinDate) {
      const d = new Date(joinDate)
      if (!Number.isNaN(d.getTime())) {
        part1 = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}-`
      }
    }
    let part2 = ''
    if (custId) {
      part2 = `${String(custId).substring(5, 9)}-`
    }
    const part3 = String(invNo || '').padStart(4, '0')
    return part1 + part2 + part3
  }

  const dueDateRaw = safe(invoiceData.duedate)
  const dueDateDisplay = dueDateRaw === 'IMMEDIATE' ? 'Immediate Payment' : formatDate(dueDateRaw)

  const items: Array<{ description: string; unitPrice: number; quantity: number }> =
    Array.isArray(invoiceData.items) ? invoiceData.items : []

  const subtotal = items.reduce(
    (sum, item) => sum + num(item.unitPrice) * num(item.quantity || 0),
    0,
  )
  const vatPct = num(invoiceData.vat)
  const vatAmount = (subtotal * vatPct) / 100
  const total = num(invoiceData.total || subtotal + vatAmount)

  const prevBal = num(invoiceData.prevbal)
  const payRecv = num(invoiceData.paymentreceived)
  const balanceFwd = prevBal - payRecv
  const amountDue = balanceFwd + total

  const invoiceNumberFormatted = formatInvoiceNo(
    invoiceData.invoiceno,
    invoiceData.custid,
    invoiceData.joindate,
  )

  const invDate = new Date(invoiceData.invoicedate)
  const invMonthYear = invDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()

  const custName = safe(invoiceData.custname)
  const custAddr1 = safe(invoiceData.addressline1)
  const custAddr2 = safe(invoiceData.addressline2)
  const custAddr3 = safe(invoiceData.addressline3)
  const custAddr4 = safe(invoiceData.city)
  const custAddr5 = safe(invoiceData.pincode)

  const hasDDRef = invoiceData.ddtrefno && String(invoiceData.ddtrefno).trim() !== ''
  const providerid = invoiceData.providerid || 274101100
  let paymentTermsHTML = ''
  if (providerid === 274101100) {
    if (hasDDRef) {
      paymentTermsHTML = 'Direct Debit (Payment will be taken on or after 15th of this month)- No Action Required'
    } else {
      paymentTermsHTML = 'Payable by : Direct Debit / Cheque/Cash/Bank Transfer'
    }
  } else {
    paymentTermsHTML = 'Payment on Receipt'
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 10mm 18mm 15mm 18mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #000; }
    .logo { text-align: center; margin-bottom: 10px; height: 60px; }
    .logo img { height: 60px; width: auto; display: block; margin: 0 auto; }
    .header-line { border-top: 0.3mm solid #000; margin-bottom: 1mm; }
    .header-line-2 { border-top: 0.9mm solid #000; margin-bottom: 6mm; }
    .invoice-banner { background: #EBF2FF; padding: 7px 8px; text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 16px; }
    .two-column { display: flex; gap: 8mm; margin-bottom: 8mm; }
    .column { flex: 1; }
    .section-header { background: #E6E6E6; padding: 4px 8px; font-weight: bold; margin-bottom: 12px; font-size: 9pt; }
    .info-row { display: grid; grid-template-columns: 120px 1fr; padding: 2px 0; font-size: 9pt; line-height: 1.4; gap: 10px; }
    .info-label { font-weight: normal; text-align: left; }
    .info-value { text-align: right; }
    .summary-box { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .table-title { background: #EBF2FF; padding: 5.5px 8px; font-weight: bold; margin-bottom: 0; font-size: 10pt; }
    th, td { border: 1px solid #000; padding: 4px 6px; font-size: 9pt; }
    th { background: #F5F7FB; text-align: left; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <div class="logo">
    ${logoBase64 ? `<img src="${logoBase64}" alt="PineVox" />` : '<h1 style="color: #2139EE;">PineVox</h1>'}
  </div>
  <div class="header-line"></div>
  <div class="header-line-2"></div>
  <div class="invoice-banner">INVOICE</div>

  <div class="two-column">
    <div class="column">
      <div style="font-weight: bold; margin-bottom: 5px;">${custName}</div>
      ${custAddr1 ? `<div>${custAddr1}</div>` : ''}
      ${custAddr2 ? `<div>${custAddr2}</div>` : ''}
      ${custAddr3 ? `<div>${custAddr3}</div>` : ''}
      ${custAddr4 ? `<div>${custAddr4}</div>` : ''}
      ${custAddr5 ? `<div>${custAddr5}</div>` : ''}

      <div style="margin-top: 20px;">
        <div class="section-header">Information</div>
        <div class="info-row">
          <span class="info-label">Billing Services</span>
          <span class="info-value">${process.env.INVOICE_EMAIL || 'billing@pinevox.com'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">VAT No.</span>
          <span class="info-value">${process.env.INVOICE_VAT || '985207886'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Terms</span>
          <span class="info-value">${paymentTermsHTML}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Bank Details</span>
          <span class="info-value">${process.env.INVOICE_BANK_NAME || 'Barclays Bank'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"></span>
          <span class="info-value">Sort Code : ${process.env.INVOICE_BANK_SORT || '203721'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"></span>
          <span class="info-value">Account No : ${process.env.INVOICE_BANK_ACC || '83788164'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cheques Payable To</span>
          <span class="info-value">${process.env.INVOICE_PAYEE || 'Pioneer Global Services Ltd'}</span>
        </div>
      </div>
    </div>

    <div class="column">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: #2139EE; margin-bottom: 10px;">
        <span>INVOICE SUMMARY</span>
        <span>${invMonthYear}</span>
      </div>

      <div class="summary-box">
        <div class="section-header">Account Information</div>
        <div class="info-row">
          <span class="info-label">Account Number</span>
          <span class="info-value">${safe(invoiceData.custid)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Date</span>
          <span class="info-value">${formatDate(invoiceData.invoicedate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date</span>
          <span class="info-value">${dueDateDisplay}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Number</span>
          <span class="info-value">${invoiceNumberFormatted}</span>
        </div>
      </div>

      <div class="summary-box">
        <div class="section-header">Previous Charges</div>
        <div class="info-row">
          <span class="info-label">Previous Balance</span>
          <span class="info-value">${money(prevBal, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Received</span>
          <span class="info-value">${money(payRecv, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Balance Forwarded (1)</span>
          <span class="info-value">${money(balanceFwd, 'GBP')}</span>
        </div>
      </div>

      <div class="summary-box">
        <div class="section-header">Current Charges</div>
        <div class="info-row">
          <span class="info-label">Current Bill Charges</span>
          <span class="info-value">${money(subtotal, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Bill Total (2)</span>
          <span class="info-value">${money(total, 'GBP')}</span>
        </div>
      </div>

      <div class="summary-box">
        <div class="section-header">Amount Due</div>
        <div class="info-row">
          <span class="info-label">Amount Due</span>
          <span class="info-value">${money(amountDue, 'GBP')}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="table-title">INVOICE DETAIL</div>
  <table>
    <thead>
      <tr>
        <th>Monthly Rental / Item Description</th>
        <th class="right">Unit Price</th>
        <th class="right">Quantity</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.length ? items.map((item) => {
        const lineTotal = num(item.unitPrice) * num(item.quantity || 0)
        return `
          <tr>
            <td>${safe(item.description)}</td>
            <td class="right">${num(item.unitPrice).toFixed(2)}</td>
            <td class="right">${num(item.quantity || 0)}</td>
            <td class="right">${lineTotal.toFixed(2)}</td>
          </tr>
        `
      }).join('') : `
        <tr>
          <td colspan="4" class="right">No line items.</td>
        </tr>
      `}
      <tr>
        <td colspan="3" class="right">Sub Total</td>
        <td class="right">${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" class="right">VAT (${vatPct.toFixed(2)}%)</td>
        <td class="right">${vatAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" class="right"><strong>Grand Total</strong></td>
        <td class="right"><strong>${total.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`
}
