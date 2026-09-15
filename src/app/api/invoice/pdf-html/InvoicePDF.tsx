import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
} from '@react-pdf/renderer'

// Vector arrow icons (clean rendering with no font glyph dependency)
const IncomingArrowIcon = () => (
  <Svg width="6" height="6" viewBox="0 0 10 10">
    <Path
      d="M2 2 L8 8 M4 8 L8 8 L8 4"
      stroke="#00AA00"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const OutgoingArrowIcon = () => (
  <Svg width="6" height="6" viewBox="0 0 10 10">
    <Path
      d="M2 8 L8 2 M4 2 L8 2 L8 6"
      stroke="#4169E1"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)



// ─── Helpers ───────────────────────────────────────────────────────────────

const num = (v: any) => Number(v || 0)
const money = (v: any, format: '£' | 'GBP' = '£') => {
  const n = num(v)
  const absVal = Math.abs(n).toFixed(2)
  const negative = n < 0
  if (format === 'GBP') return negative ? `(${absVal}) GBP` : `${absVal} GBP`
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
  if (custId) part2 = String(custId).substring(5, 9) + '-'
  const part3 = String(invNo || '').padStart(4, '0')
  return part1 + part2 + part3
}

const calcDueDate = (invoiceDateRaw: any, duedaysRaw: any) => {
  const invoiceDate = new Date(invoiceDateRaw)
  const duedays = num(duedaysRaw)
  if (isNaN(invoiceDate.getTime()) || !duedays) return ''
  const dueDate = new Date(invoiceDate.getTime() + duedays * 24 * 60 * 60 * 1000)
  return formatDate(dueDate)
}

// ─── Styles ────────────────────────────────────────────────────────────────

const C = {
  blue: '#2139EE',
  headerBg: '#EBF2FF',
  sectionBg: '#E6E6E6',
  thBg: '#73CCFF',
  summaryBg: '#F8F8F8',
  altBg: '#F8F8F8',
  partingBg: '#F0CFC1',
  border: '#000000',
  thinBorder: '#cccccc',
  cdrBorder: '#E0E0E0',
  green: '#00AA00',
  royalBlue: '#4169E1',
  text: '#000000',
  footerText: '#000000',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 28,
    paddingBottom: 56,  // leave room for fixed footer
    paddingLeft: 51,
    paddingRight: 51,
  },

  // ── Logo / header
  logoWrap: { alignItems: 'center', marginBottom: 8, height: 50, justifyContent: 'center' },
  logoImg: { height: 50, maxWidth: 200 },
  logoFallback: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.blue },

  thinLine: { borderTopWidth: 0.5, borderTopColor: C.border, marginBottom: 1 },
  thickLine: { borderTopWidth: 2, borderTopColor: C.border, marginBottom: 6 },

  banner: {
    backgroundColor: C.headerBg,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerText: { fontSize: 14, fontFamily: 'Helvetica-Bold' },

  // ── Two-column layout (page 1)
  twoCol: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  col: { flex: 1 },

  custName: { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 4 },
  custAddr: { fontSize: 8, lineHeight: 1.3 },

  sectionHeader: {
    backgroundColor: C.sectionBg,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 6,
    marginTop: 12,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5, fontSize: 8 },
  infoLabel: { flex: 1.2 },
  infoValue: { flex: 1, textAlign: 'right' },

  summaryTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitleText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: C.blue },

  // ── Service numbers
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  serviceCell: { width: '16.66%', fontSize: 7.5, paddingVertical: 2 },

  // ── Notes
  noteTitle: {
    backgroundColor: C.headerBg,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 0,
  },
  noteBox: {
    borderWidth: 0.5,
    borderColor: C.thinBorder,
    padding: 8,
    minHeight: 30,
    fontSize: 8,
  },

  // ── Table shared
  tableTitle: {
    backgroundColor: C.headerBg,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 0,
  },
  tableTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  th: {
    backgroundColor: C.thBg,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    lineHeight: 1.2,
  },
  thCenter: { textAlign: 'center' },

  td: {
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 1.5,
    paddingHorizontal: 3,
    fontSize: 7.5,
    lineHeight: 1.1,
  },
  tdRight: { textAlign: 'right' },
  tdCenter: { textAlign: 'center' },

  summaryRow: { backgroundColor: C.summaryBg },
  totalRow: { backgroundColor: C.thBg },
  totalRowText: { fontFamily: 'Helvetica-Bold' },

  tableWrap: { marginBottom: 14 },
  tableRow: { flexDirection: 'row' },

  // ── CDR table
  cdrTh: {
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textAlign: 'center',
    backgroundColor: C.thBg,
  },
  cdrTd: {
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    fontSize: 6.5,
    textAlign: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#A0A0A0',
    lineHeight: 1.2,
  },

  cdrAlt: { backgroundColor: C.altBg },
  cdrParting: { backgroundColor: C.partingBg },

  // IN = green arrow down, OUT = blue arrow up (simple chars present in all built-in PDF fonts)
  dirIn:  { color: C.green,     fontFamily: 'Helvetica-Bold', fontSize: 8 },
  dirOut: { color: C.royalBlue, fontFamily: 'Helvetica-Bold', fontSize: 8 },

  cdrLegend: { flexDirection: 'row', gap: 12, marginBottom: 4, marginTop: 2 },
  cdrLegendItem: { flexDirection: 'row', gap: 3, alignItems: 'center', fontSize: 7 },

  // Legend symbols (must match dirIn/dirOut symbols above)
  legendIn:  { color: C.green,     fontFamily: 'Helvetica-Bold', fontSize: 9 },
  legendOut: { color: C.royalBlue, fontFamily: 'Helvetica-Bold', fontSize: 9 },

  // ── Footer
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 51,
    right: 51,
    borderTopWidth: 0.5,
    borderTopColor: C.thinBorder,
    paddingTop: 4,
  },
  footerLine: { fontSize: 7, textAlign: 'center', lineHeight: 1.4 },
  footerBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, textAlign: 'center', lineHeight: 1.4 },
})

