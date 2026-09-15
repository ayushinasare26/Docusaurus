'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import { usePageHeading } from "@/context/PageHeadingContext";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge/Badge";
import DatePicker from "@/components/form/date-picker";
import EditPaymentModal from "./EditPaymentModal";
import AddNewPaymentModal from "./AddNewPaymentModal";
import { Modal } from "@/components/ui/modal";
import { MessageCircle, PhoneCall } from "lucide-react";

/* -------------------- Types -------------------- */

interface Payment {
  paymentid: number;
  custid: string;
  custname: string;
  paymentdate: string;
  amount: number;
  ptype: string;
  stype: string;
  comments: string;
  processed?: boolean;
}

/* -------------------- Constants -------------------- */

const PAYMENT_TYPE_MAP: Record<string, string> = {
  CSH: "By Cash",
  CHQ: "By Cheque",
  DDT: "By Direct Debit",
  ddt: "By Direct Debit",
  BACS: "By BACS",
  BAC: "By BACS",
};

const SERVICE_TYPE_MAP: Record<string, string> = {
  VP: "VoIP",
  IT: "IT",
  MI: "Manual Invoice",
};

const PAYMENT_TYPE_FILTERS = [
  { label: "All Payment Types", value: "all" },
  { label: "Cash", value: "CSH" },
  { label: "Cheque", value: "CHQ" },
  { label: "Direct Debit", value: "DDT" },
  { label: "BACS", value: "BAC" },
];

const SERVICE_TYPE_FILTERS = [
  { label: "All Service Types", value: "all" },
  { label: "VoIP", value: "VP" },
  { label: "IT", value: "IT" },
  { label: "Manual Invoice", value: "MI" },
];

const STATUS_FILTERS = [
  { label: "All Statuses", value: "all" },
  { label: "Processed", value: "processed" },
  { label: "Unprocessed", value: "unprocessed" },
];

const SEARCH_FIELDS = [
  { label: "By Customer Name", value: "custname" },
  { label: "By Cust ID", value: "custid" },
  { label: "By Payment Type", value: "ptype" },
  { label: "By Amount", value: "amount" },
];

/* -------------------- Component -------------------- */

