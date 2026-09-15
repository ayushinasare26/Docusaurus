import React, { useState } from "react";
import { X } from "lucide-react";
import InfoSection from "@/components/ui/info/InfoSection";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Did = {
  didno: number;
  custid: number;
  allocateddate: string | null;
  purchasedate: string | null;
  type: number;
  provider: string;
  location: number;
  isdeleted: number;
  new_didno: number;
  terminationno: number;
  in_ll_callcharge: number;
  in_m_callcharge: number;
  didlocation: string;
  countryid: number;
};

interface DidInformationProps {
  did: Partial<Did> | null;
  isOpen: boolean;
  onClose: () => void;
  onDeallocateSuccess?: () => void;
}

const DidInformation: React.FC<DidInformationProps> = ({ did, isOpen, onClose, onDeallocateSuccess }) => {
  const router = useRouter();
  const [deallocating, setDeallocating] = useState(false);

  if (!did) return null;

  const handleDeallocate = async () => {
    if (!did.didno) return;

    const result = await Swal.fire({
      title: "Deallocate DID?",
      text: `Are you sure you want to remove DID ${did.didno} from the customer?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, deallocate",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm',
        cancelButton: 'my-swal-cancel',
      }
    });

    if (!result.isConfirmed) return;

    setDeallocating(true);
    try {
      const res = await fetch("/api/dids/deallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ didno: did.didno }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to deallocate DID");
      }

      Swal.fire({
        icon: "success",
        title: "Deallocated",
        text: "The DID was deallocated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      if (onDeallocateSuccess) {
        onDeallocateSuccess();
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Deallocation Failed",
        text: error.message || "An unexpected error occurred.",
      });
    } finally {
      setDeallocating(false);
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-svh w-lvh bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">DID Details</h2>
            <button
              onClick={() => {
                router.push(`/dids/add?didno=${did.didno}`);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Edit
            </button>
            {did.custid && Number(did.custid) !== 0 ? (
              <button
                onClick={handleDeallocate}
                disabled={deallocating}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-sm font-medium transition-colors"
              >
                {deallocating ? "Deallocating..." : "Deallocate"}
              </button>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Top Badge */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                DID Number: {did.didno}
              </h3>
              <h4 className="text-gray-800 dark:text-white mb-3">
                Customer ID: {did.custid}
              </h4>
              <h4 className="text-gray-800 dark:text-white mb-3">
                Provider: {did.provider}
              </h4>
            </div>
          </div>

          {/* Basic Information */}
          <InfoSection
            title="Basic Information"
            items={[
              { label: "Allocated Date", value: did.allocateddate },
              { label: "Purchase Date", value: did.purchasedate },
              { label: "Location", value: did.location },
              { label: "Country ID", value: did.countryid },
              { label: "DID Location", value: did.didlocation },
              { label: "Type", value: did.type },
            ]}
          />

          {/* Charges */}
          <InfoSection
            title="Charges and Termination"
            items={[
              { label: "IN LL Call Charge", value: did.in_ll_callcharge },
              { label: "IN M Call Charge", value: did.in_m_callcharge },
              { label: "New DID Number", value: did.new_didno },
              { label: "Termination Number", value: did.terminationno },
            ]}
          />
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-blur-md bg-opacity-30 backdrop-blur-sm transition-all duration-300 z-40"
          onClick={onClose}
        ></div>
      )}
    </>
  );
};

export default DidInformation;
