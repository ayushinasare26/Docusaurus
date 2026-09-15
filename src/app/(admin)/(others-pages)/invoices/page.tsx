"use client"

import React, { useEffect, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Mail, Search, Send, FileClock, Users, Filter, CheckSquare, Square, UserRound, X, Play, MinusSquare, Trash2 } from "lucide-react"
import { usePageHeading } from "@/context/PageHeadingContext"
import JSZip from "jszip"
import { Dropdown } from "@/components/ui/dropdown/Dropdown"
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem"

type InvoiceRow = { [key: string]: any }

type DrawerInvoiceRow = {
  invoiceNo: string
  invoiceDate: string
  total: string
  prevbal: string
  paymentreceived: string
}

const CustomTableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => {
  return <tr className={className} onClick={onClick}>{children}</tr>
}

type FilterType = "all" | "active" | "suspended" | "distributor" | "deleted"

const PROCESS_STORAGE_KEY = 'invoice-process-state'

type PersistedProcessState = {
  processing: boolean
  processProgress: number
  processMessage: string
  processSelectedMonth: string
  activeProcessTblname: string
  processStartedAt: number
}

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const uniqueCustomers = Object.values(
    invoices.reduce((acc: Record<string, InvoiceRow>, inv) => {
      const id = String(inv.custid ?? '')
      if (id && !acc[id]) acc[id] = inv
      return acc
    }, {})
  ).filter((inv) => Number(inv.isSuspended ?? 0) !== 1)
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
  const [activeProcessTblname, setActiveProcessTblname] = useState('')
  const [processStartedAt, setProcessStartedAt] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  // Separate month selector for processing (defaults to previous month)
  const [processSelectedMonth, setProcessSelectedMonth] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  // Inline reprocess confirmation state
  const [confirmReprocess, setConfirmReprocess] = useState<{ tblname: string; count: number } | null>(null)
  const [confirmSendAllEmail, setConfirmSendAllEmail] = useState<{ count: number; month: string } | null>(null)
  const [confirmDownloadAll, setConfirmDownloadAll] = useState<{ count: number; month: string } | null>(null)
  const [confirmBulkDownload, setConfirmBulkDownload] = useState<{ count: number } | null>(null)
  const [confirmBulkEmail, setConfirmBulkEmail] = useState<{ count: number } | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<{ count: number } | null>(null)
  const [checkingMonth, setCheckingMonth] = useState(false)
  const [customerIdInput, setCustomerIdInput] = useState('')
  const [customerActionLoading, setCustomerActionLoading] = useState<'' | 'process' | 'all' | 'details' | 'delete' | 'download' | 'email-all' | 'download-all' | 'xero-all'>('')
  const [rowActionLoading, setRowActionLoading] = useState<{ custid: string; invoiceno: string; action: '' | 'process' | 'all' | 'details' | 'download' | 'email' | 'xero' }>({ custid: '', invoiceno: '', action: '' })
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false)
  const [invoiceDrawerLoading, setInvoiceDrawerLoading] = useState(false)
  const [invoiceDrawerCustomer, setInvoiceDrawerCustomer] = useState<{ custid: string; name: string } | null>(null)
  const [invoiceDrawerRows, setInvoiceDrawerRows] = useState<DrawerInvoiceRow[]>([])
  const [invoiceDrawerError, setInvoiceDrawerError] = useState('')
  const [selectedDrawerInvoiceNo, setSelectedDrawerInvoiceNo] = useState('')
  const [selectedMainInvoiceKeys, setSelectedMainInvoiceKeys] = useState<Record<string, boolean>>({})
  const [mainBulkMenuOpen, setMainBulkMenuOpen] = useState(false)
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)
  const [processMonthMenuOpen, setProcessMonthMenuOpen] = useState(false)

  // Bulk process selected customers state
  const [showBulkProcessModal, setShowBulkProcessModal] = useState(false)
  const [bulkProcessCustomers, setBulkProcessCustomers] = useState<{ custid: string; name: string }[]>([])
  const [bulkProcessSelectedIds, setBulkProcessSelectedIds] = useState<{ [custid: string]: boolean }>({})
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkProcessProgress, setBulkProcessProgress] = useState<{ current: number; total: number; currentName: string }>({ current: 0, total: 0, currentName: '' })
  const [bulkProcessResults, setBulkProcessResults] = useState<{ custid: string; name: string; success: boolean; message: string }[]>([])
  const [bulkProcessModalSearch, setBulkProcessModalSearch] = useState('')
  const [bulkProcessCustomersLoading, setBulkProcessCustomersLoading] = useState(false)
  const [bulkProcessPreflight, setBulkProcessPreflight] = useState<{ existingCount: number; existingIds: string[] } | null>(null)
  const [bulkProcessChecking, setBulkProcessChecking] = useState(false)
  const lastBulkStatusRef = useRef<'RUNNING' | 'COMPLETED' | 'FAILED' | ''>('')
  const completedPollStreakRef = useRef(0)

  useEffect(() => { setHeading("Invoices") }, [setHeading])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(PROCESS_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<PersistedProcessState>
      if (!saved.processing && !saved.processMessage) return

      setProcessing(Boolean(saved.processing))
      setBulkProcessing(Boolean(saved.processing))
      setProcessProgress(typeof saved.processProgress === 'number' ? saved.processProgress : 0)
      setProcessMessage(saved.processMessage || '')
      if (saved.processSelectedMonth) setProcessSelectedMonth(saved.processSelectedMonth)
      setActiveProcessTblname(saved.activeProcessTblname || '')
      setProcessStartedAt(typeof saved.processStartedAt === 'number' ? saved.processStartedAt : 0)
    } catch (err) {
      console.error('Failed to restore invoice process state:', err)
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
      processStartedAt,
    }
    window.localStorage.setItem(PROCESS_STORAGE_KEY, JSON.stringify(snapshot))
  }, [processing, processProgress, processMessage, processSelectedMonth, activeProcessTblname, processStartedAt])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const pollProcessStatus = async (tblname?: string, opts?: { refreshOnComplete?: boolean }) => {
    try {
      const statusRes = await fetch(
        tblname
          ? `/api/invoice/process-status?tblname=${encodeURIComponent(tblname)}`
          : '/api/invoice/process-status'
      )
      if (statusRes.status === 404) {
        lastBulkStatusRef.current = ''
        completedPollStreakRef.current = 0
        return
      }
      if (!statusRes.ok) return

      const statusData = await statusRes.json()
      const status = (statusData?.status || '') as 'RUNNING' | 'COMPLETED' | 'FAILED' | ''
      const previousStatus = lastBulkStatusRef.current
      const wasRunning = previousStatus === 'RUNNING'
      lastBulkStatusRef.current = status

      if (typeof statusData?.progress === 'number') {
        setProcessProgress(statusData.progress)
      }

      if (status === 'RUNNING') {
        completedPollStreakRef.current = 0
        setProcessing(true)
        setBulkProcessing(true)
        if (typeof statusData?.processed_customers === 'number' && typeof statusData?.total_customers === 'number') {
          setBulkProcessProgress({
            current: Number(statusData.processed_customers || 0),
            total: Number(statusData.total_customers || 0),
            currentName: '',
          })
        }
        setProcessMessage(
          statusData?.message ||
            `Processing invoices... ${Number(statusData?.processed_customers || 0)}/${Number(statusData?.total_customers || 0)}`
        )
        return
      }

      if (status === 'COMPLETED') {
        const totalCustomers = Number(statusData?.total_customers || 0)
        const processedCustomers = Number(statusData?.processed_customers || 0)
        if (totalCustomers > 0 && processedCustomers < totalCustomers) {
          completedPollStreakRef.current = 0
          setProcessing(true)
          setBulkProcessing(true)
          setProcessProgress(Math.min(99, Number(statusData?.progress || 0)))
          return
        }

        completedPollStreakRef.current += 1
        if (completedPollStreakRef.current < 2) {
          return
        }

        setProcessing(false)
        setBulkProcessing(false)
        setBulkProcessProgress((prev) => ({ ...prev, current: prev.total || prev.current }))
        setProcessProgress(100)
        if (previousStatus !== 'COMPLETED') {
          setProcessMessage('✓ Processing completed')
        }
        setActiveProcessTblname('')
        if (opts?.refreshOnComplete && wasRunning) {
          void refreshInvoices()
        }
        return
      }

      if (status === 'FAILED') {
        completedPollStreakRef.current = 0
        setProcessing(false)
        setBulkProcessing(false)
        setProcessMessage('✕ Processing failed')
        setActiveProcessTblname('')
      }
    } catch (err) {
      console.error('Failed to poll invoice process status:', err)
    }
  }

  useEffect(() => {
    void pollProcessStatus(undefined, { refreshOnComplete: true })
    const warmup = window.setTimeout(() => {
      void pollProcessStatus(undefined, { refreshOnComplete: true })
    }, 300)
    const id = window.setInterval(() => {
      void pollProcessStatus(undefined, { refreshOnComplete: true })
    }, 3000)
    return () => {
      window.clearTimeout(warmup)
      window.clearInterval(id)
    }
  }, [processSelectedMonth, activeProcessTblname])

  // Keep the invoices table limited to the requested columns in the requested order.
  // Remaining columns stay intentionally hidden here.
  const displayColumnOrder = [
    'custid', // ID
    'custcompanyname', // Name
    'custname', // Custname
    'invoiceno', // Invoice No
    'invoicedate', // Invoice Date
    'total', // Total
    'prevbal', // Prevbal

    // Hidden/commented-out columns from the previous dynamic table:
    // 'servicenumbers',
    // 'serviceNumbers',
    // 'currentcharge',
    // 'currentcharges',
    // 'discounts',
    // 'discount',
    // 'oneoffitem',
    // 'oneoffitems',
    // 'note',
    // 'notes',
    // 'custaddress1',
    // 'custaddress2',
    // 'custaddress3',
    // 'custaddress4',
    // 'custaddress5',
    // 'duedays',
    // 'voipcdrs',
  ]

  const refreshInvoices = async () => {
    setLoading(true)
    try {
      const apiBase = ''
      const url = `${apiBase}/api/invoice/all-simple?month=${encodeURIComponent(selectedMonth)}`
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
  }, [selectedMonth])

  const getLatestThreeMonths = (month: string) => {
    const [year, monthPart] = month.split('-')
    const baseDate = new Date(Number(year), Number(monthPart) - 1, 1)
    return [0, 1, 2].map((offset) => {
      const d = new Date(baseDate)
      d.setMonth(d.getMonth() - offset)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }

  const formatMoney = (value: any) => {
    const num = Number(value ?? 0)
    if (Number.isNaN(num)) return String(value ?? '')
    return `${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const loadInvoiceDrawer = async (custid: string, name: string) => {
    setInvoiceDrawerOpen(true)
    setInvoiceDrawerCustomer({ custid, name })
    setInvoiceDrawerLoading(true)
    setInvoiceDrawerError('')
    setInvoiceDrawerRows([])

    try {
      const months = getLatestThreeMonths(selectedMonth)
      const responses = await Promise.all(
        months.map(async (month) => {
          const res = await fetch(`/api/invoice/all-simple?month=${encodeURIComponent(month)}`)
          if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`)
          const data = await res.json()
          return (Array.isArray(data.invoices) ? data.invoices : data.invoices || []) as InvoiceRow[]
        })
      )

      const rows = responses
        .flat()
        .filter((row) => String(row.custid ?? '') === custid)
        .sort((a, b) => String(b.invoicedate ?? '').localeCompare(String(a.invoicedate ?? '')))
        .map((row) => ({
          invoiceNo: String(row.invoiceno ?? ''),
          invoiceDate: String(row.invoicedate ?? ''),
          total: formatMoney(row.total),
          prevbal: formatMoney(row.prevbal),
          paymentreceived: formatMoney(row.paymentreceived),
        }))

      setInvoiceDrawerRows(rows)
      setSelectedDrawerInvoiceNo(rows[0]?.invoiceNo || '')
    } catch (err: any) {
      console.error('Failed to load invoice drawer:', err)
      setInvoiceDrawerError(err?.message || 'Failed to load invoice history')
    } finally {
      setInvoiceDrawerLoading(false)
    }
  }

  const buildInvoiceFilename = (invoiceNo: string, companyName?: string, invoiceDate?: string) => {
    let filename = `invoice-${invoiceNo}.pdf`

    if (companyName && invoiceDate) {
      const dateObj = new Date(invoiceDate)
      const monthName = dateObj.toLocaleString('en-US', { month: 'short' })
      const year = dateObj.getFullYear()
      filename = `${companyName} (${monthName} ${year}).pdf`
    }

    return filename
  }

  const fetchInvoicePdfBlob = async (custid: string, invoiceNo: string) => {
    const url = `/api/invoice/pdf-download?invoiceNo=${encodeURIComponent(invoiceNo)}&custid=${encodeURIComponent(custid)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to download invoice: ${res.status}`)
    }

    return res.blob()
  }

  const handleInvoiceClick = async (invoiceNo: string, custid: string, companyName?: string, invoiceDate?: string) => {
    try {
      const blob = await fetchInvoicePdfBlob(custid, invoiceNo)
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000)
      setProcessMessage(`✓ Opened ${buildInvoiceFilename(invoiceNo, companyName, invoiceDate)}`)
    } catch (err: any) {
      console.error('Error opening invoice PDF:', err)
      setProcessMessage(`✕ ${err.message || 'Failed to open invoice PDF'}`)
    }
  }

  const selectedDrawerRow = invoiceDrawerRows.find((row) => row.invoiceNo === selectedDrawerInvoiceNo) || invoiceDrawerRows[0] || null

  const handleSelectedDrawerReprocess = async (mode: 'all' | 'details') => {
    if (!selectedDrawerRow || !invoiceDrawerCustomer?.custid) return
    await handleRowReprocess(invoiceDrawerCustomer.custid, selectedDrawerRow.invoiceNo, selectedDrawerRow.invoiceDate, mode)
  }

  const filteredInvoices = invoices.filter((row) => {
    if (!searchTerm || searchTerm.length < 3) return true
    const s = searchTerm.toLowerCase()
    const name = String(row.custcompanyname ?? row.custcompany ?? '').toLowerCase()
    const id = String(row.custid ?? '').toLowerCase()
    return name.includes(s) || id.includes(s)
  })

  useEffect(() => {
    setSelectedMainInvoiceKeys({})
  }, [selectedMonth])

  useEffect(() => {
    const handleDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('[data-main-bulk-menu]')) {
        setMainBulkMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, filteredInvoices.length)
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)

  const getMainInvoiceRowKey = (row: InvoiceRow) => `${String(row.custid ?? '')}:${String(row.invoiceno ?? '')}:${String(row.invoicedate ?? '')}`
  const visibleMainRowKeys = filteredInvoices.map(getMainInvoiceRowKey)
  const allMainSelected = visibleMainRowKeys.length > 0 && visibleMainRowKeys.every((key) => selectedMainInvoiceKeys[key])
  const someMainSelected = visibleMainRowKeys.some((key) => selectedMainInvoiceKeys[key]) && !allMainSelected

  const toggleMainInvoiceRow = (row: InvoiceRow) => {
    const key = getMainInvoiceRowKey(row)
    setSelectedMainInvoiceKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllMainInvoices = () => {
    const next = { ...selectedMainInvoiceKeys }
    const shouldSelect = !allMainSelected
    visibleMainRowKeys.forEach((key) => {
      next[key] = shouldSelect
    })
    setSelectedMainInvoiceKeys(next)
  }

  const invertMainInvoices = () => {
    const next = { ...selectedMainInvoiceKeys }
    visibleMainRowKeys.forEach((key) => {
      next[key] = !selectedMainInvoiceKeys[key]
    })
    setSelectedMainInvoiceKeys(next)
  }

  // Get filtered column keys for display, mapped to the explicit order above.
  const getDisplayColumns = (invoice: InvoiceRow): string[] => {
    const keys = Object.keys(invoice)
    const keyMap = new Map(keys.map((k) => [k.toLowerCase(), k]))

    return displayColumnOrder
      .map((column) => {
        if (column === 'actions') return 'actions'
        return keyMap.get(column.toLowerCase())
      })
      .filter(Boolean) as string[]
  }

  const headerLabelMap: Record<string, string> = {
    custid: 'ID',
    custcompanyname: 'Name',
    custcompany: 'Name',
    custname: 'Customer Name',
    invoicedate: 'Invoice Date',
    invoiceno: 'Invoice No',
    voip_charges: 'VoIP Charges',
    gamma_charges: 'Gamma Charges',
    usagecharges: 'Usage Charges',
    total: 'Total',
    prevbal: 'Previous Balance',
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
    setProcessStartedAt(startedAt)

    const url = `/api/invoice/process-month?tblname=${encodeURIComponent(tblname)}`
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
        }
        if (data.completed) {
          eventSource.close()
          eventSourceRef.current = null
          setProcessing(false)
          setProcessMessage(`✓ ${data.message}`)
          setActiveProcessTblname('')
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
      setProcessMessage('✕ Connection error during processing')
    }
  }

  const handleProcessClick = async () => {
    if (processing || checkingMonth) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)
    setConfirmReprocess(null)
    setConfirmSendAllEmail(null)
    setCheckingMonth(true)
    setProcessMessage('')
    try {
      const res = await fetch(`/api/invoice/check-month?tblname=${encodeURIComponent(tblname)}`)
      const data = await res.json()
      if (data.processed || data.inprogress) {
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
      const res = await fetch(`/api/invoice/delete-month?tblname=${encodeURIComponent(tblname)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Delete failed')
      setProcessMessage(`Deleted ${data.deletedInvoices} invoice(s). Starting reprocessing…`)
      startSSEProcessing(tblname)
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to delete invoices'}`)
    }
  }

  const handleCustomerReprocess = async (mode: 'all' | 'details') => {
    const custid = customerIdInput.trim()
    if (!custid || processing || customerActionLoading) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)

    setCustomerActionLoading(mode)
    setProcessMessage(mode === 'all' ? 'Reprocessing all customer CDR/data…' : 'Reprocessing month-end details…')
    try {
      const res = await fetch(
        `/api/invoice/reprocess-customer?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(custid)}&mode=${mode}`,
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
      setCustomerActionLoading('')
    }
  }

  const handleProcessCustomer = async () => {
    const custid = customerIdInput.trim()
    if (!custid || processing || customerActionLoading) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)

    setCustomerActionLoading('process')
    setProcessMessage('Processing full month for selected customer…')
    try {
      const res = await fetch(
        `/api/invoice/process-customer?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(custid)}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to process customer')
      }
      setProcessMessage(`✓ ${data.message || 'Customer processed successfully'}`)
      await refreshInvoices()
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to process customer'}`)
    } finally {
      setCustomerActionLoading('')
    }
  }

  const handleDeleteCustomerInvoice = async () => {
    const custid = customerIdInput.trim()
    if (!custid || processing || customerActionLoading) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)

    setCustomerActionLoading('delete')
    setProcessMessage('Deleting invoice for selected customer…')
    try {
      const res = await fetch(
        `/api/invoice/delete-customer-invoice?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(custid)}`,
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
      setCustomerActionLoading('')
    }
  }

  // Open the bulk process modal and fetch active customers
  const handleOpenBulkProcessModal = async () => {
    if (processing || Boolean(customerActionLoading) || bulkProcessing) return
    setShowBulkProcessModal(true)
    setBulkProcessSelectedIds({})
    setBulkProcessModalSearch('')
    setBulkProcessResults([])
    setBulkProcessCustomersLoading(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      const list: any[] = Array.isArray(data) ? data : (Array.isArray(data.customers) ? data.customers : [])
      const active = list
        .filter((c: any) => !c.isdeleted && Number(c.isSuspended ?? 0) !== 1)
        .map((c: any) => ({
          custid: String(c.custid),
          name: c.custcompanyname || c.custcompany || c.custname || String(c.custid),
        }))
      setBulkProcessCustomers(active)
    } catch (err) {
      setProcessMessage('✕ Failed to fetch customer list')
      setShowBulkProcessModal(false)
    } finally {
      setBulkProcessCustomersLoading(false)
    }
  }

  const handleStartBulkProcess = async () => {
    if (bulkProcessing || bulkProcessChecking) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)
    const customerIds = Object.entries(bulkProcessSelectedIds)
      .filter(([, selected]) => selected)
      .map(([custid]) => custid)

    if (!customerIds.length) return

    setShowBulkProcessModal(false)
    setBulkProcessChecking(true)
    setProcessMessage('Checking for existing invoices…')
    try {
      const checkRes = await fetch('/api/invoice/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tblname, customerIds }),
      })
      const checkData = await checkRes.json()
      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Failed to check existing invoices')
      }
      if (Number(checkData.existingCount || 0) > 0) {
        setBulkProcessPreflight({
          existingCount: Number(checkData.existingCount || 0),
          existingIds: Array.isArray(checkData.existingIds) ? checkData.existingIds.map(String) : [],
        })
        setShowBulkProcessModal(false)
        return
      }

      setProcessMessage('Starting bulk invoice processing…')
      const startRes = await fetch('/api/invoice/process-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tblname, customerIds }),
      })
      const startData = await startRes.json()
      completedPollStreakRef.current = 0
      if (startRes.status === 409) {
        alert('Another operator is already processing this month.')
        setShowBulkProcessModal(false)
        setActiveProcessTblname(tblname)
        setProcessing(true)
        void pollProcessStatus(tblname, { refreshOnComplete: true })
        return
      }
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to start bulk processing')
      }
      setBulkProcessing(true)
      setBulkProcessProgress({ current: 0, total: customerIds.length, currentName: '' })
      setProcessProgress(0)
      setProcessMessage(startData.message || 'Bulk invoice processing started')
      setActiveProcessTblname(tblname)
      setProcessStartedAt(Date.now())
      lastBulkStatusRef.current = 'RUNNING'
      setShowBulkProcessModal(false)
    } catch (err: any) {
      if (err?.message?.includes('409')) {
        alert('Another operator is already processing this month.')
        setShowBulkProcessModal(false)
        setActiveProcessTblname(tblname)
        setProcessing(true)
        void pollProcessStatus(tblname, { refreshOnComplete: true })
        return
      }
      setProcessMessage(`✕ ${err.message || 'Failed to start bulk processing'}`)
    } finally {
      setBulkProcessChecking(false)
    }
  }

  const handleConfirmBulkProcess = async () => {
    if (!bulkProcessPreflight) return
    const tblname = invoiceTblnameFromCdrYYYYMM(processSelectedMonth)
    const customerIds = Object.entries(bulkProcessSelectedIds)
      .filter(([, selected]) => selected)
      .map(([custid]) => custid)
    setBulkProcessPreflight(null)
    setShowBulkProcessModal(false)
    setBulkProcessChecking(true)
    try {
      const startRes = await fetch('/api/invoice/process-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tblname, customerIds }),
      })
      const startData = await startRes.json()
      completedPollStreakRef.current = 0
      if (startRes.status === 409) {
        alert('Another operator is already processing this month.')
        setShowBulkProcessModal(false)
        setActiveProcessTblname(tblname)
        setProcessing(true)
        void pollProcessStatus(tblname, { refreshOnComplete: true })
        return
      }
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to start bulk processing')
      }
      setBulkProcessing(true)
      setBulkProcessProgress({ current: 0, total: customerIds.length, currentName: '' })
      setProcessProgress(0)
      setProcessMessage(startData.message || 'Bulk invoice processing started')
      setActiveProcessTblname(tblname)
      setProcessStartedAt(Date.now())
      lastBulkStatusRef.current = 'RUNNING'
    } catch (err: any) {
      if (err?.message?.includes('409')) {
        alert('Another operator is already processing this month.')
        setShowBulkProcessModal(false)
        setActiveProcessTblname(tblname)
        setProcessing(true)
        void pollProcessStatus(tblname, { refreshOnComplete: true })
        return
      }
      setProcessMessage(`✕ ${err.message || 'Failed to start bulk processing'}`)
    } finally {
      setBulkProcessChecking(false)
    }
  }

  const handleRowReprocess = async (custid: string, invoiceNo: string, invoiceDate: string, mode: 'all' | 'details') => {
    if (processing || rowActionLoading.action) return

    setRowActionLoading({ custid, invoiceno: invoiceNo, action: mode })
    try {
      const res = await fetch(
        `/api/invoice/reprocess-customer?invoiceno=${encodeURIComponent(invoiceNo)}&invoicedate=${encodeURIComponent(invoiceDate)}&custid=${encodeURIComponent(custid)}&mode=${mode}`,
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

  const getSelectedMainInvoices = () => {
    return invoices.filter((row) => selectedMainInvoiceKeys[getMainInvoiceRowKey(row)])
  }

  const clearMainInvoiceSelection = () => {
    setSelectedMainInvoiceKeys({})
    setConfirmBulkDownload(null)
    setConfirmBulkEmail(null)
    setConfirmBulkDelete(null)
  }

  useEffect(() => {
    if (Object.keys(selectedMainInvoiceKeys).length === 0) {
      setConfirmBulkDownload(null)
      setConfirmBulkEmail(null)
      setConfirmBulkDelete(null)
    }
  }, [selectedMainInvoiceKeys])

  useEffect(() => {
    const selectedVisibleCount = filteredInvoices.filter((row) => selectedMainInvoiceKeys[getMainInvoiceRowKey(row)]).length
    if (selectedVisibleCount === 0) {
      setConfirmBulkDownload(null)
      setConfirmBulkEmail(null)
      setConfirmBulkDelete(null)
    }
  }, [filteredInvoices, selectedMainInvoiceKeys])

  const downloadBlob = (blob: Blob, filename: string) => {
    const objectUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000)
  }

  const downloadSelectedInvoices = async () => {
    const selectedRows = getSelectedMainInvoices()
    if (!selectedRows.length) {
      setProcessMessage('✕ No invoices selected for download')
      return
    }

    setCustomerActionLoading('download')
    try {
      let processed = 0
      let succeeded = 0
      let failed = 0

      if (selectedRows.length === 1) {
        const row = selectedRows[0]
        processed = 1
        const filename = buildInvoiceFilename(
          String(row.invoiceno ?? ''),
          String(row.custcompanyname || row.custcompany || row.custname || ''),
          String(row.invoicedate ?? '')
        )
        try {
          const res = await fetchInvoicePdfBlob(String(row.custid ?? ''), String(row.invoiceno ?? ''))
          downloadBlob(res, filename)
          succeeded = 1
        } catch {
          failed = 1
        }
      } else {
        const zip = new JSZip()
        const downloadName = `invoices-${selectedMonth}.zip`

        for (const row of selectedRows) {
          processed += 1
          const filename = buildInvoiceFilename(
            String(row.invoiceno ?? ''),
            String(row.custcompanyname || row.custcompany || row.custname || ''),
            String(row.invoicedate ?? '')
          )
          try {
            const blob = await fetchInvoicePdfBlob(String(row.custid ?? ''), String(row.invoiceno ?? ''))
            zip.file(filename, blob)
            succeeded += 1
          } catch {
            failed += 1
          }
        }

        if (succeeded > 0) {
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          downloadBlob(zipBlob, downloadName)
        }
      }

      setProcessMessage(
        `${failed > 0 ? '⚠' : '✓'} Download processed ${processed} invoice(s): ${succeeded} succeeded, ${failed} failed`
      )
    } finally {
      setCustomerActionLoading('')
    }
  }

  const openBulkDownloadConfirm = () => {
    const selectedCount = getSelectedMainInvoices().length
    if (!selectedCount) {
      setProcessMessage('✕ No invoices selected for download')
      return
    }
    setConfirmBulkDownload({ count: selectedCount })
  }

  const handleConfirmBulkDownload = async () => {
    setConfirmBulkDownload(null)
    await downloadSelectedInvoices()
  }

  const openBulkDeleteConfirm = () => {
    const selectedCount = getSelectedMainInvoices().length
    if (!selectedCount) {
      setProcessMessage('✕ No invoices selected for deletion')
      return
    }
    setConfirmBulkDelete({ count: selectedCount })
  }

  const handleConfirmBulkDelete = async () => {
    const selectedRows = getSelectedMainInvoices()
    if (!selectedRows.length) {
      setConfirmBulkDelete(null)
      return
    }

    setConfirmBulkDelete(null)
    setCustomerActionLoading('delete')
    try {
      const tblname = tblnameFromYYYYMM(selectedMonth)
      const deletePayload = selectedRows.map((row) => ({
        custid: String(row.custid ?? ''),
        invoiceno: String(row.invoiceno ?? ''),
      }))

      let processed = 0
      let succeeded = 0
      let failed = 0

      for (const row of deletePayload) {
        processed += 1
        try {
          const res = await fetch(
            `/api/invoice/delete-customer-invoice?tblname=${encodeURIComponent(tblname)}&custid=${encodeURIComponent(row.custid)}&invoiceno=${encodeURIComponent(row.invoiceno)}`,
            { method: 'DELETE' }
          )
          const data = await res.json()
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete invoice')
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      setProcessMessage(`${
        failed > 0 ? '⚠' : '✓'
      } Delete processed ${processed} invoice(s): ${succeeded} succeeded, ${failed} failed`)
      clearMainInvoiceSelection()
      await refreshInvoices()
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to delete selected invoices'}`)
    } finally {
      setCustomerActionLoading('')
    }
  }

  // Open bulk email modal
  const handleRowPushToXero = async (custid: string, invoiceNo: string) => {
    if (processing || rowActionLoading.action) return

    setRowActionLoading({ custid, invoiceno: invoiceNo, action: 'xero' })
    try {
      const res = await fetch(`${backendBaseUrl}/api/xero/sync-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceno: invoiceNo, custid: custid })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to push to Xero')
      }
      setProcessMessage(`✓ Invoice ${invoiceNo} pushed to Xero successfully!`)
    } catch (err: any) {
      setProcessMessage(`✕ Failed to push to Xero: ${err.message || 'Unknown error'}`)
    } finally {
      setRowActionLoading({ custid: '', invoiceno: '', action: '' })
    }
  }

  const handleSendEmailToAll = () => {
    if (processing || customerActionLoading) return;
    const selectedCount = getSelectedMainInvoices().length
    if (!selectedCount) {
      setProcessMessage('✕ No invoices selected for email');
      return;
    }
    setConfirmBulkEmail({ count: selectedCount })
  }

  const handleConfirmBulkEmail = async () => {
    const selectedRows = getSelectedMainInvoices()
    if (!selectedRows.length) {
      setConfirmBulkEmail(null)
      return
    }

    setConfirmBulkEmail(null)
    setCustomerActionLoading('email-all')
    setProcessMessage('Sending emails for selected invoices...')
    try {
      let processed = 0
      let succeeded = 0
      let failed = 0
      for (const row of selectedRows) {
        processed += 1
        try {
          const res = await fetch(
            `/api/invoice/send-email?invoiceNo=${encodeURIComponent(String(row.invoiceno ?? ''))}&custid=${encodeURIComponent(String(row.custid ?? ''))}`,
            { method: 'POST' }
          )
          const data = await res.json()
          if (!res.ok || !data.success) {
            throw new Error(data.error || data.message || `Failed to send email for invoice ${String(row.invoiceno ?? '')}`)
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      setProcessMessage(`${
        failed > 0 ? '⚠' : '✓'
      } Email processed ${processed} invoice(s): ${succeeded} succeeded, ${failed} failed`)
    } finally {
      setCustomerActionLoading('')
    }
  }

  const handleDownloadAllClick = async () => {
    if (processing || checkingMonth || customerActionLoading) return
    if (!invoices.length) {
      setProcessMessage('✕ No invoices available in the current list')
      return
    }

    setConfirmReprocess(null)
    setConfirmSendAllEmail(null)
    setConfirmDownloadAll({ count: invoices.length, month: selectedMonth })
  }

  const handleConfirmDownloadAll = async () => {
    if (!confirmDownloadAll) return
    const { month, count } = confirmDownloadAll
    setConfirmDownloadAll(null)

    setCustomerActionLoading('download-all')
    setProcessMessage('Preparing all invoices for download…')
    try {
      const res = await fetch(`/api/invoice/download-all?month=${encodeURIComponent(month)}`)
      if (!res.ok) {
        let errMessage = `Failed to download all invoices: ${res.status}`
        try {
          const data = await res.json()
          if (data?.error) errMessage = data.error
        } catch {
          // ignore non-json body
        }
        throw new Error(errMessage)
      }

      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)
      const headerFileName = match ? decodeURIComponent(match[1].replace(/\"/g, '')) : ''
      const filename = headerFileName || `invoices-${month}.zip`

      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(objectUrl)

      setProcessMessage(`✓ Downloaded ${filename} containing ${count} invoice(s)`)
    } catch (err: any) {
      setProcessMessage(`✕ ${err.message || 'Failed to download all invoices'}`)
    } finally {
      setCustomerActionLoading('')
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
    <div className="container mx-auto relative px-2 sm:px-3">
      <p className="mb-4 text-md text-gray-700">
        A list of invoice details for all the customers of Pinevox.
      </p>
      {/* Top Controls */}
      <div className="flex flex-nowrap items-end justify-between gap-2 bg-white py-3 px-4 rounded-xl shadow-sm border border-gray-200 mb-4 overflow-visible">

        {/* Left Section */}
        <div className="flex flex-nowrap items-end gap-2 min-w-max">

          {/* View Monthly Invoices */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              View Monthly Invoices
            </label>
            <div className="relative inline-block w-36 shrink-0 z-20">
              <button
                type="button"
                onClick={() => setMonthMenuOpen((open) => !open)}
                className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <span className="truncate">{monthOptions.find((m) => m.value === selectedMonth)?.label ?? selectedMonth}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <Dropdown
                isOpen={monthMenuOpen}
                onClose={() => setMonthMenuOpen(false)}
                className="left-0 top-full right-auto w-36 max-w-[calc(100vw-1rem)] overflow-y-auto max-h-72"
              >
                {monthOptions.map((m) => (
                  <DropdownItem
                    key={m.value}
                    onClick={() => {
                      setSelectedMonth(m.value)
                      setCurrentPage(1)
                      setMonthMenuOpen(false)
                    }}
                    baseClassName={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      m.value === selectedMonth ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {m.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>
          </div>

          {false && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Process Month</label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={processSelectedMonth}
                    onChange={(e) => {
                      setProcessSelectedMonth(e.target.value);
                      setConfirmReprocess(null);
                      setConfirmSendAllEmail(null);
                      setConfirmDownloadAll(null);
                    }}
                    disabled={processing || Boolean(customerActionLoading)}
                    className="appearance-none border rounded-md px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                <button
                  onClick={handleProcessClick}
                  disabled={processing || checkingMonth || Boolean(customerActionLoading)}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {checkingMonth
                    ? 'Checking…'
                    : processing
                      ? 'Processing…'
                      : 'Process All'}
                </button>
              </div>
            </div>
          )}

          {false && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Customer ID</label>
              <div className="flex items-center gap-2">
                <input
                  value={customerIdInput}
                  onChange={(e) => setCustomerIdInput(e.target.value)}
                  placeholder="e.g. 274101623"
                  disabled={processing || Boolean(customerActionLoading)}
                  className="border rounded-md px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button
                  onClick={handleProcessCustomer}
                  disabled={
                    processing ||
                    Boolean(customerActionLoading) ||
                    !customerIdInput.trim()
                  }
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 transition"
                >
                  {customerActionLoading === 'process'
                    ? 'Processing…'
                    : 'Process'}
                </button>
              </div>
            </div>
          )}

              <button
                onClick={handleOpenBulkProcessModal}
                disabled={
                  processing ||
                  Boolean(customerActionLoading) ||
                  bulkProcessing
                }
                className="h-10 px-3 text-sm font-medium bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:bg-gray-400 transition shrink-0"
              >
                <span className="inline-flex items-center gap-2">
                  <FileClock className="h-4 w-4" />
                  {bulkProcessing
                    ? `Processing ${bulkProcessProgress.current}/${bulkProcessProgress.total}…`
                    : 'Process Invoices'}
                </span>
              </button>
              <button
                onClick={handleSendEmailToAll}
                disabled={processing || Boolean(customerActionLoading) || getSelectedMainInvoices().length === 0}
                className="h-10 px-3 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition shrink-0"
              >
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {customerActionLoading === 'email-all' ? 'Sending…' : 'Send Emails'}
                </span>
              </button>
              <button
                onClick={openBulkDownloadConfirm}
                disabled={processing || Boolean(customerActionLoading) || getSelectedMainInvoices().length === 0}
                className="h-10 px-3 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:bg-gray-400 transition shrink-0"
              >
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {customerActionLoading === 'download' ? 'Preparing…' : 'Download'}
                </span>
              </button>
              <button
                onClick={openBulkDeleteConfirm}
                disabled={processing || Boolean(customerActionLoading) || getSelectedMainInvoices().length === 0}
                className="h-10 px-3 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition shrink-0"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              </button>
              <button
                onClick={async () => {
                  if (!invoices.length || processing || customerActionLoading) return;
                  setCustomerActionLoading('xero-all');
                  setProcessMessage(`Starting bulk push to Xero for ${selectedMonth}...`);
                  try {
                    const res = await fetch(`${backendBaseUrl}/api/xero/bulk-sync-month`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ month: selectedMonth })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to start bulk sync');
                    setProcessMessage(`✓ ${data.message} Please check terminal logs for real-time progress.`);
                  } catch (err: any) {
                    setProcessMessage(`✕ ${err.message}`);
                  } finally {
                    setCustomerActionLoading('');
                  }
                }}
                disabled={processing || checkingMonth || Boolean(customerActionLoading) || invoices.length === 0}
                className="h-10 px-3 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition shrink-0"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {customerActionLoading === 'xero-all' ? 'Pushing…' : 'Push All to Xero'}
                </span>
              </button>
            </div>

        {/* Right Section */}
        <div className="flex items-end w-full sm:w-auto shrink-0">
          <div className="relative w-52 sm:w-60 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Name or ID"
            className="h-10 w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          </div>
        </div>
      </div>

      {/* Inline Reprocess Confirmation */}
      {confirmReprocess && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-amber-800">
              <span className="font-semibold">⚠️ {confirmReprocess.tblname.toUpperCase()}</span>{" "}
              already has{" "}
              <span className="font-semibold">
                {confirmReprocess.count}
              </span>{" "}
              finalized invoice(s). Do you want to delete and reprocess?
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmReprocess}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete & Reprocess
            </button>

            <button
              onClick={() => setConfirmReprocess(null)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {bulkProcessPreflight && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-amber-900">
              <span className="font-semibold">Pre-flight Check</span>
              <br />
              {bulkProcessPreflight.existingCount} selected customer(s) already have finalized invoices.
              This will regenerate them. Continue?
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmBulkProcess}
              disabled={bulkProcessChecking}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {bulkProcessChecking ? 'Checking…' : 'Continue'}
            </button>
            <button
              onClick={() => setBulkProcessPreflight(null)}
              disabled={bulkProcessChecking}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}


      {/* Bulk Process Selected Modal */}
      {showBulkProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-1 inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Process Selected Customers
            </h2>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Process Month
              </label>
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setProcessMonthMenuOpen((open) => !open)}
                  disabled={processing || Boolean(customerActionLoading) || bulkProcessing}
                  className="flex h-10 w-36 items-center justify-between rounded-md border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                >
                  <span className="truncate">{monthOptions.find((m) => m.value === processSelectedMonth)?.label ?? processSelectedMonth}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <Dropdown
                  isOpen={processMonthMenuOpen}
                  onClose={() => setProcessMonthMenuOpen(false)}
                  className="left-0 top-full right-auto w-36 max-w-[calc(100vw-2rem)] overflow-y-auto max-h-72"
                >
                  {monthOptions.map((m) => (
                    <DropdownItem
                      key={m.value}
                      onClick={() => {
                        setProcessSelectedMonth(m.value)
                        setConfirmReprocess(null)
                        setConfirmSendAllEmail(null)
                        setConfirmDownloadAll(null)
                        setProcessMonthMenuOpen(false)
                      }}
                      baseClassName={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        m.value === processSelectedMonth ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {m.label}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Each customer will be processed sequentially for the selected month.
              </p>
            </div>

            {/* Search within modal */}
            <div className="relative mb-3">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={bulkProcessModalSearch}
                onChange={e => setBulkProcessModalSearch(e.target.value)}
                placeholder="Filter customers…"
                className="w-full border rounded-md px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>

            {/* Select All row */}
            {(() => {
              const filtered = bulkProcessCustomers.filter(c =>
                !bulkProcessModalSearch ||
                c.name.toLowerCase().includes(bulkProcessModalSearch.toLowerCase()) ||
                c.custid.includes(bulkProcessModalSearch)
              )
              const selectedCount = Object.values(bulkProcessSelectedIds).filter(Boolean).length
              const filteredSelectedCount = filtered.filter(c => bulkProcessSelectedIds[c.custid]).length
              const allFilteredSelected = filtered.length > 0 && filteredSelectedCount === filtered.length
              const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected
              return (
                <>
                  <div
                    className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 border rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={e => {
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        if (allFilteredSelected) {
                          const next = { ...bulkProcessSelectedIds }
                          filtered.forEach(c => { next[c.custid] = false })
                          setBulkProcessSelectedIds(next)
                        } else {
                          const next = { ...bulkProcessSelectedIds }
                          filtered.forEach(c => { next[c.custid] = true })
                          setBulkProcessSelectedIds(next)
                        }
                      }
                    }}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="h-4 w-4 text-violet-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                    <label className="text-sm font-medium text-gray-700 cursor-pointer select-none pointer-events-none inline-flex items-center gap-2">
                      Select All ({selectedCount} of {bulkProcessCustomers.length} selected)
                    </label>
                  </div>

                  {/* Customer list */}
                  <div className="max-h-64 overflow-y-auto border rounded mb-4">
                    {bulkProcessCustomersLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                      </div>
                    ) : filtered.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">No customers found</p>
                    ) : (
                      <ul>
                        {filtered.map(c => (
                          <li
                            key={c.custid}
                            className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setBulkProcessSelectedIds(prev => ({ ...prev, [c.custid]: !prev[c.custid] }))}
                          >
                            {bulkProcessSelectedIds[c.custid] ? (
                              <CheckSquare className="h-4 w-4 text-violet-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-300" />
                            )}
                            <UserRound className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-400 w-20 shrink-0">{c.custid}</span>
                            <span className="text-sm text-gray-800 truncate">{c.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                <button
                  onClick={handleStartBulkProcess}
                  disabled={selectedCount === 0 || bulkProcessCustomersLoading || bulkProcessChecking}
                  className="px-4 py-2 font-medium bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                      {bulkProcessChecking ? 'Checking…' : `Start Processing (${selectedCount})`}
                </button>
                    <button
                      onClick={() => setShowBulkProcessModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 inline-flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {confirmDownloadAll && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-300 bg-emerald-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-emerald-900">
              <span className="font-semibold">Confirm Bulk Download</span>{" "}
              You are about to download{" "}
              <span className="font-semibold">{confirmDownloadAll.count}</span>{" "}
              invoice(s) from{" "}
              <span className="font-semibold">{confirmDownloadAll.month}</span>. Are you sure you want to continue?
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmDownloadAll}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 transition inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Yes, Download All
            </button>

            <button
              onClick={() => setConfirmDownloadAll(null)}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmBulkDownload && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-300 bg-emerald-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-emerald-900">
              <span className="font-semibold">Download confirmation</span>
              <br />
              You are about to download{" "}
              <span className="font-semibold">{confirmBulkDownload.count}</span>{" "}
              selected invoice(s). Continue?
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmBulkDownload}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 transition inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={() => setConfirmBulkDownload(null)}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmBulkEmail && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-amber-900">
              <span className="font-semibold">Send email confirmation</span>
              <br />
              You are about to send emails for{" "}
              <span className="font-semibold">{confirmBulkEmail.count}</span>{" "}
              selected invoice(s). Continue?
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmBulkEmail}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Mail className="h-4 w-4" />
              Send Emails
            </button>
            <button
              onClick={() => setConfirmBulkEmail(null)}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmBulkDelete && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-300 bg-red-50 shadow-sm">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="text-sm text-red-900">
              <span className="font-semibold">Delete confirmation</span>
              <br />
              You are about to delete{" "}
              <span className="font-semibold">{confirmBulkDelete.count}</span>{" "}
              selected invoice(s). This action cannot be undone.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmBulkDelete}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            <button
              onClick={() => setConfirmBulkDelete(null)}
              disabled={Boolean(customerActionLoading)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {(processing || bulkProcessing || processMessage) && (
        <div className={`my-6 p-4 rounded-lg border ${bulkProcessing
          ? 'bg-violet-50 border-violet-200'
          : 'bg-blue-50 border-blue-200'
          }`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <span className={`text-sm font-medium whitespace-pre-line ${bulkProcessing ? 'text-violet-900' : 'text-blue-900'
              }`}>{processMessage}</span>
            <button
              onClick={() => setProcessMessage('')}
              className={`shrink-0 rounded-md p-1 ${bulkProcessing ? 'text-violet-700 hover:bg-violet-100' : 'text-blue-700 hover:bg-blue-100'}`}
              aria-label="Close process notification"
            >
              <X className="h-4 w-4" />
            </button>
            {(processing || bulkProcessing) && (
              <span className={`text-sm font-medium ${bulkProcessing ? 'text-violet-900' : 'text-blue-900'
                }`}>
                {bulkProcessing
                  ? `${bulkProcessProgress.current}/${bulkProcessProgress.total}`
                  : `${processProgress}%`}
              </span>
            )}
          </div>
          {(processing || bulkProcessing) && (
            <div className={`w-full rounded-full h-2 ${bulkProcessing ? 'bg-violet-200' : 'bg-blue-200'
              }`}>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${bulkProcessing ? 'bg-violet-600' : 'bg-blue-600'
                  }`}
                style={{
                  width: bulkProcessing
                    ? `${bulkProcessProgress.total > 0 ? Math.round((bulkProcessProgress.current / bulkProcessProgress.total) * 100) : 0}%`
                    : `${processProgress}%`
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-xl p-1.5 border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {filteredInvoices.length > 0 ? (
                  <>
                    <TableCell isHeader className="whitespace-nowrap px-3 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="relative flex items-center gap-1" data-main-bulk-menu>
                        <button
                          type="button"
                          onClick={selectAllMainInvoices}
                          className="rounded p-1 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          aria-label="Select all invoices"
                          title="Select all invoices"
                        >
                          {allMainSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : someMainSelected ? (
                            <MinusSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMainBulkMenuOpen((prev) => !prev)}
                          className="rounded p-1 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          aria-label="Bulk actions"
                          title="Bulk actions"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        {mainBulkMenuOpen && (
                          <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-gray-950">
                            <button
                              type="button"
                              onClick={() => {
                                invertMainInvoices()
                                setMainBulkMenuOpen(false)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.05]"
                            >
                              <MinusSquare className="h-4 w-4 text-blue-600" />
                              Invert selection
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {getDisplayColumns(filteredInvoices[0]).map((k) => {
                      if (k === 'actions') {
                        return (
                          <TableCell key="actions-header" isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            Actions
                          </TableCell>
                        )
                      }
                      const cells = [
                        <TableCell key={k} isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {getHeaderLabel(k)}
                        </TableCell>
                      ]
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
                  <CustomTableRow key={idx} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${selectedMainInvoiceKeys[getMainInvoiceRowKey(row)] ? 'bg-blue-50/70 dark:bg-blue-500/10' : ''}`} onClick={() => { }}>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-start">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMainInvoiceRow(row)
                        }}
                        className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        aria-label={selectedMainInvoiceKeys[getMainInvoiceRowKey(row)] ? 'Deselect invoice' : 'Select invoice'}
                        title={selectedMainInvoiceKeys[getMainInvoiceRowKey(row)] ? 'Deselect invoice' : 'Select invoice'}
                      >
                        {selectedMainInvoiceKeys[getMainInvoiceRowKey(row)] ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </TableCell>
                    {getDisplayColumns(row).map((k) => {
                      const cells = [
                        <TableCell key={k} className="whitespace-nowrap px-4 py-3 text-start">
                          {k.toLowerCase() === 'custid' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                loadInvoiceDrawer(
                                  String(row.custid ?? ''),
                                  String(row.custcompanyname ?? row.custcompany ?? row.custname ?? row.custid ?? '')
                                )
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer font-medium"
                            >
                              {String(row[k] ?? '')}
                            </button>
                          ) : k.toLowerCase() === 'invoiceno' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInvoiceClick(
                                  String(row[k] ?? ''),
                                  String(row.custid ?? ''),
                                  String(row.custcompanyname ?? row.custcompany ?? row.custname ?? ''),
                                  String(row.invoicedate ?? '')
                                )
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

        {invoiceDrawerOpen && (
          <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setInvoiceDrawerOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 dark:bg-gray-950 dark:border-white/[0.08]">
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-white/[0.08]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Invoice History</p>
                    <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                      {invoiceDrawerCustomer?.name || 'Customer'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      ID: {invoiceDrawerCustomer?.custid || '-'} · Latest 3 months
                    </p>
                  </div>
                  <button
                    onClick={() => setInvoiceDrawerOpen(false)}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto px-6 py-5">
                  {invoiceDrawerLoading ? (
                    <div className="flex h-48 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white" />
                    </div>
                  ) : invoiceDrawerError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {invoiceDrawerError}
                    </div>
                  ) : invoiceDrawerRows.length > 0 ? (
                    <div>
                      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.08]">
                        <thead className="bg-gray-50 dark:bg-white/[0.03]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Invoice Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Previous Balance</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Payment Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/[0.06] dark:bg-gray-950">
                          {invoiceDrawerRows.map((row) => (
                            <tr
                              key={`${row.invoiceNo}-${row.invoiceDate}`}
                              onClick={() => setSelectedDrawerInvoiceNo(row.invoiceNo)}
                              className={`cursor-pointer transition ${
                                selectedDrawerInvoiceNo === row.invoiceNo ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                              }`}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.invoiceDate}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{row.total}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{row.prevbal}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{row.paymentreceived}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleSelectedDrawerReprocess('all')}
                          disabled={processing || !selectedDrawerRow || (rowActionLoading.custid === String(invoiceDrawerCustomer?.custid || '') && rowActionLoading.invoiceno === selectedDrawerRow?.invoiceNo && rowActionLoading.action === 'all')}
                          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                          <Play className="h-4 w-4" />
                          {rowActionLoading.custid === String(invoiceDrawerCustomer?.custid || '') && rowActionLoading.invoiceno === selectedDrawerRow?.invoiceNo && rowActionLoading.action === 'all' ? 'Reprocessing…' : 'Reprocess CDRS'}
                        </button>
                        <button
                          onClick={() => handleSelectedDrawerReprocess('details')}
                          disabled={processing || !selectedDrawerRow || (rowActionLoading.custid === String(invoiceDrawerCustomer?.custid || '') && rowActionLoading.invoiceno === selectedDrawerRow?.invoiceNo && rowActionLoading.action === 'details')}
                          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:bg-gray-400"
                        >
                          <FileClock className="h-4 w-4" />
                          {rowActionLoading.custid === String(invoiceDrawerCustomer?.custid || '') && rowActionLoading.invoiceno === selectedDrawerRow?.invoiceNo && rowActionLoading.action === 'details' ? 'Reprocessing…' : 'Reprocess DETAILS'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-white/[0.12] dark:text-gray-400">
                      No invoices found for the latest 3 months.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

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
