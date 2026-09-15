import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import DatePicker from "@/components/form/date-picker";

interface Customer {
  custid: string;
  custname: string;
  isSuspended?: number;
}

interface PaymentFormData {
  custid: string;
  paymentdate: string;
  amount: string;
  ptype: string;
  stype: string;
  comments: string;
}

const PAYMENT_TYPES = [
  { label: "Direct Debit", value: "DDT" },
  { label: "Cash", value: "CSH" },
  { label: "Cheque", value: "CHQ" },
  { label: "BACS", value: "BAC" },
];

const SERVICE_TYPES = [
  { label: "VoIP Services", value: "VP" },
  { label: "IT Services", value: "IT" },
  { label: "Manual Invoice", value: "MI" },
];

const inputCls = (hasError?: boolean) =>
  `w-full rounded-md border ${
    hasError ? "border-red-500" : "border-gray-300 dark:border-gray-600"
  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`;

export default function AddNewPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<PaymentFormData>({
    custid: "",
    paymentdate: new Date().toISOString().split("T")[0],
    amount: "",
    ptype: "DDT",
    stype: "VP",
    comments: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ---- Load customers when modal opens ---- */
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setFormData({
        custid: "",
        paymentdate: new Date().toISOString().split("T")[0],
        amount: "",
        ptype: "DDT",
        stype: "VP",
        comments: "",
      });
      setCustomerSearch("");
      setSelectedCustomerName("");
      setErrors({});
    }
  }, [isOpen]);

  /* ---- Update suggestions as user types ---- */
  useEffect(() => {
    if (!customerSearch.trim()) {
      setSuggestions(customers.slice(0, 8));
      return;
    }
    const q = customerSearch.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.custname.toLowerCase().includes(q) ||
        String(c.custid).toLowerCase().includes(q)
    );
    setSuggestions(filtered.slice(0, 8));
  }, [customerSearch, customers]);

  /* ---- Close suggestions on outside click ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      const activeCustomers = Array.isArray(data)
        ? data.filter((c: Customer) => c.isSuspended !== 1)
        : [];
      setCustomers(activeCustomers);
    } catch {
      setCustomers([]);
      Swal.fire("Error", "Failed to load customers", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => ({ ...prev, custid: customer.custid }));
    setCustomerSearch(`${customer.custid} - ${customer.custname}`);
    setSelectedCustomerName(customer.custname);
    setShowSuggestions(false);
    if (errors.custid) setErrors((prev) => ({ ...prev, custid: undefined }));
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setFormData((prev) => ({ ...prev, custid: "" }));
    setSelectedCustomerName("");
    setShowSuggestions(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};
    if (!formData.custid) newErrors.custid = "Customer is required";
    if (!formData.paymentdate) newErrors.paymentdate = "Payment date is required";
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) === 0) {
      newErrors.amount = "Enter a valid non-zero amount";
    }
    if (!formData.ptype) newErrors.ptype = "Payment type is required";
    if (!formData.stype) newErrors.stype = "Service type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custid: formData.custid,
          paymentdate: formData.paymentdate,
          amount: parseFloat(formData.amount),
          ptype: formData.ptype,
          stype: formData.stype,
          comments: formData.comments.trim(),
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        Swal.fire({ icon: "success", title: "Payment Added", timer: 1500, showConfirmButton: false });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || "Failed to add payment");
      }
    } catch (error) {
      Swal.fire("Error", error instanceof Error ? error.message : "Failed to add payment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-2xl w-full max-w-2xl rounded-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Add New Payment</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3">

            {/* Customer search — full width */}
            <div className="col-span-2 relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <input
                ref={searchInputRef}
                type="text"
                autoComplete="off"
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={isLoading ? "Loading customers…" : "Search by name or ID…"}
                disabled={isLoading || isSubmitting}
                className={inputCls(!!errors.custid)}
              />
              {/* Suggestion dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-44 overflow-y-auto"
                >
                  {suggestions.map((c) => (
                    <button
                      key={c.custid}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleCustomerSelect(c); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-600 last:border-0"
                    >
                      <span className="font-medium text-blue-600 dark:text-blue-400">{c.custid}</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">{c.custname}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.custid && <p className="mt-1 text-xs text-red-500">{errors.custid}</p>}
              {formData.custid && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ {selectedCustomerName} ({formData.custid})
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                key={isOpen ? "dp-open" : "dp-closed"}
                id="add-payment-date"
                mode="single"
                defaultDate={formData.paymentdate}
                placeholder="YYYY-MM-DD"
                onChange={(selectedDates, dateStr) =>
                  handleInputChange("paymentdate", dateStr)
                }
              />
              {errors.paymentdate && <p className="mt-1 text-xs text-red-500">{errors.paymentdate}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Amount (£) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                disabled={isSubmitting}
                className={inputCls(!!errors.amount)}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ptype}
                onChange={(e) => handleInputChange("ptype", e.target.value)}
                disabled={isSubmitting}
                className={inputCls(!!errors.ptype)}
              >
                {PAYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.ptype && <p className="mt-1 text-xs text-red-500">{errors.ptype}</p>}
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stype}
                onChange={(e) => handleInputChange("stype", e.target.value)}
                disabled={isSubmitting}
                className={inputCls(!!errors.stype)}
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.stype && <p className="mt-1 text-xs text-red-500">{errors.stype}</p>}
            </div>

            {/* Comments — full width */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Comments
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes…"
                value={formData.comments}
                onChange={(e) => handleInputChange("comments", e.target.value)}
                disabled={isSubmitting}
                className={`${inputCls()} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                "Add Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}