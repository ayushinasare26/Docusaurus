"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays } from "lucide-react"
import { usePageHeading } from "@/context/PageHeadingContext"

type Customer = {
  custid: string
  custname: string
}

type ManualInvoiceItem = {
  id: number
  detail: string
  unitPrice: string
  ourPrice: string
  qty: string
}

const makeInitialItem = (): ManualInvoiceItem => ({
  id: Date.now(),
  detail: "",
  unitPrice: "",
  ourPrice: "",
  qty: "1",
})

const AddManualInvoicePage = () => {
  const { setHeading } = usePageHeading()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [invoiceNoRaw, setInvoiceNoRaw] = useState("")
  const [vatRate, setVatRate] = useState(20)
  const [autoFillLoading, setAutoFillLoading] = useState(false)
  const [applyVat, setApplyVat] = useState(true)
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState("IMMEDIATE")
  const [items, setItems] = useState<ManualInvoiceItem[]>([makeInitialItem()])
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const dueDateRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setHeading("Add Manual Invoice")
  }, [setHeading])

  useEffect(() => {
    const loadCustomers = async () => {
      setCustomerLoading(true)
      setCustomerError("")
      try {
        const res = await fetch("/api/customers")
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load customers")
        }

        const normalized = Array.isArray(data)
          ? data
              .map((row: any) => ({
                custid: String(row.custid ?? ""),
                custname: String(row.custname ?? ""),
              }))
              .filter((row: Customer) => row.custid && row.custname)
          : []

        setCustomers(normalized)
      } catch (error: any) {
        setCustomers([])
        setCustomerError(error?.message || "Failed to load customers")
      } finally {
        setCustomerLoading(false)
      }
    }

    loadCustomers()
  }, [])

  useEffect(() => {
    const loadCustomerInvoiceDefaults = async () => {
      if (!customerId) {
        setInvoiceNo("")
        setInvoiceNoRaw("")
        setVatRate(20)
        return
      }

      setAutoFillLoading(true)
      try {
        const res = await fetch(
          `/api/manual-invoices/next-values?custid=${encodeURIComponent(customerId)}`,
        )
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch invoice defaults")
        }

        setInvoiceNo(String(data.invoiceNumber ?? ""))
        setInvoiceNoRaw(String(data.invoiceNumberRaw ?? ""))
        setVatRate(Number(data.vatRate ?? 20))
      } catch {
        setInvoiceNo("")
        setInvoiceNoRaw("")
        setVatRate(20)
      } finally {
        setAutoFillLoading(false)
      }
    }

    loadCustomerInvoiceDefaults()
  }, [customerId])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0
      const qty = Number(item.qty) || 0
      return sum + price * qty
    }, 0)
  }, [items])

  const vatAmount = applyVat ? (subtotal * vatRate) / 100 : 0
  const total = subtotal + vatAmount
  const dueDateLabel = dueDate === "IMMEDIATE" ? "Immediate Payment" : dueDate

  const updateItem = (id: number, field: keyof ManualInvoiceItem, value: string) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const addNewRow = () => {
    setItems((prev) => [...prev, { ...makeInitialItem(), id: Date.now() + prev.length + 1 }])
  }

  const resetForm = (clearMessages = true) => {
    setCustomerId("")
    setInvoiceNo("")
    setInvoiceNoRaw("")
    setVatRate(20)
    setApplyVat(true)
    setInvoiceDate(new Date().toISOString().slice(0, 10))
    setDueDate("IMMEDIATE")
    setItems([makeInitialItem()])
    if (clearMessages) {
      setSubmitError("")
      setSubmitSuccess("")
    }
  }

  const handleSave = async () => {
    setSubmitError("")
    setSubmitSuccess("")

    if (!customerId) {
      setSubmitError("Please select a customer.")
      return
    }

    if (!invoiceNoRaw) {
      setSubmitError("Invoice number is required. Please select a customer to generate it.")
      return
    }

    const validItems = items.filter(
      (item) => item.detail.trim() || Number(item.unitPrice) > 0 || Number(item.qty) > 0,
    )

    if (validItems.length === 0) {
      setSubmitError("Please add at least one line item.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/manual-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custid: customerId,
          invoiceNoRaw,
          invoiceDate,
          dueDate,
          vatRate,
          applyVat,
          items: validItems.map((item) => ({
            detail: item.detail,
            unitPrice: item.unitPrice,
            ourPrice: item.ourPrice,
            qty: item.qty,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save manual invoice")
      }

      resetForm(false)
      setSubmitSuccess("Manual invoice saved successfully.")
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to save manual invoice")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Add Manual Invoice</h1>
        <Link
          href="/manual-invoices"
          className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Back to Manual Invoices
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">For Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{customerLoading ? "Loading customers..." : "Select Customer"}</option>
              {customers.map((customer) => (
                <option key={customer.custid} value={customer.custid}>
                  {customer.custid} - {customer.custname}
                </option>
              ))}
            </select>
            {customerError ? (
              <p className="mt-1 text-xs text-red-600">{customerError}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice No.</label>
            <input
              value={invoiceNo}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-generated after customer selection"
              readOnly
            />
            {invoiceNoRaw ? (
              <p className="mt-1 text-xs text-gray-500">Raw invoice no: {invoiceNoRaw}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">VAT Rate (%)</label>
            <input
              value={String(vatRate)}
              readOnly
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Apply VAT</label>
            <div className="flex items-center gap-5 rounded-md border border-gray-300 px-3 py-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" checked={applyVat} onChange={() => setApplyVat(true)} />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" checked={!applyVat} onChange={() => setApplyVat(false)} />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <div className="relative">
              <input
                type="text"
                value={dueDateLabel}
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setShowDueDatePicker(true)
                  const picker = dueDateRef.current
                  if (picker && typeof (picker as HTMLInputElement).showPicker === "function") {
                    ;(picker as HTMLInputElement).showPicker()
                  }
                }}
                className="absolute inset-y-0 right-2 inline-flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Pick due date"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            {showDueDatePicker ? (
              <div className="mt-2">
                <input
                  ref={dueDateRef}
                  type="date"
                  value={dueDate === "IMMEDIATE" ? "" : dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value || "IMMEDIATE")
                    setShowDueDatePicker(false)
                  }}
                  onBlur={() => setShowDueDatePicker(false)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Description</th>
                <th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Unit Price</th>
                <th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Our Price</th>
                <th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border-b px-3 py-2">
                    <input
                      value={item.detail}
                      onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="border-b px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border-b px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ourPrice}
                      onChange={(e) => updateItem(item.id, "ourPrice", e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border-b px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={addNewRow}
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Add New Row
          </button>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div>Subtotal: {subtotal.toFixed(2)}</div>
            <div>VAT ({applyVat ? String(vatRate) : "0"}%): {vatAmount.toFixed(2)}</div>
            <div className="font-semibold">Total: {total.toFixed(2)}</div>
          </div>
        </div>

        {autoFillLoading ? (
          <p className="mt-2 text-xs text-blue-600">Fetching invoice number and VAT from selected customer...</p>
        ) : null}

        {submitError ? (
          <p className="mt-2 text-sm text-red-600">{submitError}</p>
        ) : null}

        {submitSuccess ? (
          <p className="mt-2 text-sm text-green-600">{submitSuccess}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save & Add"}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Reset
          </button>
          <Link
            href="/manual-invoices"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AddManualInvoicePage
