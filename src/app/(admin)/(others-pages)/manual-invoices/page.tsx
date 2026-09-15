"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePageHeading } from "@/context/PageHeadingContext"

type ManualInvoiceRow = {
  miid: number
  invoiceno: string
  custid: string
  custname: string
  invoicedate: string
  duedate: string
  vat: number
  total: number
}

const mockInvoices: ManualInvoiceRow[] = []

const ManualInvoicesPage = () => {
  const { setHeading } = usePageHeading()
  const [invoices, setInvoices] = useState<ManualInvoiceRow[]>(mockInvoices)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [confirmDownloadAll, setConfirmDownloadAll] = useState<{ count: number; month: string } | null>(null)
  const [customerActionLoading, setCustomerActionLoading] = useState<'' | 'download-all' | 'delete' | 'download'>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const itemsPerPage = 20

  useEffect(() => {
    setHeading("Manual Invoices")
  }, [setHeading])

  useEffect(() => {
    const loadManualInvoices = async () => {
      setLoading(true)
      setLoadError("")
      try {
        const res = await fetch("/api/manual-invoices")
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load manual invoices")
        }

        const normalized = Array.isArray(data)
          ? data.map((row: any) => ({
              miid: Number(row.miid),
              invoiceno: String(row.invoiceno ?? ""),
              custid: String(row.custid ?? ""),
              custname: String(row.custname ?? ""),
              invoicedate: String(row.invoicedate ?? ""),
              duedate: String(row.duedate ?? ""),
              vat: Number(row.vat ?? 0),
              total: Number(row.total ?? 0),
            }))
          : []

        setInvoices(normalized)
      } catch (error: any) {
        setInvoices([])
        setLoadError(error?.message || "Failed to load manual invoices")
      } finally {
        setLoading(false)
      }
    }

    loadManualInvoices()
  }, [])

  const formatDate = (raw: string) => {
    if (!raw) return ""
    if (raw === "IMMEDIATE") return "Immediate Payment"
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return raw
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const filteredInvoices = invoices.filter((row) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      row.invoiceno.toLowerCase().includes(q) ||
      row.custid.toLowerCase().includes(q) ||
      row.custname.toLowerCase().includes(q)
    )
  })
  const monthFilteredInvoices = monthFilter
    ? filteredInvoices.filter((row) => {
        const date = new Date(row.invoicedate)
        if (Number.isNaN(date.getTime())) return false
        const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        return monthValue === monthFilter
      })
    : filteredInvoices

  const totalPages = Math.ceil(monthFilteredInvoices.length / itemsPerPage)
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, monthFilteredInvoices.length)
  const currentInvoices = monthFilteredInvoices.slice(indexOfFirstItem, indexOfLastItem)

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const monthOptions = (() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const opts: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      opts.push({ value, label })
    }
    return opts
  })()

  const buildManualInvoiceFilename = (custname?: string, invoicedate?: string) => {
    const name = String(custname || '').trim()
    const date = new Date(String(invoicedate || ''))
    if (!name || Number.isNaN(date.getTime())) return ''

    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    return `${name} (${month} ${year})`
  }

  const handleConfirmDownloadAll = async () => {
    if (!confirmDownloadAll) return
    const { month, count } = confirmDownloadAll
    setConfirmDownloadAll(null)

    setCustomerActionLoading('download-all')
    setLoadError(`Downloading ${count} invoice(s)…`)
    try {
      const res = await fetch(`/api/manual-invoices/download-all?month=${encodeURIComponent(month)}`)
      if (!res.ok) {
        let errMessage = `Failed to download all manual invoices: ${res.status}`
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
      const filename = headerFileName || `manual-invoices-${month}.zip`

      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(objectUrl)

      setLoadError(`✓ Downloaded ${filename} containing ${count} invoice(s)`)
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to download all manual invoices')
    } finally {
      setCustomerActionLoading('')
    }
  }

  return (
    <div className="container mx-auto relative">
      <p className="mb-4 text-md text-gray-700">
        A list of manual invoice details for all the customers of Pinevox.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border px-6 border-gray-200 mb-6">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">View Monthly Invoices</label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Months</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Customer Name or Customer ID"
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/manual-invoices/add"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Create Manual Invoice
          </Link>

          <button
            onClick={() => {
              const effectiveCount = monthFilter ? monthFilteredInvoices.length : filteredInvoices.length
              if (!effectiveCount) {
                setLoadError('✕ No manual invoices available in the current list')
                return
              }
              setConfirmDownloadAll({ count: effectiveCount, month: monthFilter || '' })
            }}
            disabled={!invoices.length}
            className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:bg-gray-400 transition"
          >
            {customerActionLoading === 'download-all' ? 'Preparing…' : 'Download All'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
        {loadError ? (
          <p className="px-4 py-2 text-sm text-red-600">{loadError}</p>
        ) : null}
        {confirmDownloadAll ? (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-300 bg-emerald-50 shadow-sm">
            <div className="text-sm text-emerald-900">You are about to download <span className="font-semibold">{confirmDownloadAll.count}</span> invoice(s) from <span className="font-semibold">{confirmDownloadAll.month}</span>. Are you sure you want to continue?</div>
            <div className="flex gap-2">
              <button onClick={handleConfirmDownloadAll} disabled={Boolean(customerActionLoading)} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 transition">Yes, Download All</button>
              <button onClick={() => setConfirmDownloadAll(null)} disabled={Boolean(customerActionLoading)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition">Cancel</button>
            </div>
          </div>
        ) : null}
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Invoice No</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Invoice Date</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Due Date</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">VAT %</TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400">Total</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {currentInvoices.length > 0 ? (
                currentInvoices.map((row) => (
                  <TableRow key={row.miid} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{row.custid}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{row.custname}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const filename = buildManualInvoiceFilename(row.custname, row.invoicedate)
                            const url = `/api/manual-invoices/pdf-html?invoiceNo=${encodeURIComponent(row.invoiceno)}&custid=${encodeURIComponent(row.custid)}${filename ? `&filename=${encodeURIComponent(filename)}` : ''}`
                            window.open(url, '_blank')
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer font-medium"
                        >
                          {row.invoiceno}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">
                        <div className="flex gap-1.5">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                setCustomerActionLoading('download')
                                const filename = buildManualInvoiceFilename(row.custname, row.invoicedate)
                                const url = `/api/manual-invoices/pdf-html?invoiceNo=${encodeURIComponent(row.invoiceno)}&custid=${encodeURIComponent(row.custid)}${filename ? `&filename=${encodeURIComponent(filename)}` : ''}`
                                const res = await fetch(url)
                                if (!res.ok) throw new Error('Failed to download PDF')
                                const blob = await res.blob()
                                const disposition = res.headers.get('content-disposition') || ''
                                const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)
                                const headerFileName = match ? decodeURIComponent(match[1].replace(/\"/g, '')) : ''
                                const downloadName = headerFileName || `${filename || `Manual-Invoice-${row.invoiceno}-${row.custid}`}.pdf`
                                const objectUrl = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = objectUrl
                                a.download = downloadName
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                window.URL.revokeObjectURL(objectUrl)
                              } catch (err: any) {
                                setLoadError(err?.message || 'Failed to download')
                              } finally {
                                setCustomerActionLoading('')
                              }
                            }}
                            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Download
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm(`Delete manual invoice ${row.invoiceno} for ${row.custname}?`)) return
                              try {
                                setCustomerActionLoading('delete')
                                const res = await fetch(`/api/manual-invoices/delete?miid=${encodeURIComponent(String(row.miid))}`, { method: 'DELETE' })
                                const data = await res.json()
                                if (!res.ok || !data.success) throw new Error(data?.error || data?.message || 'Delete failed')
                                const refreshed = await fetch('/api/manual-invoices')
                                const newData = await refreshed.json()
                                setInvoices(Array.isArray(newData) ? newData.map((r: any) => ({ miid: Number(r.miid), invoiceno: String(r.invoiceno ?? ''), custid: String(r.custid ?? ''), custname: String(r.custname ?? ''), invoicedate: String(r.invoicedate ?? ''), duedate: String(r.duedate ?? ''), vat: Number(r.vat ?? 0), total: Number(r.total ?? 0) })) : [])
                              } catch (err: any) {
                                setLoadError(err?.message || 'Failed to delete')
                              } finally {
                                setCustomerActionLoading('')
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{formatDate(row.invoicedate)}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{formatDate(row.duedate)}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{row.vat}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-gray-800 dark:text-gray-200">{row.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={8} className="py-10 text-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      {loading ? "Loading manual invoices..." : "No manual invoices found yet."}
                    </span>
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{monthFilteredInvoices.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-medium">{indexOfLastItem}</span> of <span className="font-medium">{monthFilteredInvoices.length}</span> results
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManualInvoicesPage
