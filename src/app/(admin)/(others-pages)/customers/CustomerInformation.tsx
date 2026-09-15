import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";

type Customer = {
    custid: number;
    serverid: number;
    cardid: number;
    custname: string;
    addressline1: string;
    addressline2: string;
    addressline3: string;
    city: string;
    pincode: string;
    joindate: string | null;
    invemailto: string | null;
    invemailcc: string | null;
    coremailto: string | null;
    coremailcc: string | null;
    contactmain1: string | null;
    contactmain2: string | null;
    contactperson1: string | null;
    contactno1: string | null;
    isdeleted: number;
    discount: number;
    comments: string | null;
    creditlimit: number;
    overlimitmessage: string | null;
    isdistributor: number;
    isSuspended: number;
    providerid: number;
    vat: number;
    rental_comission: number;
    call_comission: number;
    billtype: number;
};

interface CustomerDrawerProps {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onCustomerUpdated?: () => void;
}

// interface InfoItemProps {
//     label: string;
//     value: string | number | null;
//     className?: string;
// }

// const InfoItem: React.FC<InfoItemProps> = ({ label, value, className = "" }) => (
//     <div className={className}>
//         <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
//         <p className="text-sm font-medium text-gray-800 dark:text-white">{value}</p>
//     </div>
// );

const CustomerInformation: React.FC<CustomerDrawerProps> = ({ customer, isOpen, onClose, onCustomerUpdated }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setShowConfirm(false);
    }, [isOpen, customer]);

    if (!customer) return null;

    const handleDelete = async () => {
        if (!customer) return;
        
        try {
                const response = await fetch(`/api/customers/${customer.custid}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isdeleted: 1, isSuspended: 1 })
                });
                
                if (response.ok) {
                    if (onCustomerUpdated) {
                        onCustomerUpdated();
                    }
                    onClose();
                } else {
                    console.error('Failed to delete customer');
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        setShowConfirm(false);
    };

    return (
        <>
            <div
                className={`fixed top-0 right-0 h-svh w-lvh bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Customer Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-grow">
                        <div className="mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex justify-between">
                            <div >
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                                    {customer.custname}
                                </h3>
                                <h4 className=" text-gray-800 dark:text-white mb-3">
                                    Customer ID: {customer.custid}
                                </h4>
                            </div>
                            <Badge color={customer.isSuspended ? "warning" : "primary"}>
                                {customer.isSuspended ? "Suspended" : "Active"}
                            </Badge>
                        </div>

                        <div className="space-y-8">
                            {/* Basic Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Basic Information</h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-y dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Provider ID</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.providerid}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Server ID</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.serverid}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Card ID</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.cardid}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Join Date</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {customer.joindate
                                                ? new Date(customer.joindate).toLocaleString('en-GB', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Address</h4>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="text-sm text-gray-800 dark:text-white">{customer.addressline1}</p>
                                    {customer.addressline2 && <p className="text-sm text-gray-800 dark:text-white">{customer.addressline2}</p>}
                                    {customer.addressline3 && <p className="text-sm text-gray-800 dark:text-white">{customer.addressline3}</p>}
                                    <p className="text-sm text-gray-800 dark:text-white">
                                        {customer.city}{customer.city && customer.pincode ? ", " : ""}{customer.pincode}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Contact Information</h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-y dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact Person</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.contactperson1 || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact Number</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.contactno1 || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Main Contact 1</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.contactmain1 || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Main Contact 2</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.contactmain2 || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Email Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Email Information</h4>
                                </div>
                                <div className="grid grid-cols-1 divide-y dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invoice Email (To)</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white break-words">{customer.invemailto || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invoice Email (CC)</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white break-words">{customer.invemailcc || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correspondence Email (To)</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white break-words">{customer.coremailto || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correspondence Email (CC)</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white break-words">{customer.coremailcc || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Financial Information</h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-y dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Credit Limit</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.creditlimit || "—"}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.discount || "—"}%</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">VAT</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.vat || "—"}%</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pulse Rate (BillType)</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.billtype || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Commission Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Commission Information</h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rental Commission</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.rental_comission || "—"}%</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Call Commission</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{customer.call_comission || "—"}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Other Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Other Information</h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-y dark:divide-white/[0.05]">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Is Distributor</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {customer.isdistributor ? "Yes" : "No"}
                                        </p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Is Deleted</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {customer.isdeleted ? "Yes" : "No"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            {customer.comments && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                        <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Comments</h4>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap">
                                            {customer.comments }
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Overlimit Message */}
                            {customer.overlimitmessage && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                                        <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">Overlimit Message</h4>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap">
                                            {customer.overlimitmessage}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Inline Delete Confirmation & Button */}
                        <div className="mt-8 flex flex-col items-end">
                            {showConfirm ? (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-md p-3 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm text-red-800 dark:text-red-300 mb-3 text-right">
                                        Are you sure you want to delete this customer <strong>({customer.custname})</strong>?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowConfirm(false)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                    title="Delete Customer"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Overlay when drawer is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-blur-md bg-opacity-30 backdrop-blur-sm transition-all duration-300 z-40"
                    onClick={onClose}
                ></div>
            )}

        </>

    );
};

export default CustomerInformation;