const PaymentsPage: React.FC = () => {
  const { setHeading } = usePageHeading();

  const [fetchedData, setFetchedData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchField, setSearchField] = useState("custname");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedPayments, setSelectedPayments] = useState<{ [paymentid: number]: Payment }>({});
  const [processMessage, setProcessMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'whatsapp' | 'call' | null>(null);

  /* -------------------- Effects -------------------- */

  useEffect(() => {
    setHeading("Payment Details");
  }, [setHeading]);

  /* -------------------- Data Fetching -------------------- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentTypeFilter !== "all") params.append("ptype", paymentTypeFilter);
      if (serviceTypeFilter !== "all") params.append("stype", serviceTypeFilter);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();
      setFetchedData(Array.isArray(data) ? data : []);
    } catch {
      setFetchedData([]);
    } finally {
      setLoading(false);
    }
  }, [paymentTypeFilter, serviceTypeFilter, fromDate, toDate]);

  const fetchSearchResults = useCallback(async () => {
    if (!debouncedSearchText.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        searchby: searchField,
        searchtext: debouncedSearchText.trim(),
      });

      if (paymentTypeFilter !== "all") params.append("ptype", paymentTypeFilter);
      if (serviceTypeFilter !== "all") params.append("stype", serviceTypeFilter);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();
      setFetchedData(Array.isArray(data) ? data : []);
    } catch {
      setFetchedData([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchText, searchField, paymentTypeFilter, serviceTypeFilter, fromDate, toDate, fetchData]);

  /* Debounced search term updater */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  /* Filter changes */
  useEffect(() => {
    if (debouncedSearchText.trim()) {
      fetchSearchResults();
    } else {
      fetchData();
    }
  }, [
    paymentTypeFilter,
    serviceTypeFilter,
    fromDate,
    toDate,
    debouncedSearchText,
    fetchSearchResults,
    fetchData,
  ]);

  /* -------------------- Derived Data -------------------- */

  const displayedData = useMemo(() => {
    if (statusFilter === "processed") return fetchedData.filter(p => p.processed);
    if (statusFilter === "unprocessed") return fetchedData.filter(p => !p.processed);
    return fetchedData;
  }, [fetchedData, statusFilter]);


  /* -------------------- Handlers -------------------- */

  const handleEdit = useCallback((id: number) => {
    setEditingPaymentId(id);
    setIsEditModalOpen(true);
  }, []);

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPaymentId(null);
    fetchData();
  }, [fetchData]);

  const handleAddModalClose = useCallback(() => {
    setIsAddModalOpen(false);
    fetchData();
  }, [fetchData]);

  const handleSelectPayment = useCallback((payment: Payment) => {
    setSelectedPayments(prev => ({ ...prev, [payment.paymentid]: payment }));
  }, []);

  const handleUnselectPayment = useCallback((paymentid: number) => {
    setSelectedPayments(prev => {
      const next = { ...prev };
      delete next[paymentid];
      return next;
    });
  }, []);

  const isAllVisibleSelected = displayedData.length > 0 && displayedData.every(p => selectedPayments[p.paymentid]);
  const handleSelectAllVisible = useCallback(() => {
    if (isAllVisibleSelected) {
      setSelectedPayments(prev => {
        const next = { ...prev };
        displayedData.forEach(p => delete next[p.paymentid]);
        return next;
      });
    } else {
      setSelectedPayments(prev => {
        const next = { ...prev };
        displayedData.forEach(p => { next[p.paymentid] = p; });
        return next;
      });
    }
  }, [isAllVisibleSelected, displayedData]);

  const handleSendWhatsapp = async () => {
    const selectedList = Object.values(selectedPayments);
    if (selectedList.length === 0) return;
    
    setProcessing(true);
    setProcessMessage('Sending WhatsApp messages to selected customers...');
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: selectedList })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send WhatsApp messages');
      }
      
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.length - successCount;
      setProcessMessage(`✓ WhatsApp messages sent! Success: ${successCount}, Failed: ${failCount}`);
    } catch (err: any) {
      setProcessMessage(`✕ Failed to send WhatsApp messages: ${err.message}`);
    } finally {
      setSelectedPayments({});
      setProcessing(false);
    }
  };

  const handleAICall = async () => {
    const selectedList = Object.values(selectedPayments);
    if (selectedList.length === 0) return;
    
    setProcessing(true);
    setProcessMessage('Initiating AI calls...');
    try {
      const res = await fetch('/api/elevenlabs/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: selectedList })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate AI calls');
      }
      
      setProcessMessage(`✓ AI calls initiated for ${data.recipientCount} customers!`);
    } catch (err: any) {
      setProcessMessage(`✕ Failed to initiate AI calls: ${err.message}`);
    } finally {
      setSelectedPayments({});
      setProcessing(false);
    }
  };

  /* -------------------- Table Columns -------------------- */

  const columns = useMemo(() => [
    {
      id: "select",
      header: (
        <input 
          type="checkbox" 
          checked={isAllVisibleSelected} 
          onChange={handleSelectAllVisible} 
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ),
      className: "w-12 text-center",
      render: (_: unknown, row: Payment) => (
        <input 
          type="checkbox" 
          checked={!!selectedPayments[row.paymentid]} 
          onChange={(e) => {
            if (e.target.checked) handleSelectPayment(row);
            else handleUnselectPayment(row.paymentid);
          }} 
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ),
    },
    { header: "Cust ID", accessor: "custid" },
    { header: "Customer Name", accessor: "custname" },
    {
      header: "Payment Date",
      accessor: "paymentdate",
      render: (v: unknown) =>
        new Date(v as string).toLocaleDateString(),
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (v: unknown) => Number(v).toFixed(2),
    },
    {
      header: "Payment Type",
      accessor: "ptype",
      render: (v: unknown) => (
        <Badge>{PAYMENT_TYPE_MAP[v as string] ?? v}</Badge>
      ),
    },
    {
      header: "Service Type",
      accessor: "stype",
      render: (v: unknown) => (
        <Badge color="light">
          {SERVICE_TYPE_MAP[v as string] ?? v}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "processed",
      render: (v: unknown) => (
        <Badge color={v ? "success" : "warning"}>
          {v ? "Processed" : "Unprocessed"}
        </Badge>
      ),
    },
    {
      header: "Action",
      render: (_: unknown, row: Payment) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEdit(row.paymentid)}
        >
          Edit
        </Button>
      ),
    },
  ], [handleEdit, isAllVisibleSelected, handleSelectAllVisible, selectedPayments, handleSelectPayment, handleUnselectPayment]);

  /* -------------------- Render -------------------- */

  return (
    <>
      {(processMessage || processing) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 whitespace-pre-line">{processMessage}</span>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Row 1: type filters + date range */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={paymentTypeFilter}
            onChange={e => setPaymentTypeFilter(e.target.value)}
            className="h-10 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {PAYMENT_TYPE_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={serviceTypeFilter}
            onChange={e => setServiceTypeFilter(e.target.value)}
            className="h-10 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {SERVICE_TYPE_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {STATUS_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">From</span>
            <div className="w-[160px]">
              <DatePicker
                id="fromDateFilter"
                placeholder="From Date"
                defaultDate={fromDate || undefined}
                onChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const d = new Date(dates[0]);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    setFromDate(d.toISOString().split('T')[0]);
                  } else {
                    setFromDate("");
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">To</span>
            <div className="w-[160px]">
              <DatePicker
                id="toDateFilter"
                placeholder="To Date"
                defaultDate={toDate || undefined}
                onChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const d = new Date(dates[0]);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    setToDate(d.toISOString().split('T')[0]);
                  } else {
                    setToDate("");
                  }
                }}
              />
            </div>
          </div>
          
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline transition-colors ml-2"
            >
              Clear Dates
            </button>
          )}
        </div>

        {/* Row 2: search + total + add button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            className="h-10 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {SEARCH_FIELDS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search..."
            className="h-10 w-[240px] border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />

          <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-3 ml-2">
            <Button
              onClick={() => setConfirmAction('whatsapp')}
              disabled={processing || Object.keys(selectedPayments).length === 0}
              className="h-10 px-4 bg-[#25D366] text-white hover:bg-[#128C7E] disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 shadow-sm flex items-center gap-2 transition-colors rounded-md"
            >
            <MessageCircle className="w-4 h-4" />
            Send Reminder Message
          </Button>

            <Button
              onClick={() => setConfirmAction('call')}
              disabled={processing || Object.keys(selectedPayments).length === 0}
              className="h-10 px-4 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 shadow-sm flex items-center gap-2 transition-colors rounded-md"
            >
              <PhoneCall className="w-4 h-4" />
              Trigger Reminder Call
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-6">
            <Button
              className="h-10 px-5 font-medium shadow-sm transition-colors rounded-md"
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add Payment
            </Button>
          </div>
        </div>
      </div>

      <GenericTablePage<Payment>
        title=""
        data={displayedData}
        loading={loading}
        columns={columns}
        filters={[]}
        searchFields={[]}
      />

      {isEditModalOpen && editingPaymentId !== null && (
        <EditPaymentModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onSuccess={handleEditModalClose}
          paymentId={editingPaymentId}
        />
      )}

      <AddNewPaymentModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSuccess={handleAddModalClose}
      />

      <Modal isOpen={confirmAction !== null} onClose={() => setConfirmAction(null)} className="max-w-[400px] p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Action</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You have selected <strong className="text-gray-900 dark:text-white">{Object.keys(selectedPayments).length}</strong> customer(s). Are you sure you want to {confirmAction === 'whatsapp' ? 'send a reminder message' : 'trigger a reminder call'}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button
            className={confirmAction === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#128C7E] text-white' : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900'}
            onClick={() => {
              const action = confirmAction;
              setConfirmAction(null);
              if (action === 'whatsapp') handleSendWhatsapp();
              else if (action === 'call') handleAICall();
            }}
          >
            {confirmAction === 'whatsapp' ? 'Send Message' : 'Trigger Call'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default PaymentsPage;
