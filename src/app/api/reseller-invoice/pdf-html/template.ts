export function renderInvoiceHTML(invoiceData: any, cdrs: any[] = [], logoBase64: string = '', incomingIconBase64: string = '', outgoingIconBase64: string = '', customSettings: any = null): string {
  // Helper functions
  const num = (v: any) => Number(v || 0)
  const money = (v: any, format: '£' | 'GBP' = '£') => {
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
    if (isNaN(date.getTime())) return ''
    const dd = String(date.getDate()).padStart(2, '0')
    const mmm = date.toLocaleString('en-GB', { month: 'short' })
    const yyyy = date.getFullYear()
    return `${dd}-${mmm}-${yyyy}`
  }

  const formatInvoiceNo = (invNo: any, custId: any, joinDate: any) => {
    let part1 = ''
    if (joinDate) {
      const d = new Date(joinDate)
      part1 = String(d.getMonth() + 1).padStart(2, '0') + String(d.getFullYear()).slice(-2) + '-'
    }
    let part2 = ''
    if (custId) {
      part2 = String(custId).substring(5, 9) + '-'
    }
    let part3 = String(invNo || '').padStart(4, '0')
    return part1 + part2 + part3
  }

  const calcDueDate = (invoiceDateRaw: any, duedaysRaw: any) => {
    const invoiceDate = new Date(invoiceDateRaw)
    const duedays = num(duedaysRaw)
    if (isNaN(invoiceDate.getTime()) || !duedays) return ''
    const dueDate = new Date(invoiceDate.getTime() + duedays * 24 * 60 * 60 * 1000)
    return formatDate(dueDate)
  }

  // Calculations
  const prevBal = num(invoiceData.prevbal)
  const payRecv = num(invoiceData.paymentreceived)
  const adjustments = num(invoiceData.adjustments)
  const balanceFwd = prevBal - payRecv + adjustments

  const oneOff = num(invoiceData.oneoffcharges)
  const voipCallCharges = num(invoiceData.usagecharges)
  const pstnCallCharges = num(invoiceData.gammausage)
  const vatPct = num(invoiceData.vat)

  const items: Array<{ description: string; unitPrice: number; quantity: number; total: number }> =
    Array.isArray(invoiceData.currentcharges) ? invoiceData.currentcharges :
      Array.isArray(invoiceData.items) ? invoiceData.items : []

  const monthlyRentalTotal = items.length
    ? items.reduce((sum, it) => sum + num(it.total ?? num(it.unitPrice) * num(it.quantity ?? 1)), 0)
    : num(invoiceData.monthly_rental)

  const discounts: Array<{ description: string; amount: number }> =
    Array.isArray(invoiceData.discounts) ? invoiceData.discounts : []
  const totalDiscount = discounts.reduce((sum, disc) => sum + num(disc.amount), 0)
  const monthlyRentalTotalDiscounted = monthlyRentalTotal - totalDiscount
  const curChargesSubTotal = monthlyRentalTotalDiscounted + voipCallCharges + pstnCallCharges
  const curChargesVat = (curChargesSubTotal * vatPct) / 100
  const curMonthTotalNoOneOff = curChargesSubTotal + curChargesVat
  const amountDueEst = num(invoiceData.total)

  const invoiceNumberFormatted = formatInvoiceNo(invoiceData.invoiceno, invoiceData.custid, invoiceData.joindate)
  const dueDateFormatted = calcDueDate(invoiceData.invoicedate, invoiceData.duedays)

  const invDate = new Date(invoiceData.invoicedate)
  const invMonthYear = invDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()

  // Customer info
  const custName = safe(invoiceData.custcompanyname || invoiceData.custname)
  const custAddr1 = safe(invoiceData.custaddress1 || invoiceData.addressline1)
  const custAddr2 = safe(invoiceData.custaddress2 || invoiceData.addressline2)
  const custAddr3 = safe(invoiceData.custaddress3 || invoiceData.addressline3)
  const custAddr4 = safe(invoiceData.custaddress4 || invoiceData.city)
  const custAddr5 = safe(invoiceData.custaddress5 || invoiceData.pincode)

  // Service numbers
  const serviceNumbers: string[] =
    Array.isArray(invoiceData.servicenumbers) ? invoiceData.servicenumbers :
      Array.isArray(invoiceData.serviceNumbers) ? invoiceData.serviceNumbers :
        typeof invoiceData.servicenumberscsv === 'string' ? invoiceData.servicenumberscsv.split(',').map((s: string) => s.trim()).filter(Boolean) :
          typeof invoiceData.servicenumber === 'string' ? invoiceData.servicenumber.split(',').map((s: string) => s.trim()).filter(Boolean) :
            typeof invoiceData.dids === 'string' ? invoiceData.dids.split(',').map((s: string) => s.trim()).filter(Boolean) :
              Array.isArray(invoiceData.dids) ? invoiceData.dids : []

  const oneOffItems: Array<{ description: string; unitPrice: number; quantity: number; total: number }> =
    Array.isArray(invoiceData.oneoffitems) ? invoiceData.oneoffitems : []

  // Payment terms logic
  const hasDDRef = invoiceData.ddtrefno && String(invoiceData.ddtrefno).trim() !== ''
  const providerid = invoiceData.providerid || 274101100
  let paymentTermsHTML = '';
  if (customSettings && typeof customSettings.payment_terms !== 'undefined') {
    paymentTermsHTML = customSettings.payment_terms || '';
  } else {
    if (providerid === 274101100) {
      if (hasDDRef) {
        paymentTermsHTML = 'Direct Debit (Payment will be taken on or after 15th of this month)- No Action Required'
      } else {
        paymentTermsHTML = 'Payable by : Direct Debit / Cheque/Cash/Bank Transfer'
      }
    } else if (invoiceData.duedays && invoiceData.duedays > 0) {
      paymentTermsHTML = `${invoiceData.duedays} days`
    } else {
      paymentTermsHTML = 'Payment on Receipt'
    }
  }

  const notesText = safe(
    invoiceData.note ||
    invoiceData.notes ||
    invoiceData.invoicenote ||
    invoiceData.invoicenotes,
    'N/A'
  )

  // CDR period
  let cdrPeriod = ''
  if (cdrs.length) {
    const billingDate = new Date(invoiceData.invoicedate)
    billingDate.setMonth(billingDate.getMonth() - 1)
    const firstDay = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1)
    const lastDay = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0)
    cdrPeriod = `(${firstDay.getDate().toString().padStart(2, '0')}-${firstDay.toLocaleString('en-GB', { month: 'short' })}-${firstDay.getFullYear()} to ${lastDay.getDate().toString().padStart(2, '0')}-${lastDay.toLocaleString('en-GB', { month: 'short' })}-${lastDay.getFullYear()})`
  }

  const rowsPerPage = 47;

  const primaryColor = customSettings?.color_theme || '#2139EE';
  const secondaryColor = customSettings?.secondary_color || '#EBF2FF';
  const headerColor = customSettings?.secondary_color || '#73CCFF';
  const companyName = customSettings && customSettings.company_name ? customSettings.company_name : (invoiceData.reseller_name || 'PineVox');
  const companyAddress = customSettings ? customSettings.address : '';
  const bankDetails = customSettings ? customSettings.bank_details : (process.env.INVOICE_BANK_DETAILS || 'Barclays Bank\nSort Code: 203721\nAccount No: 83788164\nCheques Payable To: Pioneer Global Services Ltd');
  const vatNo = customSettings ? customSettings.vat_no : (process.env.INVOICE_VAT || '985207886');
  const billingEmail = customSettings ? customSettings.billing_email : (process.env.INVOICE_EMAIL || 'billing@pinevox.com');
  const companyRegNo = customSettings ? customSettings.company_reg_no : '07080438';
  const footerCustomText = customSettings ? customSettings.footer_text : 'Thank you for your business.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 10mm 18mm 15mm 18mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
    }
    
    .page-content {
      margin-bottom: 35mm;
      position: relative;
    }
    
    .logo {
      text-align: center;
      margin-bottom: 10px;
      height: 60px;
    }
    
    .logo h1 {
      font-size: 22pt;
      margin: 0;
      font-weight: bold;
    }
    
    .logo img {
      height: 60px;
      width: auto;
      display: block;
      margin: 0 auto;
    }
    
    .header-line {
      border-top: 0.3mm solid #000;
      margin-bottom: 1mm;
    }
    
    .header-line-2 {
      border-top: 0.9mm solid #000;
      margin-bottom: 6mm;
    }
    
    .invoice-banner {
      background: ${secondaryColor};
      color: ${primaryColor};
      padding: 7px 8px;
      text-align: center;
      font-weight: bold;
      font-size: 14pt;
      margin-bottom: 16px;
    }
    
    .two-column {
      display: flex;
      gap: 8mm;
      margin-bottom: 8mm;
    }
    
    .column {
      flex: 1;
    }
    
    .section-header {
      background: #E6E6E6;
      padding: 4px 8px;
      font-weight: bold;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    
    .info-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      padding: 2px 0;
      font-size: 9pt;
      line-height: 1.4;
      gap: 10px;
    }
    
    .info-label {
      font-weight: normal;
      text-align: left;
    }
    
    .info-value {
      text-align: right;
    }
    
    .summary-box {
      margin-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .table-title {
      background: ${secondaryColor};
      color: ${primaryColor};
      padding: 5.5px 8px;
      font-weight: bold;
      margin-bottom: 0;
      font-size: 10pt;
    }
    
    .table-title-with-date {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    th {
      background: ${primaryColor};
      color: #FFFFFF;
      padding: 4.8px 8px;
      text-align: left;
      font-weight: bold;
      border: 0.2mm solid #000;
      font-size: 10pt;
      line-height: 1.2;
    }
    
    th.center {
      text-align: center;
    }
    
    td {
      padding: 2px 4px;
      border: 0.1mm solid #000;
      font-size: 8pt;
      line-height: 1.1;
      vertical-align: middle;
    }
    
    td.right {
      text-align: right;
    }
    
    td.center {
      text-align: center;
    }
    
    .cdr-row {
      height: 16px;
    }
    
    .cdr-row td {
      padding: 2px 4px;
      font-size: 7pt;
      line-height: 1.2;
      border: none;
      text-align: center;
    }
    
    .cdr-table th {
      border: none;
      text-align: center;
      font-size: 7pt;
      font-weight: bold;
    }
    
    .cdr-table td {
      border: none;
      border-bottom: 0.5px solid #E0E0E0;
    }
    
    tr.alt {
      background: #F8F8F8;
      border: none;
    }
    
    tr.alt td {
      border: none;
    }

    .cdr-row.parting-minutes {
      background-color: #F0CFC1 !important;
    }
    
    tr.summary {
      background: #F8F8F8;
      border: none;
    }
    
    tr.total {
      background: ${primaryColor};
      color: #FFFFFF;
      font-weight: bold;
    }
    
    .service-numbers {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0;
      margin-bottom: 8mm;
    }
    
    .service-number {
      border: none;
      padding: 4.2px 2px;
      font-size: 8pt;
      line-height: 1.2;
    }
    
    .notes {
      margin-top: 20px;
      margin-bottom: 25mm;
      page-break-inside: avoid;
    }
    
    .notes-content {
      padding: 10px;
      border: 1px solid #ccc;
      min-height: 40px;
      font-size: 9pt;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      width: 100%;
      font-size: 8pt;
      text-align: center;
      padding: 0;
      background: white;
    }
    
    .footer-line {
      margin-bottom: 3px;
      line-height: 1.2;
    }
    
    .footer-border {
      border-top: 1px solid #ccc;
      padding-top: 6px;
      margin-top: 0;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .cdr-icon {
      width: 10px;
      height: 10px;
      display: inline-block;
      vertical-align: middle;
    }
    
    .icon-incoming {
      color: #00AA00;
      font-weight: bold;
      font-size: 10pt;
    }
    
    .icon-outgoing {
      color: #4169E1;
      font-weight: bold;
      font-size: 10pt;
    }
    
    .cdr-legend {
      font-size: 8pt;
      color: #666;
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  </style>
</head>
<body>
  <div class="page-content">
  <!-- Page 1 -->
  <div class="logo">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : `<h1 style="color: ${primaryColor}; font-size: 28pt;">${safe(companyName)}</h1>`}
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
        ${companyAddress ? `<div style="margin-bottom: 10px; font-size: 9pt;">${companyAddress.replace(/\n/g, '<br/>')}</div>` : ''}
        ${billingEmail ? `<div class="info-row"><span class="info-label">Billing Services</span><span class="info-value">${billingEmail}</span></div>` : ''}
        ${vatNo ? `<div class="info-row"><span class="info-label">VAT No.</span><span class="info-value">${vatNo}</span></div>` : ''}
        ${paymentTermsHTML ? `<div class="info-row"><span class="info-label">Payment Terms</span><span class="info-value">${paymentTermsHTML.replace(/\n/g, '<br/>')}</span></div>` : ''}
        ${bankDetails ? `<div class="info-row"><span class="info-label">Bank Details</span><span class="info-value">${bankDetails.replace(/\n/g, '<br/>')}</span></div>` : ''}
      </div>
    </div>
    
    <div class="column">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: ${primaryColor}; margin-bottom: 10px;">
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
          <span class="info-value">${dueDateFormatted}</span>
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
          <span class="info-label">Adjustments</span>
          <span class="info-value">${money(adjustments, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Balance Forwarded (1)</span>
          <span class="info-value">${money(balanceFwd, 'GBP')}</span>
        </div>
      </div>
      
      <div class="summary-box">
        <div class="section-header">Current Charges</div>
        <div class="info-row">
          <span class="info-label">One-Off Charges</span>
          <span class="info-value">${money(oneOff, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Monthly Rental + Call Charges</span>
          <span class="info-value">${money(curMonthTotalNoOneOff, 'GBP')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Month Total (2)</span>
          <span class="info-value">${money(curMonthTotalNoOneOff, 'GBP')}</span>
        </div>
      </div>
      
      <div class="summary-box">
        <div class="section-header">Amount Due</div>
        <div class="info-row">
          <span class="info-label">Amount Due</span>
          <span class="info-value">${money(amountDueEst, 'GBP')}</span>
        </div>
      </div>
    </div>
  </div>
  
  ${serviceNumbers.length ? `
  <div class="table-title" style="margin-top: 10px;">Service Numbers</div>
  <div class="service-numbers">
    ${serviceNumbers.map((num, idx) => `<div class="service-number">${idx + 1}) ${num}</div>`).join('')}
  </div>
  ` : ''}
  
  <div class="notes">
    <div class="table-title">Notes</div>
    <div class="notes-content">
      ${notesText}
    </div>
  </div>
  </div>
  
  <!-- Page 2 - Tables -->
  <div class="page-break"></div>
  <div class="page-content">
  
  <div class="logo">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : `<h1 style="color: ${primaryColor}; font-size: 28pt;">${safe(companyName)}</h1>`}
  </div>
  
  <div class="header-line"></div>
  <div class="header-line-2"></div>
  
  <div class="invoice-banner">INVOICE</div>
  
  <div class="table-title">CURRENT CHARGES</div>
  <table>
    <thead>
      <tr>
        <th style="width: 57%;">Monthly Rental / Item Description</th>
        <th class="center" style="width: 14%;">Unit Price</th>
        <th class="center" style="width: 14%;">Quantity</th>
        <th class="center" style="width: 14%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td>${safe(it.description)}</td>
          <td class="right">${num(it.unitPrice).toFixed(2)}</td>
          <td class="right">${num(it.quantity ?? 1).toFixed(2)}</td>
          <td class="right">${num(it.total ?? num(it.unitPrice) * num(it.quantity ?? 1)).toFixed(2)}</td>
        </tr>
      `).join('')}
      ${discounts.map(disc => {
    const discountRounded = (Math.round(num(disc.amount) * 100) / 100).toFixed(2);
    return `
        <tr>
          <td>${safe(disc.description)}</td>
          <td class="right"></td>
          <td class="right"></td>
          <td class="right">(${discountRounded})</td>
        </tr>
        `;
  }).join('')}
      <tr class="summary">
        <td colspan="3" class="right">Monthly Rental Total</td>
        <td class="right">${monthlyRentalTotalDiscounted.toFixed(2)}</td>
      </tr>
      <tr class="summary">
        <td colspan="3" class="right">Call Charges (VoIP)</td>
        <td class="right">${voipCallCharges.toFixed(2)}</td>
      </tr>
      ${pstnCallCharges > 0 ? `
      <tr class="summary">
        <td colspan="3" class="right">Call Charges (PSTN)</td>
        <td class="right">${pstnCallCharges.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr class="summary">
        <td colspan="3" class="right">Sub Total</td>
        <td class="right">${curChargesSubTotal.toFixed(2)}</td>
      </tr>
      <tr class="summary">
        <td colspan="3" class="right">VAT (${vatPct.toFixed(2)}%)</td>
        <td class="right">${curChargesVat.toFixed(2)}</td>
      </tr>
      <tr class="total">
        <td colspan="3" class="right">Current Month Total</td>
        <td class="right">${curMonthTotalNoOneOff.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="table-title">ONE-OFF CHARGES</div>
  <table>
    <thead>
      <tr>
        <th style="width: 57%;">Description</th>
        <th class="center" style="width: 14%;">Unit Price</th>
        <th class="center" style="width: 14%;">Quantity</th>
        <th class="center" style="width: 14%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${oneOffItems.length ? (() => {
      let oneOffSub = 0
      const rows = oneOffItems.map(it => {
        const rowTotal = num(it.total) || num(it.unitPrice) * num(it.quantity ?? 1)
        oneOffSub += rowTotal
        return `
            <tr>
              <td>${safe(it.description)}</td>
              <td class="right">${num(it.unitPrice).toFixed(2)}</td>
              <td class="right">${num(it.quantity ?? 1).toFixed(2)}</td>
              <td class="right">${rowTotal.toFixed(2)}</td>
            </tr>
          `
      }).join('')
      const oneOffVat = (oneOffSub * vatPct) / 100
      const oneOffTotal = oneOffSub + oneOffVat
      return rows + `
          <tr class="summary">
            <td colspan="3" class="right">Sub Total</td>
            <td class="right">${oneOffSub.toFixed(2)}</td>
          </tr>
          <tr class="summary">
            <td colspan="3" class="right">VAT (${vatPct.toFixed(2)}%)</td>
            <td class="right">${oneOffVat.toFixed(2)}</td>
          </tr>
          <tr class="total">
            <td colspan="3" class="right">Current Month Total</td>
            <td class="right">${oneOffTotal.toFixed(2)}</td>
          </tr>
        `
    })() : `
        <tr>
          <td>Not Applicable</td>
          <td class="center">-</td>
          <td class="center">-</td>
          <td class="center">-</td>
        </tr>
        <tr class="total">
          <td colspan="3" class="right">Current Month Total</td>
          <td class="right">${oneOff.toFixed(2)}</td>
        </tr>
      `}
      </tbody>
    </table>
  </div>  ${cdrs.length ? (() => {
      const pages = [];
      let cdrPageNum = 3;

      for (let i = 0; i < cdrs.length; i += rowsPerPage) {
        const pageRows = cdrs.slice(i, i + rowsPerPage);
        cdrPageNum++;
        const pageHtml = `
  <div class="page-break"></div>
  <div class="page-content">
  
  <div class="logo">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : `<h1 style="color: ${primaryColor}; font-size: 28pt;">${safe(companyName)}</h1>`}
  </div>
  
  <div class="header-line"></div>
  <div class="header-line-2"></div>
  
  <div class="invoice-banner">INVOICE</div>
  
  <div class="table-title">
    <div class="table-title-with-date">
      <span style="font-size: 8pt;">VoIP Call Charge Description ${cdrPeriod}</span>
      <div class="cdr-legend">
        <div class="legend-item">
          <span style="color: #00AA00; font-weight: bold;">⬊</span>
          <span>Indicates incoming</span>
        </div>
        <div class="legend-item">
          <span style="color: #4169E1; font-weight: bold;">⬈</span>
          <span>Indicates outgoing</span>
        </div>
      </div>
    </div>
  </div>
  <table class="cdr-table">
    <thead>
      <tr>
        <th style="width: 8%;">In/Out</th>
        <th style="width: 22%;">Date & Time</th>
        <th style="width: 22%;">Destination Number</th>
        <th style="width: 23%;">Location</th>
        <th style="width: 12%;">Duration (min)</th>
        <th style="width: 12%;">Charges</th>
      </tr>
    </thead>
    <tbody>
      ${pageRows.map((cdr, idx) => {
          let dt = cdr.calldate || ''
          if (dt && typeof dt === 'string' && dt.includes('T')) {
            const parts = dt.split('T')
            const datePart = parts[0]
            const timePart = parts[1] ? parts[1].replace('Z', '').substring(0, 8) : ''
            dt = `${datePart}&nbsp;&nbsp;&nbsp;&nbsp;${timePart}`
          }
          const icon = cdr.incall === 1
            ? '<span style="color: #00AA00; font-weight: bold; font-size: 7pt;">⬊</span>'
            : '<span style="color: #4169E1; font-weight: bold; font-size: 7pt;">⬈</span>'

          let location = cdr.calllocation && String(cdr.calllocation).trim() !== '' ? safe(cdr.calllocation) : 'Unknown'
          let isParting = false
          if (location.startsWith(' *** ')) {
            isParting = true
            location = location.substring(5)
          }

          let durationMinutes = '';
          if (cdr.callduration !== undefined && cdr.callduration !== null) {
            const durationNum = parseFloat(String(cdr.callduration));
            if (!isNaN(durationNum)) {
              durationMinutes = Math.ceil(durationNum / 60).toString();
            } else {
              durationMinutes = safe(cdr.callduration);
            }
          }

          const charges = cdr.callcharges !== undefined ? num(cdr.callcharges).toFixed(2) : ''

          return `
          <tr class="cdr-row${(i + idx) % 2 === 1 ? ' alt' : ''}${isParting ? ' parting-minutes' : ''}">
            <td>${icon}</td>
            <td>${dt}</td>
            <td>${safe(cdr.calldestination)}</td>
            <td>${location}</td>
            <td>${durationMinutes}</td>
            <td>${charges}</td>
          </tr>
        `
        }).join('')}
    </tbody>
  </table>
  </div>`;
        pages.push(pageHtml);
      }

      return pages.join('');
    })() : ''}
  
  <div class="footer">
    <div class="footer-border">
      <div class="footer-line" style="font-weight: bold;">
        ${companyName} ${companyAddress ? `| ${companyAddress.replace(/\n/g, ', ')}` : ''}
      </div>
      ${billingEmail || companyRegNo ? `<div class="footer-line">
        ${billingEmail ? `Email: ${billingEmail} ` : ''}${billingEmail && companyRegNo ? '| ' : ''}${companyRegNo ? `Company Reg. No: ${companyRegNo}` : ''}
      </div>` : ''}
      <div class="footer-line">
        ${footerCustomText}
      </div>
    </div>
  </div>
</body>
</html>
  `
}