// ─── Sub-components ────────────────────────────────────────────────────────

const PageHeader = ({ logoBase64 }: { logoBase64: string }) => (
  <View>
    <View style={styles.logoWrap}>
      {logoBase64
        ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoBase64} style={styles.logoImg} />
          )
        : <Text style={styles.logoFallback}>PineVox</Text>
      }
    </View>
    <View style={styles.thinLine} />
    <View style={styles.thickLine} />
    <View style={styles.banner}>
      <Text style={styles.bannerText}>INVOICE</Text>
    </View>
  </View>
)

const PageFooter = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerBold}>
      PineVox is a Trading name of Pioneer Global Services Ltd, Havelock Hub, 14 Havelock Place, Harrow, London HA1 1LJ
    </Text>
    <Text style={styles.footerLine}>
      Tel: 0044 3301 796 233 | Email: billing@pinevox.com | Company Reg. No: 07080438
    </Text>
  </View>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)

// Charge table row
const TRow = ({
  cells,
  colWidths,
  bg,
  bold,
  rightCols,
  centerCols,
}: {
  cells: string[]
  colWidths: string[]
  bg?: string
  bold?: boolean
  rightCols?: number[]
  centerCols?: number[]
}) => (
  <View style={[styles.tableRow, bg ? { backgroundColor: bg } : {}]}>
    {cells.map((cell, i) => {
      const isRight = rightCols?.includes(i)
      const isCenter = centerCols?.includes(i)
      return (
        <View key={i} style={[styles.td, { width: colWidths[i] }, bg ? { borderColor: 'transparent' } : {}]}>
          <Text style={[bold ? styles.totalRowText : {}, isRight ? styles.tdRight : {}, isCenter ? styles.tdCenter : {}]}>
            {cell}
          </Text>
        </View>
      )
    })}
  </View>
)

