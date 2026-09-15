import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";

interface Customer {
  custid: string;
  custname: string;
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
  { label: "Select Payment Type", value: "" },
  { label: "Cash", value: "CSH" },
  { label: "Cheque", value: "CHQ" },
  { label: "Direct Debit", value: "DDT" },
  { label: "BACS", value: "BAC" },
];

const SERVICE_TYPES = [
  { label: "Select Service Type", value: "" },
  { label: "VoIP", value: "VP" },
  { label: "IT", value: "IT" },
  { label: "Manual Invoice", value: "MI" },
];

export default function EditPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  paymentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentId: number | null;
}) {
  const [formData, setFormData] = useState<PaymentFormData>({
    custid: "",
    paymentdate: "",
    amount: "",
    ptype: "",
    stype: "",
    comments: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [showCalendar, setShowCalendar] = useState(false);

  // Wrap fetchPaymentData in useCallback to fix dependency warning
  const fetchPaymentData = useCallback(async () => {
    if (!paymentId) return;
    
    setIsFetching(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      const data = await response.json();
      
      if (response.ok && data) {
        setFormData({
          custid: data.custid || "",
          paymentdate: data.paymentdate ? data.paymentdate.split('T')[0] : "",
          amount: data.amount ? data.amount.toString() : "",
          ptype: data.ptype || "",
          stype: data.stype || "",
          comments: data.comments || "",
        });
      } else {
        throw new Error(data.error || 'Failed to fetch payment data');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      Swal.fire("Error", "Failed to load payment data", "error");
      onClose();
    } finally {
      setIsFetching(false);
    }
  }, [paymentId, onClose]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error('Failed to fetch customers:', data);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch payment data and customers when modal opens
  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentData();
      fetchCustomers();
    }
  }, [isOpen, paymentId, fetchPaymentData, fetchCustomers]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.custid || String(formData.custid).trim() === '') {
      newErrors.custid = "Customer is required";
    }
    
    if (!formData.paymentdate || String(formData.paymentdate).trim() === '') {
      newErrors.paymentdate = "Payment date is required";
    }
    
    if (!formData.amount || String(formData.amount).trim() === '') {
      newErrors.amount = "Amount is required";
    } else {
      const amount = parseFloat(String(formData.amount));
      if (isNaN(amount) || amount === 0) {
        newErrors.amount = "Amount must be a valid non-zero number";
      }
    }
    
    if (!formData.ptype || String(formData.ptype).trim() === '') {
      newErrors.ptype = "Payment type is required";
    }
    
    if (!formData.stype || String(formData.stype).trim() === '') {
      newErrors.stype = "Service type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: String(value) }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);


  const handleClose = useCallback(() => {
    setFormData({
      custid: "",
      paymentdate: "",
      amount: "",
      ptype: "",
      stype: "",
      comments: "",
    });
    setErrors({});
    setShowCalendar(false);
    onClose();
  }, [onClose]);
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !paymentId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        custid: String(formData.custid),
        paymentdate: String(formData.paymentdate),
        amount: parseFloat(String(formData.amount)),
        ptype: String(formData.ptype),
        stype: String(formData.stype),
        comments: String(formData.comments || '').trim(),
      };

      console.log('Updating payment:', payload);

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Payment update response:', result);

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Payment updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        onSuccess();
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      Swal.fire(
        "Error",
        error instanceof Error ? error.message : "Failed to update payment",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, paymentId, formData, onSuccess, handleClose]);

  const handleDelete = useCallback(async () => {
    if (!paymentId) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this payment!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/payments/${paymentId}`, {
          method: 'DELETE',
        });
        const resData = await response.json();
        
        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Payment has been deleted.",
            timer: 1500,
            showConfirmButton: false,
          });
          onSuccess();
          handleClose();
        } else {
          throw new Error(resData.error || 'Failed to delete payment');
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        Swal.fire(
          "Error",
          error instanceof Error ? error.message : "Failed to delete payment",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [paymentId, onSuccess, handleClose]);



  // Format date for display
  const formatDateForDisplay = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Remove unused variable 'lastDay'
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    handleInputChange('paymentdate', dateString);
    setShowCalendar(false);
  }, [handleInputChange]);

  // Calendar click handler to prevent form submission
  const handleCalendarClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCalendar(!showCalendar);
  }, [showCalendar]);

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const currentMonth = today.getMonth();
  // Remove unused variable 'currentYear'

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      {/* Modal container similar to AddCustomerModal */}
      <div
        className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-4xl p-6 overflow-y-auto rounded-lg"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Payment</h2>
          <button 
            onClick={handleClose} 
            disabled={isSubmitting || isFetching}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Loading State */}
        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Loading payment data...</span>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Payment Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
              <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Dropdown - Using regular select */}
                <div>
                  <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className={isLoading || isSubmitting ? 'opacity-50 pointer-events-none' : ''}
                    style={{ minWidth: "300px" }}
                  >
                    <select
                      value={formData.custid}
                      onChange={(e) => handleInputChange("custid", e.target.value)}
                      disabled={isLoading || isSubmitting}
                      className={`mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                        errors.custid ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">
                        {isLoading ? "Loading customers..." : "Select Customer"}
                      </option>
                      {customers.map(customer => (
                        <option key={customer.custid} value={customer.custid}>
                          {customer.custid} - {customer.custname}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.custid && <p className="mt-1 text-sm text-red-500">{errors.custid}</p>}
                </div>

                {/* Payment Date with Custom Calendar - Fixed */}
                <div className="relative">
                  <label htmlFor="paymentdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="paymentdate"
                      value={formatDateForDisplay(formData.paymentdate)}
                      onClick={handleCalendarClick}
                      placeholder="Select payment date"
                      readOnly
                      disabled={isSubmitting}
                      className={`mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer ${
                        errors.paymentdate ? 'border-red-500' : ''
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Custom Calendar Dropdown */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                      <div className="text-center mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                          {today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </h4>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center font-medium text-gray-500 dark:text-gray-400 p-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days - Fixed to prevent form submission */}
                        {calendarDays.map((date, index) => {
                          const isCurrentMonth = date.getMonth() === currentMonth;
                          const isToday = date.toDateString() === today.toDateString();
                          const isSelected = date.toISOString().split('T')[0] === formData.paymentdate;
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDateSelect(date);
                              }}
                              className={`
                                p-2 text-center rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors
                                ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                                ${isToday ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                                ${isSelected ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : ''}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Quick Actions - Fixed to prevent form submission */}
                      <div className="flex justify-between mt-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDateSelect(new Date());
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCalendar(false);
                          }}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {errors.paymentdate && <p className="mt-1 text-sm text-red-500">{errors.paymentdate}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (£) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    disabled={isSubmitting}
                    className={`mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.amount ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                </div>

                {/* Empty div for spacing */}
                <div></div>
              </div>
            </div>

            {/* Payment Type and Service Type Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
              <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Type - Using regular select */}
                <div>
                  <label htmlFor="paymenttype" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <div className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
                    <select
                      value={formData.ptype}
                      onChange={(e) => handleInputChange("ptype", e.target.value)}
                      disabled={isSubmitting}
                      className={`mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                        errors.ptype ? 'border-red-500' : ''
                      }`}
                    >
                      {PAYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.ptype && <p className="mt-1 text-sm text-red-500">{errors.ptype}</p>}
                </div>

                {/* Service Type - Using regular select */}
                <div>
                  <label htmlFor="servicetype" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <div className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
                    <select
                      value={formData.stype}
                      onChange={(e) => handleInputChange("stype", e.target.value)}
                      disabled={isSubmitting}
                      className={`mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                        errors.stype ? 'border-red-500' : ''
                      }`}
                    >
                      {SERVICE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.stype && <p className="mt-1 text-sm text-red-500">{errors.stype}</p>}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
              <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Additional Information</h3>
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comments
                </label>
                <textarea
                  id="comments"
                  rows={3}
                  placeholder="Enter any additional comments..."
                  value={formData.comments}
                  onChange={(e) => handleInputChange("comments", e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isFetching}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Payment
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Payment"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}