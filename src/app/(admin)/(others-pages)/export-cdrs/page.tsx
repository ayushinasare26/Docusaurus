"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Download, Filter, Search, Users, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { usePageHeading } from "@/context/PageHeadingContext";
import { cn } from "@/lib/utils";

type ExportCustomer = {
  custid: number;
  custname: string;
};

type PresetKey = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function utcNow() {
  return new Date();
}

function toUtcDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
}

function toUtcYmd(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 12, 0, 0));
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12, 0, 0));
}

function getPresetRange(preset: PresetKey): DateRange {
  const now = utcNow();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const d = addUtcDays(today, -1);
      return { from: d, to: d };
    }
    case "last7":
      return { from: addUtcDays(today, -6), to: today };
    case "last30":
      return { from: addUtcDays(today, -29), to: today };
    case "thisMonth":
      return { from: startOfUtcMonth(today), to: today };
    case "lastMonth": {
      const lastMonthAnchor = addUtcDays(startOfUtcMonth(today), -1);
      return { from: startOfUtcMonth(lastMonthAnchor), to: endOfUtcMonth(lastMonthAnchor) };
    }
  }
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Select date range";
  const from = toUtcYmd(range.from);
  const to = range.to ? toUtcYmd(range.to) : from;
  return from === to ? from : `${from} to ${to}`;
}

function csvFilename(range: DateRange | undefined) {
  if (!range?.from) return "cdr-export.csv";
  const from = toUtcYmd(range.from);
  const to = range.to ? toUtcYmd(range.to) : from;
  return `cdr-export-${from}-to-${to}.csv`;
}

export default function ExportCdrsPage() {
  const { setHeading } = usePageHeading();
  const [customers, setCustomers] = useState<ExportCustomer[]>([]);
  const [selectedCustids, setSelectedCustids] = useState<number[]>([]);
  const [customerFilter, setCustomerFilter] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(() => getPresetRange("last7"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const customerButtonRef = useRef<HTMLButtonElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeading("Export CDRs");
  }, [setHeading]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/export-cdrs/customers");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load customers");
        setCustomers(Array.isArray(json.customers) ? json.customers : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load customers");
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(event.target as Node)) {
        setCustomerOpen(false);
      }
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) {
        setRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerFilter.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => `${customer.custid} ${customer.custname}`.toLowerCase().includes(q));
  }, [customerFilter, customers]);

  const applyPreset = (preset: PresetKey) => {
    setRange(getPresetRange(preset));
    setRangeOpen(false);
  };

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
    setRange(
      nextRange
        ? {
            from: nextRange.from ? toUtcDate(nextRange.from) : undefined,
            to: nextRange.to ? toUtcDate(nextRange.to) : undefined,
          }
        : undefined
    );
  };

  const toggleCustomer = (custid: number) => {
    setSelectedCustids((current) =>
      current.includes(custid) ? current.filter((id) => id !== custid) : [...current, custid]
    );
  };

  const handleDownload = async () => {
    if (!range?.from) {
      setError("Select a date range first.");
      return;
    }

    const startDate = toUtcYmd(range.from);
    const endDate = toUtcYmd(range.to ?? range.from);

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      if (selectedCustids.length > 0) {
        params.set("custids", selectedCustids.join(","));
      }

      const res = await fetch(`/api/export-cdrs/download?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to export CSV");
      }

      const blob = await res.blob();
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = csvFilename(range);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(href);
    } catch (err: any) {
      setError(err?.message || "Failed to export CSV");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedCustids.length;
  const customerPopupStyle = customerButtonRef.current
    ? {
        position: "fixed" as const,
        top: customerButtonRef.current.getBoundingClientRect().bottom + 8,
        left: customerButtonRef.current.getBoundingClientRect().left,
        width: 360,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Export CDRs</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Export CSV directly from monthly CDR tables. Select customers, choose a date range, then download.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
        </div>

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_auto] lg:items-start">
          <div className="relative space-y-2" ref={customerRef}>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer</label>
            <button
              ref={customerButtonRef}
              type="button"
              onClick={() => {
                setCustomerOpen((open) => !open);
                setRangeOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-indigo-400 hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                {selectedCount === 0 ? "All customers" : `${selectedCount} selected`}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {customerOpen && (
              <div
                style={customerPopupStyle}
                className="z-30 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    placeholder="Search customer"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="max-h-72 space-y-1 overflow-auto pr-1">
                  {filteredCustomers.map((customer) => {
                    const active = selectedCustids.includes(customer.custid);
                    return (
                      <button
                        key={customer.custid}
                        type="button"
                        onClick={() => toggleCustomer(customer.custid)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                          active
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{customer.custname}</span>
                          <span className="block text-xs text-slate-500">{customer.custid}</span>
                        </span>
                        {active ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-slate-500">No customers found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2" ref={rangeRef}>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRangeOpen((open) => !open);
                  setCustomerOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-indigo-400 hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  {formatRangeLabel(range)}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {rangeOpen && (
                <div className="absolute left-[-160px] top-full z-30 mt-2 w-[760px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      {(["today", "yesterday", "last7", "last30", "thisMonth", "lastMonth"] as PresetKey[]).map(
                        (preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant="outline"
                            className="w-full justify-start rounded-xl"
                            onClick={() => applyPreset(preset)}
                          >
                            {preset === "today" && "Today"}
                            {preset === "yesterday" && "Yesterday"}
                            {preset === "last7" && "Last 7 Days"}
                            {preset === "last30" && "Last 30 Days"}
                            {preset === "thisMonth" && "This Month"}
                            {preset === "lastMonth" && "Last Month"}
                          </Button>
                        )
                      )}
                    </div>
                    <div className="overflow-auto">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={range}
                        onSelect={handleRangeSelect}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-end lg:justify-self-end">
            <div className="h-[28px]" aria-hidden="true" />
            <Button type="button" onClick={handleDownload} disabled={loading} className="h-11 shrink-0 bg-indigo-600 px-5 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500">
              <Download className="h-4 w-4" />
              {loading ? "Preparing CSV..." : "Download CSV"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