// Summary row (merges first 3 columns into 86% width to match HTML colspan="3")
const TSummaryRow = ({
  label,
  value,
  bg = C.summaryBg,
  bold = false,
}: {
  label: string
  value: string
  bg?: string
  bold?: boolean
}) => (
  <View style={[styles.tableRow, { backgroundColor: bg }]}>
    <View style={[styles.td, { width: '86%' }]}>
      <Text style={[{ textAlign: 'right' }, bold ? styles.totalRowText : {}]}>
        {label}
      </Text>
    </View>
    <View style={[styles.td, { width: '14%' }]}>
      <Text style={[{ textAlign: 'right' }, bold ? styles.totalRowText : {}]}>
        {value}
      </Text>
    </View>
  </View>
)


// ─── Main Component ────────────────────────────────────────────────────────

export interface InvoicePDFProps {
  invoiceData: any
  cdrs?: any[]
  logoBase64?: string
  includeSummary?: boolean
  env?: {
    invoiceEmail?: string
    invoiceVat?: string
    invoiceBankName?: string
    invoiceBankSort?: string
    invoiceBankAcc?: string
    invoicePayee?: string
  }
}

export function InvoicePDF({ invoiceData, cdrs = [], logoBase64 = '', includeSummary = true, env = {} }: InvoicePDFProps) {
  // ── Calculations (mirrors template.ts exactly)
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

  // ── Customer info
  const custName = safe(invoiceData.custcompanyname || invoiceData.custname)
  const custAddr1 = safe(invoiceData.custaddress1 || invoiceData.addressline1)
  const custAddr2 = safe(invoiceData.custaddress2 || invoiceData.addressline2)
  const custAddr3 = safe(invoiceData.custaddress3 || invoiceData.addressline3)
  const custAddr4 = safe(invoiceData.custaddress4 || invoiceData.city)
  const custAddr5 = safe(invoiceData.custaddress5 || invoiceData.pincode)

  const serviceNumbers: string[] =
    Array.isArray(invoiceData.servicenumbers) ? invoiceData.servicenumbers :
    Array.isArray(invoiceData.serviceNumbers) ? invoiceData.serviceNumbers :
    typeof invoiceData.servicenumberscsv === 'string'
      ? invoiceData.servicenumberscsv.split(',').map((s: string) => s.trim()).filter(Boolean)
      : typeof invoiceData.servicenumber === 'string'
      ? invoiceData.servicenumber.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(invoiceData.dids) ? invoiceData.dids : []

  const oneOffItems: Array<{ description: string; unitPrice: number; quantity: number; total: number }> =
    Array.isArray(invoiceData.oneoffitems) ? invoiceData.oneoffitems : []

  // ── Payment terms
  const hasDDRef = invoiceData.ddtrefno && String(invoiceData.ddtrefno).trim() !== ''
  const providerid = invoiceData.providerid || 274101100
  let paymentTerms = ''
  if (providerid === 274101100) {
    paymentTerms = hasDDRef
      ? 'Direct Debit (Payment will be taken on or after 15th of this month)- No Action Required'
      : 'Payable by : Direct Debit / Cheque/Cash/Bank Transfer'
  } else if (invoiceData.duedays && invoiceData.duedays > 0) {
    paymentTerms = `${invoiceData.duedays} days`
  } else {
    paymentTerms = 'Payment on Receipt'
  }

  const notesText = safe(
    invoiceData.note || invoiceData.notes || invoiceData.invoicenote || invoiceData.invoicenotes,
    'N/A'
  )

  // ── CDR period
  let cdrPeriod = ''
  if (cdrs.length) {
    const billingDate = new Date(invoiceData.invoicedate)
    billingDate.setMonth(billingDate.getMonth() - 1)
    const firstDay = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1)
    const lastDay = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0)
    const fmt = (d: Date) =>
      `${d.getDate().toString().padStart(2, '0')}-${d.toLocaleString('en-GB', { month: 'short' })}-${d.getFullYear()}`
    cdrPeriod = `(${fmt(firstDay)} to ${fmt(lastDay)})`
  }

  // ── Env values
  const invoiceEmail = env.invoiceEmail || 'billing@pinevox.com'
  const invoiceVat = env.invoiceVat || '985207886'
  const bankName = env.invoiceBankName || 'Barclays Bank'
  const bankSort = env.invoiceBankSort || '203721'
  const bankAcc = env.invoiceBankAcc || '83788164'
  const payee = env.invoicePayee || 'Pioneer Global Services Ltd'

  // ── One-off totals
  let oneOffSub = 0
  const oneOffRows = oneOffItems.map(it => {
    const rowTotal = num(it.total) || num(it.unitPrice) * num(it.quantity ?? 1)
    oneOffSub += rowTotal
    return { ...it, rowTotal }
  })
  const oneOffVat = (oneOffSub * vatPct) / 100
  const oneOffTotal = oneOffSub + oneOffVat

  // Column widths for charge tables
  const chargeWidths = ['57%', '14%', '15%', '14%']

  // ════════════════════════════════════════════════════════════════════════
  return (
    <Document>

      {includeSummary && (
      <>
      {/* ── PAGE 1: Invoice summary ── */}
      <Page size="A4" style={styles.page}>
        <PageHeader logoBase64={logoBase64} />

        <View style={styles.twoCol}>
          {/* Left column */}
          <View style={styles.col}>
            <Text style={styles.custName}>{custName}</Text>
            {custAddr1 ? <Text style={styles.custAddr}>{custAddr1}</Text> : null}
            {custAddr2 ? <Text style={styles.custAddr}>{custAddr2}</Text> : null}
            {custAddr3 ? <Text style={styles.custAddr}>{custAddr3}</Text> : null}
            {custAddr4 ? <Text style={styles.custAddr}>{custAddr4}</Text> : null}
            {custAddr5 ? <Text style={styles.custAddr}>{custAddr5}</Text> : null}

            <Text style={styles.sectionHeader}>Information</Text>
            <InfoRow label="Billing Services" value={invoiceEmail} />
            <InfoRow label="VAT No." value={invoiceVat} />
            <InfoRow label="Payment Terms" value={paymentTerms} />
            <InfoRow label="Bank Details" value={bankName} />
            <InfoRow label="" value={`Sort Code : ${bankSort}`} />
            <InfoRow label="" value={`Account No : ${bankAcc}`} />
            <InfoRow label="Cheques Payable To" value={payee} />
          </View>

          {/* Right column */}
          <View style={styles.col}>
            <View style={styles.summaryTitle}>
              <Text style={styles.summaryTitleText}>INVOICE SUMMARY</Text>
              <Text style={styles.summaryTitleText}>{invMonthYear}</Text>
            </View>

            <Text style={styles.sectionHeader}>Account Information</Text>
            <InfoRow label="Account Number" value={safe(invoiceData.custid)} />
            <InfoRow label="Invoice Date" value={formatDate(invoiceData.invoicedate)} />
            <InfoRow label="Due Date" value={dueDateFormatted} />
            <InfoRow label="Invoice Number" value={invoiceNumberFormatted} />

            <Text style={styles.sectionHeader}>Previous Charges</Text>
            <InfoRow label="Previous Balance" value={money(prevBal, 'GBP')} />
            <InfoRow label="Payment Received" value={money(payRecv, 'GBP')} />
            <InfoRow label="Adjustments" value={money(adjustments, 'GBP')} />
            <InfoRow label="Balance Forwarded (1)" value={money(balanceFwd, 'GBP')} />

            <Text style={styles.sectionHeader}>Current Charges</Text>
            <InfoRow label="One-Off Charges" value={money(oneOff, 'GBP')} />
            <InfoRow label="Monthly Rental + Call Charges" value={money(curMonthTotalNoOneOff, 'GBP')} />
            <InfoRow label="Current Month Total (2)" value={money(curMonthTotalNoOneOff, 'GBP')} />

            <Text style={styles.sectionHeader}>Amount Due</Text>
            <InfoRow label="Amount Due" value={money(amountDueEst, 'GBP')} />
          </View>
        </View>

        {/* Service numbers */}
        {serviceNumbers.length > 0 && (
          <View>
            <Text style={styles.noteTitle}>Service Numbers</Text>
            <View style={styles.serviceGrid}>
              {serviceNumbers.map((n, idx) => (
                <Text key={idx} style={styles.serviceCell}>{idx + 1}) {n}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        <View>
          <Text style={styles.noteTitle}>Notes</Text>
          <View style={styles.noteBox}>
            <Text>{notesText}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>

      {/* ── PAGE 2: Charge tables ── */}
      <Page size="A4" style={styles.page}>
        <PageHeader logoBase64={logoBase64} />

        {/* Current Charges table */}
        <View style={styles.tableWrap}>
          <Text style={styles.tableTitle}>CURRENT CHARGES</Text>
          {/* Header row */}
          <View style={styles.tableRow}>
            <View style={[styles.th, { width: chargeWidths[0] }]}><Text>Monthly Rental / Item Description</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[1] }]}><Text>Unit Price</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[2] }]}><Text>Quantity</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[3] }]}><Text>Total</Text></View>
          </View>
          {/* Line items */}
          {items.map((it, i) => (
            <TRow
              key={i}
              cells={[
                safe(it.description),
                num(it.unitPrice).toFixed(2),
                num(it.quantity ?? 1).toFixed(2),
                num(it.total ?? num(it.unitPrice) * num(it.quantity ?? 1)).toFixed(2),
              ]}
              colWidths={chargeWidths}
              rightCols={[1, 2, 3]}
            />
          ))}
          {/* Discounts */}
          {discounts.map((disc, i) => (
            <TRow
              key={`d${i}`}
              cells={[safe(disc.description), '', '', `(${(Math.round(num(disc.amount) * 100) / 100).toFixed(2)})`]}
              colWidths={chargeWidths}
              rightCols={[3]}
            />
          ))}
          {/* Summary rows */}
          <TSummaryRow label="Monthly Rental Total" value={monthlyRentalTotalDiscounted.toFixed(2)} />
          <TSummaryRow label="Call Charges (VoIP)" value={voipCallCharges.toFixed(2)} />
          {pstnCallCharges > 0 && (
            <TSummaryRow label="Call Charges (PSTN)" value={pstnCallCharges.toFixed(2)} />
          )}
          <TSummaryRow label="Sub Total" value={curChargesSubTotal.toFixed(2)} />
          <TSummaryRow label={`VAT (${vatPct.toFixed(2)}%)`} value={curChargesVat.toFixed(2)} />
          <TSummaryRow label="Current Month Total" value={curMonthTotalNoOneOff.toFixed(2)} bg={C.thBg} bold />
        </View>

        {/* One-Off Charges table */}
        <View style={styles.tableWrap}>
          <Text style={styles.tableTitle}>ONE-OFF CHARGES</Text>
          <View style={styles.tableRow}>
            <View style={[styles.th, { width: chargeWidths[0] }]}><Text>Description</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[1] }]}><Text>Unit Price</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[2] }]}><Text>Quantity</Text></View>
            <View style={[styles.th, styles.thCenter, { width: chargeWidths[3] }]}><Text>Total</Text></View>
          </View>
          {oneOffRows.length > 0 ? (
            <>
              {oneOffRows.map((it, i) => (
                <TRow
                  key={i}
                  cells={[
                    safe(it.description),
                    num(it.unitPrice).toFixed(2),
                    num(it.quantity ?? 1).toFixed(2),
                    it.rowTotal.toFixed(2),
                  ]}
                  colWidths={chargeWidths}
                  rightCols={[1, 2, 3]}
                />
              ))}
              <TSummaryRow label="Sub Total" value={oneOffSub.toFixed(2)} />
              <TSummaryRow label={`VAT (${vatPct.toFixed(2)}%)`} value={oneOffVat.toFixed(2)} />
              <TSummaryRow label="Current Month Total" value={oneOffTotal.toFixed(2)} bg={C.thBg} bold />
            </>
          ) : (
            <>
              <TRow cells={['Not Applicable', '-', '-', '-']} colWidths={chargeWidths} centerCols={[1, 2, 3]} />
              <TSummaryRow label="Current Month Total" value={oneOff.toFixed(2)} bg={C.thBg} bold />
            </>
          )}
        </View>


        <PageFooter />
      </Page>
      </>
      )}

      {/* ── CDR pages (one per 47 rows, matching original) ── */}
      {cdrs.length > 0 &&
        chunk(cdrs, 47).map((pageRows, pageIdx) => (
          <Page key={`cdr-${pageIdx}`} size="A4" style={styles.page}>
            <PageHeader logoBase64={logoBase64} />

            {/* CDR title + legend */}
            <View style={[styles.tableTitle, { marginBottom: 3 }]}>
              <View style={styles.tableTitleRow}>
                <Text style={{ fontSize: 7.5 }}>VoIP Call Charge Description {cdrPeriod}</Text>
                <View style={styles.cdrLegend}>
                  <View style={styles.cdrLegendItem}>
                    <IncomingArrowIcon />
                    <Text>Indicates incoming</Text>
                  </View>
                  <View style={styles.cdrLegendItem}>
                    <OutgoingArrowIcon />
                    <Text>Indicates outgoing</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CDR table header */}
            <View style={styles.tableRow}>
              {[
                { label: 'In/Out', w: '8%' },
                { label: 'Date & Time', w: '22%' },
                { label: 'Destination Number', w: '22%' },
                { label: 'Location', w: '24%' },
                { label: 'Duration (min)', w: '12%' },
                { label: 'Charges', w: '12%' },
              ].map(({ label, w }) => (
                <View key={label} style={[styles.cdrTh, { width: w }]}>
                  <Text>{label}</Text>
                </View>
              ))}
            </View>

            {/* CDR rows */}
            {pageRows.map((cdr, idx) => {
              const globalIdx = pageIdx * 47 + idx
              const isAlt = globalIdx % 2 === 1

              let location = cdr.calllocation && String(cdr.calllocation).trim() !== ''
                ? safe(cdr.calllocation) : 'Unknown'
              let isParting = false
              if (location.startsWith(' *** ')) { isParting = true; location = location.substring(5) }

              let dt = cdr.calldate || ''
              if (dt && typeof dt === 'string' && dt.includes('T')) {
                const [datePart, timeRaw] = dt.split('T')
                const timePart = timeRaw ? timeRaw.replace('Z', '').substring(0, 8) : ''
                dt = `${datePart}  ${timePart}`
              }

              let durationMinutes = ''
              if (cdr.callduration !== undefined && cdr.callduration !== null) {
                const d = parseFloat(String(cdr.callduration))
                durationMinutes = isNaN(d) ? safe(cdr.callduration) : Math.ceil(d / 60).toString()
              }

              const charges = cdr.callcharges !== undefined ? num(cdr.callcharges).toFixed(2) : ''
              const rowBg = isParting ? C.partingBg : isAlt ? C.altBg : undefined

              return (
                <View key={idx} style={[styles.tableRow, rowBg ? { backgroundColor: rowBg } : {}]}>
                  <View style={[styles.cdrTd, { width: '8%', alignItems: 'center', justifyContent: 'center' }]}>
                    {cdr.incall === 1 ? <IncomingArrowIcon /> : <OutgoingArrowIcon />}
                  </View>
                  <View style={[styles.cdrTd, { width: '22%' }]}><Text>{dt}</Text></View>
                  <View style={[styles.cdrTd, { width: '22%' }]}><Text>{safe(cdr.calldestination)}</Text></View>
                  <View style={[styles.cdrTd, { width: '24%' }]}><Text>{location}</Text></View>
                  <View style={[styles.cdrTd, { width: '12%' }]}><Text>{durationMinutes}</Text></View>
                  <View style={[styles.cdrTd, { width: '12%' }]}><Text>{charges}</Text></View>
                </View>
              )
            })}


            <PageFooter />
          </Page>
        ))
      }
    </Document>
  )
}

// ─── Utility ───────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
