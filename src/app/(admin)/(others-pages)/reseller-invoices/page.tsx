"use client"

import React, { useEffect, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePageHeading } from "@/context/PageHeadingContext"

type InvoiceRow = { [key: string]: any }

const CustomTableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => {
  return <tr className={className} onClick={onClick}>{children}</tr>
}

type FilterType = "all" | "active" | "suspended" | "distributor" | "deleted"

const PROCESS_STORAGE_KEY = 'reseller-invoice-process-state'

type PersistedProcessState = {
  processing: boolean
  processProgress: number
  processMessage: string
  processSelectedMonth: string
  activeProcessTblname: string
  activeProcessReseller: string
  processStartedAt: number
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const itemsPerPage = 50
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const { setHeading } = usePageHeading()
  const [processing, setProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processMessage, setProcessMessage] = useState('')
  // Separate month selector for processing (defaults to previous month)
  const [processSelectedMonth, setProcessSelectedMonth] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  // Inline reprocess confirmation state
  const [confirmReprocess, setConfirmReprocess] = useState<{ tblname: string; count: number } | null>(null)
  const [checkingMonth, setCheckingMonth] = useState(false)
  const [customerActionLoading, setCustomerActionLoading] = useState<'' | 'process' | 'all' | 'details' | 'delete'>('')
  const [rowActionLoading, setRowActionLoading] = useState<{ custid: string; invoiceno: string; action: '' | 'process' | 'all' | 'details' | 'delete' }>({ custid: '', invoiceno: '', action: '' })
  const [distributors, setDistributors] = useState<{ custid: string; custname: string }[]>([])
  const [selectedReseller, setSelectedReseller] = useState<string>('')
  const [activeProcessTblname, setActiveProcessTblname] = useState('')
  const [activeProcessReseller, setActiveProcessReseller] = useState('')
  const [processStartedAt, setProcessStartedAt] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Custom Settings State
  const [showCustomize, setShowCustomize] = useState(false)
  const [customSettings, setCustomSettings] = useState({
    company_name: '',
    logo: '',
    address: '',
    color_theme: '#000000',
    bank_details: '',
    payment_terms: '',
    vat_no: '',
    billing_email: '',
    company_reg_no: '',
    footer_text: '',
    secondary_color: '#EBF2FF'
  })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(PROCESS_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<PersistedProcessState>
      if (!saved.processing && !saved.processMessage) return

      setProcessing(Boolean(saved.processing))
      setProcessProgress(typeof saved.processProgress === 'number' ? saved.processProgress : 0)
      setProcessMessage(saved.processMessage || '')
      if (saved.processSelectedMonth) setProcessSelectedMonth(saved.processSelectedMonth)
      if (saved.activeProcessReseller) setSelectedReseller(saved.activeProcessReseller)
      setActiveProcessTblname(saved.activeProcessTblname || '')
      setActiveProcessReseller(saved.activeProcessReseller || '')
      setProcessStartedAt(typeof saved.processStartedAt === 'number' ? saved.processStartedAt : 0)
    } catch (err) {
      console.error('Failed to restore reseller invoice process state:', err)
      window.localStorage.removeItem(PROCESS_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!processing && !processMessage) {
      window.localStorage.removeItem(PROCESS_STORAGE_KEY)
      return
    }

    const snapshot: PersistedProcessState = {
      processing,
      processProgress,
      processMessage,
      processSelectedMonth,
      activeProcessTblname,
      activeProcessReseller,
      processStartedAt,
    }
    window.localStorage.setItem(PROCESS_STORAGE_KEY, JSON.stringify(snapshot))
  }, [processing, processProgress, processMessage, processSelectedMonth, activeProcessTblname, activeProcessReseller, processStartedAt])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const res = await fetch('/api/reseller-invoice/distributors')
        if (res.ok) {
          const data = await res.json()
          setDistributors(data)
          if (data.length > 0) {
            setSelectedReseller((prev) => prev || String(data[0].custid))
          }
        }
      } catch (err) {
        console.error('Error fetching distributors:', err)
      }
    }
    fetchDistributors()
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedReseller) return
      try {
        const res = await fetch(`/api/reseller-invoice/custom-settings/${selectedReseller}`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setCustomSettings(data)
          } else {
            setCustomSettings({
              company_name: '',
              logo: '',
              address: '',
              color_theme: '#000000',
              bank_details: '',
              payment_terms: '',
              vat_no: '',
              billing_email: '',
              company_reg_no: '',
              footer_text: '',
              secondary_color: '#EBF2FF'
            })
          }
        }
      } catch (err) {
        console.error('Error fetching custom settings:', err)
      }
    }
    fetchSettings()
  }, [selectedReseller])

  useEffect(() => { setHeading("Reseller Invoices") }, [setHeading])

  useEffect(() => {
    if (!processing) return
    if (eventSourceRef.current) return

    const tblname = activeProcessTblname || invoiceTblnameFromCdrYYYYMM(processSelectedMonth)
    const resellerid = activeProcessReseller || selectedReseller
    if (!tblname || !resellerid) return

    const checkIfFinished = async () => {
      try {
        const statusRes = await fetch(`/api/reseller-invoice/process-status?tblname=${encodeURIComponent(tblname)}&resellerid=${encodeURIComponent(resellerid)}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (typeof statusData?.progress === 'number') {
            setProcessProgress(statusData.progress)
          }
          if (statusData?.message) {
            setProcessMessage(statusData.message)
          }
          if (statusData?.active) {
            return
          }
        }

        const res = await fetch(`/api/reseller-invoice/check-month?tblname=${encodeURIComponent(tblname)}&resellerid=${encodeURIComponent(resellerid)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.inprogress) return
        if (!data?.processed) return

        // Avoid false completion while backend just started writing in-progress rows.
        if (processStartedAt && Date.now() - processStartedAt < 8000) return

        setProcessing(false)
        setProcessProgress(100)
        setProcessMessage((prev) => (prev.startsWith('✓') ? prev : '✓ Processing completed'))
        setActiveProcessTblname('')
        setActiveProcessReseller('')
      } catch (err) {
        console.error('Failed to poll reseller invoice process status:', err)
      }
    }

    checkIfFinished()
    const id = window.setInterval(checkIfFinished, 5000)
    return () => window.clearInterval(id)
  }, [processing, activeProcessTblname, activeProcessReseller, processSelectedMonth, selectedReseller, processStartedAt])

  // Columns to exclude from display
  const excludedColumns = [
    'servicenumbers',
    'serviceNumbers',
    'currentcharge',
    'currentcharges',
    'discounts',
    'discount',
    'oneoffitem',
    'oneoffitems',
    'note',
    'notes',
    'custaddress1',
    'custaddress2',
    'custaddress3',
    'custaddress4',
    'custaddress5'
  ]

  // Filter function to check if column should be displayed
  const shouldDisplayColumn = (columnKey: string): boolean => {
    const lowerKey = columnKey.toLowerCase()
    return !excludedColumns.some(excluded => lowerKey.includes(excluded.toLowerCase()))
  }

  const refreshInvoices = async () => {
    if (!selectedReseller) {
      setInvoices([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const url = `/api/reseller-invoice/all-simple?month=${encodeURIComponent(selectedMonth)}&resellerid=${selectedReseller}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.invoices) ? data.invoices : data.invoices || []
      setInvoices(list)
      setTotalCount(data.count || 0)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setInvoices([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshInvoices()
  }, [selectedMonth, selectedReseller])

  const handleInvoiceClick = async (invoiceNo: string, custid: string) => {
    try {
      // Use relative URL for Next.js API route
      const url = `/api/reseller-invoice/pdf-html?invoiceNo=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}&resellerid=${selectedReseller}`

      // Open PDF in new tab
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF')
    }
  }

  const filteredInvoices = invoices.filter((row) => {
    if (!searchTerm || searchTerm.length < 3) return true
    const s = searchTerm.toLowerCase()
    const name = String(row.custcompanyname ?? row.custcompany ?? '').toLowerCase()
    const id = String(row.custid ?? '').toLowerCase()
    return name.includes(s) || id.includes(s)
  })

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, filteredInvoices.length)
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)

  // Get filtered column keys for display
  const getDisplayColumns = (invoice: InvoiceRow): string[] => {
    const keys = Object.keys(invoice).filter(shouldDisplayColumn)
    const keyMap = new Map(keys.map((k) => [k.toLowerCase(), k]))

    const invoiceDateKey = keyMap.get('invoicedate')
    const dueDaysKey = keyMap.get('duedays')
    const totalKey = keyMap.get('total')
    const voipCdrsKey = keyMap.get('voipcdrs')

    if (!invoiceDateKey || !dueDaysKey) return keys

    const ordered = keys.filter(
      (k) => !['total', 'voipcdrs'].includes(k.toLowerCase())
    )

    const dueIndex = ordered.findIndex((k) => k.toLowerCase() === 'duedays')
    if (dueIndex === -1) return ordered

    const insertKeys = [totalKey, voipCdrsKey].filter(Boolean) as string[]
    if (!insertKeys.length) return ordered

    ordered.splice(dueIndex, 0, ...insertKeys)
    return ordered
  }

  const headerLabelMap: Record<string, string> = {
    custid: 'ID',
    custcompanyname: 'Name',
    custcompany: 'Name',
    invoicedate: 'Invoice Date',
    invoiceno: 'Invoice No',
    voip_charges: 'VoIP Charges',
    gamma_charges: 'Gamma Charges',
    usagecharges: 'Usage Charges',
    total: 'Total',
    vat: 'VAT',
    duedays: 'Due Days',
  }

  function getHeaderLabel(key: string) {
    const k = key.toLowerCase()
    if (headerLabelMap[k]) return headerLabelMap[k]
    const spaced = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
    return spaced.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const tblnameFromYYYYMM = (ym: string) => {
    const [year, month] = ym.split('-')
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return `${monthNames[parseInt(month) - 1]}${year}`
  }

  const invoiceTblnameFromCdrYYYYMM = (ym: string) => {
    const [year, month] = ym.split('-')
    const cdrMonthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    cdrMonthDate.setMonth(cdrMonthDate.getMonth() + 1)
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return `${monthNames[cdrMonthDate.getMonth()]}${cdrMonthDate.getFullYear()}`
  }

  const startSSEProcessing = (tblname: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const startedAt = Date.now()
    setProcessing(true)
    setProcessProgress(0)
    setProcessMessage('Starting…')
    setConfirmReprocess(null)
    setActiveProcessTblname(tblname)
    setActiveProcessReseller(selectedReseller)
    setProcessStartedAt(startedAt)

    const url = `/api/reseller-invoice/process-month?tblname=${encodeURIComponent(tblname)}&resellerid=${selectedReseller}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.progress !== undefined) setProcessProgress(data.progress)
        if (data.message) setProcessMessage(data.message)
        if (data.error) {
          setProcessMessage(`✕ ${data.message}`)
          eventSource.close()
          eventSourceRef.current = null
          setProcessing(false)
          setActiveProcessTblname('')
          setActiveProcessReseller('')
        }
        if (data.completed) {
          eventSource.close()
          eventSourceRef.current = null
          setProcessing(false)
          setProcessMessage(`✓ ${data.message}`)
          setActiveProcessTblname('')
          setActiveProcessReseller('')
          void refreshInvoices()
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      eventSourceRef.current = null
      setProcessing(false)
      setActiveProcessTblname('')
      setActiveProcessReseller('')
      setProcessMessage('✕ Connection error during processing')
    }
  }

  const handleProcessClick = async () => {
    if (processing || checkingMonth) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)
    setConfirmReprocess(null)
    setCheckingMonth(true)
    setProcessMessage('')
    try {
      const res = await fetch(`/api/reseller-invoice/check-month?tblname=${encodeURIComponent(tblname)}&resellerid=${selectedReseller}`)
      const data = await res.json()
      if (data.processed || data.inprogress) {
        // Already has data — ask user to confirm deletion
        setConfirmReprocess({ tblname, count: data.count })
      } else {
        startSSEProcessing(tblname)
      }
    } catch (err) {
      setProcessMessage('✕ Failed to check month status')
    } finally {
      setCheckingMonth(false)
    }
  }

  const handleConfirmReprocess = async () => {
    if (!confirmReprocess) return
    const { tblname } = confirmReprocess
    setProcessMessage('Deleting existing invoices…')
    setConfirmReprocess(null)
    try {
      const res = await fetch(`/api/reseller-invoice/delete-month?tblname=${encodeURIComponent(tblname)}&resellerid=${selectedReseller}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Delete failed')
      setProcessMessage(`Deleted ${data.deletedInvoices} invoice(s). Starting reprocessing…`)
      startSSEProcessing(tblname)
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to delete invoices'}`)
    }
  }

  // handleCustomerReprocess, handleProcessCustomer, and handleDeleteCustomerInvoice removed as customer processing is now reseller-wide

  const handleRowReprocess = async (custid: string, invoiceNo: string, invoiceDate: string, mode: 'all' | 'details') => {
    if (processing || rowActionLoading.action) return

    setRowActionLoading({ custid, invoiceno: invoiceNo, action: mode })
    try {
      const res = await fetch(
        `/api/reseller-invoice/reprocess-customer?invoiceno=${encodeURIComponent(invoiceNo)}&invoicedate=${encodeURIComponent(invoiceDate)}&custid=${encodeURIComponent(custid)}&resellerid=${selectedReseller}&mode=${mode}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to reprocess customer')
      }
      setProcessMessage(`✓ ${data.message || 'Customer reprocessed successfully'}`)
      await refreshInvoices()
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to reprocess customer'}`)
    } finally {
      setRowActionLoading({ custid: '', invoiceno: '', action: '' })
    }
  }

  const handleRowDelete = async (custid: string, invoiceNo: string) => {
    if (processing || rowActionLoading.action) return
    const tblname = tblnameFromYYYYMM(selectedMonth)

    setRowActionLoading({ custid, invoiceno: invoiceNo, action: 'delete' })
    try {
      const res = await fetch(
        `/api/reseller-invoice/delete-customer-invoice?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(custid)}&invoiceno=${encodeURIComponent(invoiceNo)}&resellerid=${selectedReseller}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete customer invoice')
      }
      setProcessMessage(`✓ Deleted ${data.deletedInvoices || 0} invoice(s), ${data.deletedDetails || 0} detail row(s)`)
      await refreshInvoices()
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to delete customer invoice'}`)
    } finally {
      setRowActionLoading({ custid: '', invoiceno: '', action: '' })
    }
  }

  const monthOptions = (() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const opts: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      opts.push({ value, label })
    }
    return opts
  })()

  return (
    <div className="container mx-auto relative px-4 py-6">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Distributor Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">Distributor:</label>
            <select
              value={selectedReseller}
              onChange={(e) => { setSelectedReseller(e.target.value); setCurrentPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Select Distributor</option>
              {distributors.map((d) => (
                <option key={d.custid} value={d.custid}>{d.custname} ({d.custid})</option>
              ))}
            </select>
            {selectedReseller && (
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
              >
                {showCustomize ? 'Hide Customization' : 'Customize Invoice'}
              </button>
            )}
          </div>
          {/* View month — controls the table */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">View Monthly Invoices:</label>
            <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1) }} className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm">
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedReseller && showCustomize && (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Customize Invoice for {distributors.find(d => d.custid === selectedReseller)?.custname}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={customSettings.company_name}
                    onChange={(e) => setCustomSettings({ ...customSettings, company_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. PineVox"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={customSettings.address}
                    onChange={(e) => setCustomSettings({ ...customSettings, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder="e.g. Havelock Hub, 14 Havelock Place, Harrow, London HA1 1LJ"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Theme Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customSettings.color_theme || '#000000'}
                          onChange={(e) => setCustomSettings({ ...customSettings, color_theme: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded-lg p-1 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customSettings.color_theme}
                          onChange={(e) => setCustomSettings({ ...customSettings, color_theme: e.target.value })}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Theme Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customSettings.secondary_color || '#EBF2FF'}
                          onChange={(e) => setCustomSettings({ ...customSettings, secondary_color: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded-lg p-1 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customSettings.secondary_color}
                          onChange={(e) => setCustomSettings({ ...customSettings, secondary_color: e.target.value })}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Upload Image)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomSettings({ ...customSettings, logo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                {customSettings.logo && (
                  <div className="mt-2 text-center">
                    <img src={customSettings.logo} alt="Logo Preview" className="h-16 inline-block" />
                    <button onClick={() => setCustomSettings({...customSettings, logo: ''})} className="ml-2 text-red-600 text-xs hover:underline">Remove</button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
                  <textarea
                    value={customSettings.bank_details}
                    onChange={(e) => setCustomSettings({ ...customSettings, bank_details: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder={"e.g. Barclays Bank\nSort Code: 20-37-21\nAccount No: 83788164\nCheques Payable To: Pinevox"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <textarea
                    value={customSettings.payment_terms}
                    onChange={(e) => setCustomSettings({ ...customSettings, payment_terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-16"
                    placeholder={"e.g. Direct Debit (Payment will be taken on or after 15th of this month) - No Action Required"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT No</label>
                    <input type="text" value={customSettings.vat_no} onChange={(e) => setCustomSettings({ ...customSettings, vat_no: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. 985207886" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
                    <input type="email" value={customSettings.billing_email} onChange={(e) => setCustomSettings({ ...customSettings, billing_email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. billing@pinevox.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Reg No</label>
                    <input type="text" value={customSettings.company_reg_no} onChange={(e) => setCustomSettings({ ...customSettings, company_reg_no: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. 07080438" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                    <input type="text" value={customSettings.footer_text} onChange={(e) => setCustomSettings({ ...customSettings, footer_text: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Thank you for your business." />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCustomize(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                   setSavingSettings(true);
                   try {
                     const res = await fetch('/api/reseller-invoice/custom-settings', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ ...customSettings, resellerid: selectedReseller })
                     });
                     if (res.ok) {
                       alert('Settings saved successfully!');
                       setShowCustomize(false);
                     } else {
                       throw new Error('Failed to save');
                     }
                   } catch (err) {
                     alert('Error saving settings');
                   } finally {
                     setSavingSettings(false);
                   }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm transition-all"
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">Process Month:</label>
            <select
              value={processSelectedMonth}
              onChange={(e) => { setProcessSelectedMonth(e.target.value); setConfirmReprocess(null) }}
              disabled={processing || Boolean(customerActionLoading)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white disabled:bg-gray-100"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleProcessClick}
              disabled={processing || checkingMonth || !selectedReseller}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 shadow-sm transition-all"
            >
              {checkingMonth ? 'Checking Month...' : 'Process Invoices'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            placeholder="Search by Name or ID"
            className="border border-gray-300 rounded-lg px-4 py-2 w-72 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-sm font-medium text-gray-500">Found {filteredInvoices.length} invoices</p>
        </div>
      </div>

      {/* Inline reprocess confirmation */}
      {confirmReprocess && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-medium text-amber-800">⚠️ </span>
            <span className="text-amber-800 text-sm">
              <strong>{confirmReprocess.tblname.toUpperCase()}</strong> already has <strong>{confirmReprocess.count}</strong> finalised invoice(s).
              Delete them and reprocess?
            </span>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleConfirmReprocess}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Delete &amp; Reprocess
            </button>
            <button
              onClick={() => setConfirmReprocess(null)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(processing || processMessage) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">{processMessage}</span>
            {processing && <span className="text-sm font-medium text-blue-900">{processProgress}%</span>}
          </div>
          {processing && (
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl p-2 border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {filteredInvoices.length > 0 ? (
                  <>
                    {getDisplayColumns(filteredInvoices[0]).map((k) => {
                      const cells = [
                        <TableCell key={k} isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {getHeaderLabel(k)}
                        </TableCell>
                      ]
                      if (k.toLowerCase() === 'invoiceno') {
                        cells.push(
                          <TableCell key="actions-header" isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            Actions
                          </TableCell>
                        )
                      }
                      return cells
                    }).flat()}
                  </>
                ) : (
                  <TableCell isHeader className="px-4 py-3">No invoices</TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <td colSpan={30} className="text-center py-8">
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  </td>
                </TableRow>
              ) : currentInvoices.length > 0 ? (
                currentInvoices.map((row, idx) => (
                  <CustomTableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]" onClick={() => { }}>
                    {getDisplayColumns(row).map((k) => {
                      const cells = [
                        <TableCell key={k} className="whitespace-nowrap px-4 py-3 text-start">
                          {k.toLowerCase() === 'invoiceno' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInvoiceClick(String(row[k] ?? ''), String(row.custid ?? ''))
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer font-medium"
                            >
                              {String(row[k] ?? '')}
                            </button>
                          ) : (
                            <span className="text-gray-800 dark:text-gray-200">{String(row[k] ?? '')}</span>
                          )}
                        </TableCell>
                      ]
                      if (k.toLowerCase() === 'invoiceno') {
                        cells.push(
                          <TableCell key="actions-cell" className="whitespace-nowrap px-4 py-3 text-start">
                            <div className="flex gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowReprocess(String(row.custid ?? ''), String(row.invoiceno ?? ''), String(row.invoicedate ?? ''), 'all')
                                }}
                                disabled={processing || (rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'all')}
                                className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'all' ? 'Reprocessing…' : 'Reprocess CDRS'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowReprocess(String(row.custid ?? ''), String(row.invoiceno ?? ''), String(row.invoicedate ?? ''), 'details')
                                }}
                                disabled={processing || (rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'details')}
                                className="px-2 py-1 text-xs bg-sky-600 text-white rounded hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'details' ? 'Reprocessing…' : 'Reprocess DETAILS'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowDelete(String(row.custid ?? ''), String(row.invoiceno ?? ''))
                                }}
                                disabled={processing || (rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'delete')}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {rowActionLoading.custid === String(row.custid) && rowActionLoading.invoiceno === String(row.invoiceno) && rowActionLoading.action === 'delete' ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </TableCell>
                        )
                      }
                      return cells
                    }).flat()}
                  </CustomTableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={30} className="text-center py-8">
                    <span className="text-gray-500 dark:text-gray-400">No invoices found for this month</span>
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{totalCount > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-medium">{indexOfLastItem}</span> of <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div className="flex space-x-1">
            <button onClick={prevPage} disabled={currentPage === 1} className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) pageNum = i + 1
              else if (currentPage <= 3) pageNum = i + 1
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
              else pageNum = currentPage - 2 + i
              return (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`inline-flex items-center justify-center w-8 h-8 rounded ${currentPage === pageNum ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "border border-gray-200 bg-white text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"}`}>
                  {pageNum}
                </button>
              )
            })}
            <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0} className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicesPage
