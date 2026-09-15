"use client";

import React, { useState, useEffect } from "react";
import { usePageHeading } from "@/context/PageHeadingContext";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const { setHeading } = usePageHeading();
  
  useEffect(() => {
    setHeading("Reports");
  }, [setHeading]);

  const [reportType, setReportType] = useState("NORMAL");
  
  // Normal/DDTREP state
  const [month, setMonth] = useState(() => (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  
  // MONTHLYCUSTREPORT state
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [includeCustTotal, setIncludeCustTotal] = useState(false);
  const [includePrevCharges, setIncludePrevCharges] = useState(false);
  
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportType === "MONTHLYCUSTREPORT" && customersList.length === 0) {
      setCustomersLoading(true);
      fetch('/api/customers')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCustomersList(data);
          }
        })
        .catch(err => console.error("Error fetching customers:", err))
        .finally(() => setCustomersLoading(false));
    }
  }, [reportType]);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth(); // 0-11
  
  // Generate multi-select months from Jan 2012 to current month
  const multiMonthOptions = React.useMemo(() => {
    const opts = [];
    for (let y = 2012; y <= currentYear; y++) {
      const maxMonth = y === currentYear ? currentMonthIdx : 11;
      for (let m = 0; m <= maxMonth; m++) {
        const mm = (m + 1).toString().padStart(2, '0');
        const monthName = months[m].label;
        opts.push({
          value: `${y}-${mm}`,
          label: `${monthName} ${y}`
        });
      }
    }
    return opts.reverse(); // newest first
  }, [currentYear, currentMonthIdx]);

  const isAdvancedReport = reportType === "MONTHLYCUSTREPORT" || reportType === "USAGEREPORTWITHCHART";

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      let filename = '';
      
      if (isAdvancedReport) {
        if (selectedMonths.length === 0) throw new Error("Please select at least one month");
        
        response = await fetch(`/api/reports/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: reportType,
            months: selectedMonths,
            customers: selectedCustomers, // empty means all
            includeCustTotal,
            includePrevCharges: reportType === "MONTHLYCUSTREPORT" ? includePrevCharges : false
          })
        });
        filename = `Report_${reportType}_${new Date().getTime()}.pdf`;
      } else {
        response = await fetch(`/api/reports/generate?type=${reportType}&month=${year}-${month}`, {
          method: "GET",
        });
        filename = `Report_${reportType}_${year}-${month}.pdf`;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const GenerateButton = (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="w-full mt-6 whitespace-nowrap px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating...
        </>
      ) : (
        "Generate Report"
      )}
    </Button>
  );

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="w-full">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Generate Report</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Report Type & Generate Button */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
              >
                <option value="NORMAL">Customer Invoice Report (NORMAL)</option>
                <option value="DDTREP">Direct Debit Report (DDTREP)</option>
                <option value="NONDDTREP">Non Direct Debit Report (NONDDTREP)</option>
                <option value="MONTHLYCUSTREPORT">Customer Report (Customerwise All Invoice Report)</option>
                <option value="USAGEREPORTWITHCHART">Usage Report (With Chart)</option>
              </select>
            </div>
            
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full md:w-auto whitespace-nowrap px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>

          {!isAdvancedReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
                >
                  {Array.from({ length: 15 }, (_, i) => (currentYear - i).toString()).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isAdvancedReport && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Customers Multi-select */}
              <div className="md:col-span-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Customers
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCustomers([])}
                  >
                    Clear
                  </Button>
                </div>
                {customersLoading ? (
                  <div className="text-sm text-gray-500">Loading customers...</div>
                ) : (
                  <select
                    multiple
                    size={12}
                    value={selectedCustomers}
                    onChange={(e) => {
                      const options = Array.from(e.target.options);
                      const selected = options.filter(o => o.selected).map(o => o.value);
                      setSelectedCustomers(selected);
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
                    style={{ overflowY: 'auto' }}
                  >
                    {customersList.map(c => {
                      const isNonDirectDebit = !c.ddtrefno || c.ddtrefno === '0';
                      const isSuspended = c.isSuspended === 1;
                      
                      let style: any = { whiteSpace: 'normal', padding: '3px 6px' };
                      if (isNonDirectDebit) {
                        style.color = '#B76E00';
                        style.fontWeight = 'bold';
                      }
                      if (isSuspended) {
                        style.backgroundColor = '#ffe6e6';
                      }

                      return (
                        <option key={c.custid} value={c.custid.toString()} style={style}>
                          {c.custid} - {c.custname}
                        </option>
                      );
                    })}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">Ctrl+A to select all · Ctrl+Click for multiple · Shift+Click for range</p>
              </div>

              {/* Months Multi-select */}
              <div className="md:col-span-3">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Months
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedMonths([])}
                  >
                    Clear
                  </Button>
                </div>
                <select
                  multiple
                  size={12}
                  value={selectedMonths}
                  onChange={(e) => {
                    const options = Array.from(e.target.options);
                    const selected = options.filter(o => o.selected).map(o => o.value);
                    setSelectedMonths(selected);
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
                  style={{ overflowY: 'auto' }}
                >
                  {multiMonthOptions.map((m) => (
                    <option key={m.value} value={m.value} style={{ padding: '3px 6px' }}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Ctrl+A to select all · Ctrl+Click for multiple · Shift+Click for range</p>
              </div>
              {/* Options */}
              <div className="md:col-span-3 space-y-3 pt-7">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeCustTotal}
                    onChange={(e) => setIncludeCustTotal(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include Customerwise Total
                  </span>
                </label>

                {reportType === "MONTHLYCUSTREPORT" && (
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={includePrevCharges}
                      onChange={(e) => setIncludePrevCharges(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Previous Charges
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
