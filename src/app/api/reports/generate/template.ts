export function renderReportHTML(
  reportType: string,
  monthYear: string,
  logoBase64: string,
  data: any[],
  options?: { includeCustTotal?: boolean; includePrevCharges?: boolean }
): string {
  let title = '';
  let subtitle = '[Note : Highlighted Account Name indicates Non Direct Debit Customer]';
  let thead = '';
  let tbody = '';
  let tfoot = ''; // Keeping tfoot empty or removing entirely, appending totals to tbody

  if (reportType === 'NORMAL') {
    title = `Customer Invoice Report for ${monthYear}`;
    thead = `
      <tr>
        <th class="col-num">Account No</th>
        <th class="col-name">Account Name</th>
        <th class="col-num">Invoice No</th>
        <th class="col-amt">Previous Balance</th>
        <th class="col-amt">Payment Received</th>
        <th class="col-amt">Total</th>
      </tr>
    `;
    let total = 0;
    data.forEach((row, idx) => {
      total += Number(row.total || 0);
      const isNonDD = !row.ddtrefno || row.ddtrefno === '0';
      const rowClass = idx % 2 === 0 ? 'even-row' : 'odd-row';
      const accountNameStyle = isNonDD ? 'color: #B76E00; font-weight: bold;' : '';
      tbody += `
        <tr class="${rowClass}">
          <td class="col-num text-right">${row.custid}</td>
          <td class="col-name" style="${accountNameStyle}">${row.custname}</td>
          <td class="col-num text-right">${row.invoiceno}</td>
          <td class="col-amt text-right">${Number(row.prevbal).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.paymentreceived).toFixed(2)}</td>
          <td class="col-amt text-right"><b>${Number(row.total).toFixed(2)}</b></td>
        </tr>
      `;
    });
    tbody += `
      <tr class="total-row">
        <td colspan="5" class="text-right"><b>Total</b></td>
        <td class="col-amt text-right"><b>${total.toFixed(2)}</b></td>
      </tr>
    `;
  } else if (reportType === 'DDTREP') {
    subtitle = '';
    title = `Direct Debit Report for ${monthYear}`;
    thead = `
      <tr>
        <th class="col-num">Sr No</th>
        <th class="col-num">Account No</th>
        <th class="col-num">Direct Debit Ref</th>
        <th class="col-name">Customer Name</th>
        <th class="col-date">Invoice Date</th>
        <th class="col-amt">Invoice Amount</th>
      </tr>
    `;
    let total = 0;
    data.forEach((row, idx) => {
      total += Number(row.total || 0);
      const invDate = row.invoicedate;
      // Note: DDTREP only has Direct Debit customers, so no highlight needed typically, but we'll apply standard striping.
      const highlightClass = idx % 2 === 0 ? 'even-row' : 'odd-row';
      tbody += `
        <tr class="${highlightClass}">
          <td class="col-num text-center">${idx + 1}</td>
          <td class="col-num text-center">${row.custid}</td>
          <td class="col-num text-center">${row.ddtrefno}</td>
          <td class="col-name">${row.custname}</td>
          <td class="col-date text-center">${invDate}</td>
          <td class="col-amt text-right">${Number(row.total).toFixed(2)}</td>
        </tr>
      `;
    });
    tbody += `
      <tr class="total-row">
        <td colspan="5" class="text-right"><b>Direct Debit Total</b></td>
        <td class="col-amt text-right"><b>${total.toFixed(2)}</b></td>
      </tr>
    `;
  } else if (reportType === 'NONDDTREP') {
    title = `Non Direct Debit Report for ${monthYear}`;
    // subtitle stays as the default Non DD note
    thead = `
      <tr>
        <th class="col-num">Sr No</th>
        <th class="col-num">Account No</th>
        <th class="col-name">Customer Name</th>
        <th class="col-date">Invoice Date</th>
        <th class="col-amt">Invoice Amount</th>
      </tr>
    `;
    let total = 0;
    data.forEach((row, idx) => {
      total += Number(row.total || 0);
      const invDate = row.invoicedate;
      const isNonDD = !row.ddtrefno || row.ddtrefno === '0';
      const rowClass = idx % 2 === 0 ? 'even-row' : 'odd-row';
      const accountNameStyle = isNonDD ? 'color: #B76E00; font-weight: bold;' : '';
      tbody += `
        <tr class="${rowClass}">
          <td class="col-num text-center">${idx + 1}</td>
          <td class="col-num text-center">${row.custid}</td>
          <td class="col-name" style="${accountNameStyle}">${row.custname}</td>
          <td class="col-date text-center">${invDate}</td>
          <td class="col-amt text-right">${Number(row.total).toFixed(2)}</td>
        </tr>
      `;
    });
    tbody += `
      <tr class="total-row">
        <td colspan="4" class="text-right"><b>Non Direct Debit Total</b></td>
        <td class="col-amt text-right"><b>${total.toFixed(2)}</b></td>
      </tr>
    `;
  } else if (reportType === 'MONTHLYCUSTREPORT' || reportType === 'MONTHLYREP') {
    title = `Customer Report (${monthYear})`;
    const inclPrev = options?.includePrevCharges;
    const inclCustTotal = options?.includeCustTotal;
    
    thead = `
      <tr class="header-main">
        <th rowspan="2" class="col-num" style="border-right: 1px solid #ffffff;">Account No</th>
        <th rowspan="2" class="col-name" style="border-right: 1px solid #ffffff;">Account Name</th>
        <th colspan="2" class="col-num" style="border-right: 1px solid #ffffff; border-bottom: 1px solid #ffffff;">Invoice</th>
        ${inclPrev ? '<th colspan="3" class="text-center" style="border-bottom: 1px solid #ffffff; border-right: 1px solid #ffffff;">Previous Charges</th>' : ''}
        <th colspan="4" class="text-center" style="border-bottom: 1px solid #ffffff; border-right: 1px solid #ffffff;">Current Charges</th>
        <th colspan="3" class="text-center" style="border-bottom: 1px solid #ffffff; border-right: 1px solid #ffffff;">One-Off Charges</th>
        <th rowspan="2" class="col-amt" style="border-right: 1px solid #ffffff;">Current Month</th>
        ${inclPrev ? '<th rowspan="2" class="col-amt">Amount Due</th>' : ''}
      </tr>
      <tr class="header-sub">
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Date</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">No</th>
        ${inclPrev ? `
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Prev Bal</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Pmt Rcvd</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Bal Fwded</th>
        ` : ''}
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Rental</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Usage</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Vat</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Total</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">One Off</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Vat</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Total</th>
      </tr>
    `;

    let gTotalCurrentMonth = 0, gTotalAmountDue = 0, gTotalRental = 0, gTotalUsage = 0, gTotalCurrentVat = 0, gTotalCurrentTotal = 0, gTotalOneOff = 0, gTotalOneOffVat = 0, gTotalOneOffTotal = 0;
    let gTotalPrevBal = 0, gTotalPmtRcvd = 0, gTotalBalFwded = 0;

    let cTotalCurrentMonth = 0, cTotalAmountDue = 0, cTotalRental = 0, cTotalUsage = 0, cTotalCurrentVat = 0, cTotalCurrentTotal = 0, cTotalOneOff = 0, cTotalOneOffVat = 0, cTotalOneOffTotal = 0;
    let cTotalPrevBal = 0, cTotalPmtRcvd = 0, cTotalBalFwded = 0;

    let currentCustId = -1;
    let currentCustName = '';
    
    const printSubTotal = () => {
      if (inclCustTotal && currentCustId !== -1) {
        tbody += `
          <tr class="total-row" style="background-color: #a0aaa3; color: #000;">
            <td class="col-num text-center"></td>
            <td colspan="3" class="col-name"><b>Total (${currentCustName})</b></td>
            ${inclPrev ? `
            <td class="col-amt text-right"><b>${Number(cTotalPrevBal || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalPmtRcvd || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalBalFwded || 0).toFixed(2)}</b></td>
            ` : ''}
            <td class="col-amt text-right"><b>${Number(cTotalRental || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalUsage || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalCurrentVat || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalCurrentTotal || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalOneOff || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalOneOffVat || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalOneOffTotal || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalCurrentMonth || 0).toFixed(2)}</b></td>
            ${inclPrev ? `<td class="col-amt text-right"><b>${Number(cTotalAmountDue || 0).toFixed(2)}</b></td>` : ''}
          </tr>
        `;
      }
    };

    data.forEach((row, idx) => {
      const isFirstRowForCust = currentCustId !== row.custid;
      if (isFirstRowForCust && currentCustId !== -1) {
        printSubTotal();
        cTotalCurrentMonth = 0; cTotalAmountDue = 0; cTotalRental = 0; cTotalUsage = 0; cTotalCurrentVat = 0; cTotalCurrentTotal = 0; cTotalOneOff = 0; cTotalOneOffVat = 0; cTotalOneOffTotal = 0; cTotalPrevBal = 0; cTotalPmtRcvd = 0; cTotalBalFwded = 0;
      }
      currentCustId = row.custid;
      currentCustName = row.custname;

      const balFwded = Number(row.prevbal || 0) - Number(row.paymentreceived || 0);

      gTotalRental += row.monthlyRentalTotal;
      gTotalUsage += Number(row.usagecharges);
      gTotalCurrentVat += row.currentChargesVat;
      gTotalCurrentTotal += row.currentChargesTotal;
      gTotalOneOff += row.oneOffCharges;
      gTotalOneOffVat += row.oneOffChargesVat;
      gTotalOneOffTotal += row.oneOffTotal;
      gTotalCurrentMonth += row.invoiceTotal;
      gTotalAmountDue += Number(row.total);
      gTotalPrevBal += Number(row.prevbal || 0);
      gTotalPmtRcvd += Number(row.paymentreceived || 0);
      gTotalBalFwded += balFwded;

      cTotalRental += row.monthlyRentalTotal;
      cTotalUsage += Number(row.usagecharges);
      cTotalCurrentVat += row.currentChargesVat;
      cTotalCurrentTotal += row.currentChargesTotal;
      cTotalOneOff += row.oneOffCharges;
      cTotalOneOffVat += row.oneOffChargesVat;
      cTotalOneOffTotal += row.oneOffTotal;
      cTotalCurrentMonth += row.invoiceTotal;
      cTotalAmountDue += Number(row.total);
      cTotalPrevBal += Number(row.prevbal || 0);
      cTotalPmtRcvd += Number(row.paymentreceived || 0);
      cTotalBalFwded += balFwded;

      const isStandard = !row.ddtrefno || row.ddtrefno === '0';
      // Only apply non-DDT highlight and name styling on the FIRST row for a customer
      const accountNameStyle = (isFirstRowForCust && isStandard) ? 'color: #B76E00; font-weight: bold;' : '';
      const rowClass = idx % 2 === 0 ? 'even-row' : 'odd-row';

      tbody += `
        <tr class="${rowClass}">
          <td class="col-num text-right">${isFirstRowForCust ? row.custid : ''}</td>
          <td class="col-name" style="${accountNameStyle}">${isFirstRowForCust ? row.custname : ''}</td>
          <td class="col-num text-right" style="white-space: nowrap;">${row.invoicedate || ''}</td>
          <td class="col-num text-right">${row.invoiceno}</td>
          ${inclPrev ? `
          <td class="col-amt text-right">${Number(row.prevbal || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.paymentreceived || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(balFwded || 0).toFixed(2)}</td>
          ` : ''}
          <td class="col-amt text-right">${Number(row.monthlyRentalTotal || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.usagecharges || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.currentChargesVat || 0).toFixed(2)}</td>
          <td class="col-amt text-right"><b>${Number(row.currentChargesTotal || 0).toFixed(2)}</b></td>
          <td class="col-amt text-right">${Number(row.oneOffCharges || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.oneOffChargesVat || 0).toFixed(2)}</td>
          <td class="col-amt text-right"><b>${Number(row.oneOffTotal || 0).toFixed(2)}</b></td>
          <td class="col-amt text-right">${Number(row.invoiceTotal || 0).toFixed(2)}</td>
          ${inclPrev ? `<td class="col-amt text-right">${Number(row.total || 0).toFixed(2)}</td>` : ''}
        </tr>
      `;
    });

    if (data.length > 0) {
      printSubTotal();
    }

    tbody += `
      <tr class="total-row">
        <td colspan="4" class="text-right"><b>Grand Total</b></td>
        ${inclPrev ? `
        <td class="col-amt text-right"><b>${Number(gTotalPrevBal || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalPmtRcvd || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalBalFwded || 0).toFixed(2)}</b></td>
        ` : ''}
        <td class="col-amt text-right"><b>${Number(gTotalRental || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalUsage || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalCurrentVat || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalCurrentTotal || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalOneOff || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalOneOffVat || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalOneOffTotal || 0).toFixed(2)}</b></td>
        <td class="col-amt text-right"><b>${Number(gTotalCurrentMonth || 0).toFixed(2)}</b></td>
        ${inclPrev ? `<td class="col-amt text-right"><b>${Number(gTotalAmountDue || 0).toFixed(2)}</b></td>` : ''}
      </tr>
    `;
  } else if (reportType === 'USAGEREPORTWITHCHART') {
    const inclCustTotal = options?.includeCustTotal;

    // Compute dynamic max from actual data
    const dynamicMax = data.reduce((max, row) => Math.max(max, Number(row.usagecharges || 0)), 0);
    const scaleMax = dynamicMax > 0 ? dynamicMax : 1; // avoid divide-by-zero

    title = `Usage Report (${monthYear})`;
    subtitle = '[Note : Highlighted Account Name indicates Non Direct Debit Customer]';

    thead = `
      <tr class="header-main">
        <th rowspan="2" class="col-num" style="border-right: 1px solid #ffffff; width: 55px;">Account No</th>
        <th rowspan="2" class="col-name" style="border-right: 1px solid #ffffff; width: 180px;">Account Name</th>
        <th colspan="2" class="col-num" style="border-right: 1px solid #ffffff; border-bottom: 1px solid #ffffff; width: 110px;">Invoice</th>
        <th colspan="4" class="text-center" style="border-bottom: 1px solid #ffffff; border-right: 1px solid #ffffff; width: 200px;">Current Charges</th>
        <th rowspan="2" class="col-amt" style="width: 260px;">
          Usage Chart
          <div style="font-size: 10px; font-weight: normal; margin-top: 2px;">Usage Scale (0 - ${dynamicMax.toFixed(2)})</div>
        </th>
      </tr>
      <tr class="header-sub">
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none; width: 68px;">Date</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none; width: 42px;">No</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Rental</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Usage</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Vat</th>
        <th class="col-amt" style="border-right: 1px solid #ffffff; border-top: none;">Total</th>
      </tr>
    `;

    let cTotalRental = 0, cTotalUsage = 0, cTotalCurrentVat = 0, cTotalCurrentTotal = 0;
    let currentCustId = -1;
    let currentCustName = '';

    const printSubTotal = () => {
      if (inclCustTotal && currentCustId !== -1) {
        tbody += `
          <tr class="total-row" style="background-color: #a0aaa3; color: #000;">
            <td class="col-num text-center"></td>
            <td colspan="3" class="col-name"><b>Total (${currentCustName})</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalRental || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalUsage || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalCurrentVat || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"><b>${Number(cTotalCurrentTotal || 0).toFixed(2)}</b></td>
            <td class="col-amt text-right"></td>
          </tr>
        `;
      }
    };

    let previousCustId = -1;
    data.forEach((row, idx) => {
      if (currentCustId !== row.custid && currentCustId !== -1) {
        printSubTotal();
        cTotalRental = 0; cTotalUsage = 0; cTotalCurrentVat = 0; cTotalCurrentTotal = 0;
      }
      currentCustId = row.custid;
      currentCustName = row.custname;

      cTotalRental += row.monthlyRentalTotal;
      cTotalUsage += Number(row.usagecharges);
      cTotalCurrentVat += row.currentChargesVat;
      cTotalCurrentTotal += row.currentChargesTotal;

      const isFirstRowForCust = previousCustId !== row.custid;
      previousCustId = row.custid;

      const isNonDD = !row.ddtrefno || row.ddtrefno === '0';
      const rowClass = idx % 2 === 0 ? 'even-row' : 'odd-row';
      const accountNameStyle = isNonDD ? 'color: #B76E00; font-weight: bold;' : '';

      const usageVal = Number(row.usagecharges || 0);
      const barPct = Math.min((usageVal / scaleMax) * 100, 100);
      // Use inline min-width for Puppeteer compatibility instead of CSS max()
      const barPctStr = barPct.toFixed(2);
      const barMinWidth = usageVal > 0 ? 'min-width: 3px;' : '';

      tbody += `
        <tr class="${rowClass}">
          <td class="col-num text-right">${isFirstRowForCust ? row.custid : ''}</td>
          <td class="col-name" style="${isFirstRowForCust ? accountNameStyle : ''}">${isFirstRowForCust ? row.custname : ''}</td>
          <td class="col-num text-right" style="white-space: nowrap; width: 68px;">${row.invoicedate || ''}</td>
          <td class="col-num text-right" style="width: 42px;">${row.invoiceno}</td>
          <td class="col-amt text-right">${Number(row.monthlyRentalTotal || 0).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(usageVal).toFixed(2)}</td>
          <td class="col-amt text-right">${Number(row.currentChargesVat || 0).toFixed(2)}</td>
          <td class="col-amt text-right"><b>${Number(row.currentChargesTotal || 0).toFixed(2)}</b></td>
          <td class="col-amt" style="padding: 3px 6px; vertical-align: middle;">
            <div style="display: flex; align-items: center; gap: 3px;">
              <div style="flex: 1; height: 10px; background-color: #E2E8F0; border-radius: 2px; overflow: hidden; position: relative;">
                <div style="width: ${barPctStr}%; ${barMinWidth} height: 100%; background-color: #01A7FF; border-radius: 2px;"></div>
              </div>
              <span style="font-size: 10px; color: #555; white-space: nowrap; min-width: 34px; text-align: right;">${usageVal > 0 ? usageVal.toFixed(2) : ''}</span>
            </div>
          </td>
        </tr>
      `;
    });

    if (data.length > 0) {
      printSubTotal();
    }
  }
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Inter', Helvetica, Arial, sans-serif;
          font-size: 8pt;
          margin: 0;
          padding: 20px;
          background-color: #FFFFFF;
          color: #333333;
        }
        .header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 10px;
        }
        .header img {
          height: 40px;
        }
        .report-title-container {
          text-align: center;
          margin-bottom: 15px;
        }
        .report-title {
          color: #333333;
          font-size: 11pt;
          font-weight: bold;
          border-bottom: 2px solid #2139EE;
          display: inline-block;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .report-subtitle {
          color: #666666;
          font-size: 7.5pt;
          font-style: italic;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 4px 6px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        th {
          background-color: #2139EE;
          color: #FFFFFF;
          font-weight: bold;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
                
        /* Row Highlighting and Striping */
        .even-row td {
          background-color: #FFFFFF;
          color: #333333;
        }
        .odd-row td {
          background-color: #F4F7FE;
          color: #333333;
        }

        /* Total Row (at bottom of tbody) */
        .total-row td {
          background-color: #333333;
          color: #FFFFFF;
          font-weight: bold;
          border-top: 2px solid #01A7FF;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : '<h2>PINEVOX</h2>'}
      </div>
      
      <div class="report-title-container">
        <div class="report-title">${title}</div>
        ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
      </div>

      <table>
        <thead>
          ${thead}
        </thead>
        <tbody>
          ${tbody}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
