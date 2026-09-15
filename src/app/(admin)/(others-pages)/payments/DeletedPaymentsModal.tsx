'use client';

import React, { useEffect, useState } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";

// Same Payment interface as your main page
interface Payment {
  paymentid: number;
  custid: string;
  custname: string;
  paymentdate: string;
  amount: number;
  ptype: string;
  stype: string;
  comments: string;
}

// Same mappings as your main page
const PAYMENT_TYPE_MAP: Record<string, string> = {
  'CSH': 'By Cash',
  'CHQ': 'By Cheque', 
  'DDT': 'By Direct Debit',
  'ddt': 'By Direct Debit'
};

const SERVICE_TYPE_MAP: Record<string, string> = {
  'VP': 'VoIP',
  'IT': 'IT'
};

interface DeletedPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeletedPaymentsModal: React.FC<DeletedPaymentsModalProps> = ({ isOpen, onClose }) => {
  const [fetchedData, setFetchedData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch deleted payments (simple - no filters)
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payments?deleted=true`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setFetchedData(data);
      } else {
        console.error('API returned non-array data:', data);
        setFetchedData([]);
      }
    } catch (error) {
      console.error('Failed to fetch deleted payments:', error);
      setFetchedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      // Reset state when modal closes
      setFetchedData([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Calculate total
  const totalAmount = React.useMemo(() => {
    return fetchedData.reduce((sum, payment) => sum + payment.amount, 0);
  }, [fetchedData]);

  // Column definitions without checkbox
  const columns = React.useMemo(() => [
    { 
      header: "Cust ID", 
      accessor: "custid" as keyof Payment 
    },
    { 
      header: "Customer Name", 
      accessor: "custname" as keyof Payment 
    },
    { 
      header: "Payment Date", 
      accessor: "paymentdate" as keyof Payment,
      render: (val: unknown) => {
        const date = val as string;
        return new Date(date).toLocaleDateString();
      }
    },
    { 
      header: "Payment Received", 
      accessor: "amount" as keyof Payment,
      render: (val: unknown) => {
        const amount = val as number;
        return `${amount.toFixed(2)}`;
      }
    },
    {
      header: "Payment Type",
      accessor: "ptype" as keyof Payment,
      render: (val: unknown) => {
        const ptype = val as string;
        return (
          <Badge color="primary">
            {PAYMENT_TYPE_MAP[ptype] || ptype}
          </Badge>
        );
      },
    },
    {
      header: "Service Type",
      accessor: "stype" as keyof Payment,
      render: (val: unknown) => {
        const stype = val as string;
        return (
          <Badge color="light">
            {SERVICE_TYPE_MAP[stype] || stype}
          </Badge>
        );
      },
    },
    { 
      header: "Comments", 
      accessor: "comments" as keyof Payment,
      render: (val: unknown) => {
        const comments = val as string;
        return (
          <span className="max-w-xs truncate" title={comments}>
            {comments}
          </span>
        );
      }
    },
  ], []);

  return (
    <div 
      className={`fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50 ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="bg-white rounded-xl w-[95vw] h-[90vh] relative shadow-lg border border-gray-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Deleted Payment Records</h2>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-auto p-6">
          
          {/* Only render GenericTablePage when modal is open */}
          {isOpen && (
            <GenericTablePage<Payment>
              title=""
              data={fetchedData}
              loading={loading}
              fetchUrl={undefined} // We handle fetching manually
              columns={columns}
              filters={[]} // No filters for deleted payments modal
              searchFields={[]} // No search for deleted payments modal
            />
          )}

          {/* Total amount row */}
          {fetchedData.length > 0 && isOpen && (
            <div className="bg-red-50 p-4 rounded-lg mt-4 border border-red-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg text-red-800">Total Deleted Payment Amount:</span>
                <span className="font-bold text-xl text-red-600">{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DeletedPaymentsModal;