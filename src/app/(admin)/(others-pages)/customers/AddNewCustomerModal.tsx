"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProviderOption = {
    custid: number;
    custname: string;
    isdistributor?: number | boolean | null;
};

// Extended form state with all fields
type CustomerFormState = {
    // customerId: string;
    customerName: string;
    discountType: string;      // e.g., 'percentage' or 'fixed'
    discountValue: string;     // Actual discount amount or percentage value
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    city: string;
    pincode: string;
    joiningDate: string;               // ISO string for date, maps to joindate
    invoiceEmailTo: string;            // maps to invemailto
    invoiceEmailCc: string;            // maps to invemailcc
    correspondenceEmailTo: string;     // maps to coremailto
    correspondenceEmailCc: string;     // maps to coremailcc
    generalContactLine1: string;       // maps to contactmain1
    generalContactLine2: string;       // maps to contactmain2
    contactPersonName1: string;        // maps to contactperson1
    contactPersonNumber1: string;      // maps to contactno1
    contactPersonName2: string;        // maps to contactperson2
    contactPersonNumber2: string;      // maps to contactno2
    contactPersonName3: string;        // maps to contactperson3
    contactPersonNumber3: string;      // maps to contactno3
    contactPersonName4: string;        // maps to contactperson4
    contactPersonNumber4: string;      // maps to contactno4
    serverName: string;                // maps to serverid
    rateCard: string;                  // maps to cardid, e.g., 'defaultRates', 'customRates'
    comments: string;                  // maps to comments

    // Additional fields from original object
    isDeleted: boolean;                // maps to isdeleted
    creditLimit: string;              // maps to creditlimit
    overLimitMessage: string;         // maps to overlimitmessage
    isDistributor: boolean;           // maps to isdistributor
    isSuspended: boolean;             // maps to isSuspended
    providerid: string;               // maps to providerid
    ddtRefNo: string;                 // maps to ddtrefno
    vat: string;                      // maps to vat
    rentalCommission: string;         // maps to rental_comission
    callCommission: string;           // maps to call_comission
    billType: string;                 // maps to billtype
};


const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
    const initialFormState: CustomerFormState = {
        // customerId: "",
        customerName: "",
        discountType: "percentage",
        discountValue: "",
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
        city: "",
        pincode: "",
        joiningDate: "",
        invoiceEmailTo: "",
        invoiceEmailCc: "",
        correspondenceEmailTo: "",
        correspondenceEmailCc: "",
        generalContactLine1: "",
        generalContactLine2: "",
        contactPersonName1: "",
        contactPersonNumber1: "",
        contactPersonName2: "",
        contactPersonNumber2: "",
        contactPersonName3: "",
        contactPersonNumber3: "",
        contactPersonName4: "",
        contactPersonNumber4: "",
        serverName: "",
        rateCard: "defaultRates",
        comments: "",
        // Fix: Add missing properties from CustomerFormState
        isDeleted: false,
        creditLimit: "",
        overLimitMessage: "",
        isDistributor: false,
        isSuspended: false,
        providerid: "274101100",
        ddtRefNo: "",
        vat: "20",
        rentalCommission: "",
        callCommission: "",
        billType: "60",
    };

    const [formData, setFormData] = useState<CustomerFormState>(initialFormState);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
    const [billTypeMenuOpen, setBillTypeMenuOpen] = useState(false);
    const [billTypeMenuRect, setBillTypeMenuRect] = useState<DOMRect | null>(null);
    const billTypeButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const billTypeMenuRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadProviders = async () => {
            try {
                const response = await fetch('/api/reseller/distributors');
                if (!response.ok) return;
                const data = await response.json();
                const list = Array.isArray(data) ? data : [];

                const filtered = list
                    .map((c: any) => ({
                        custid: Number(c.custid),
                        custname: String(c.custname || c.custid),
                        isdistributor: c.isdistributor,
                    }))
                    .sort((a: ProviderOption, b: ProviderOption) => a.custname.localeCompare(b.custname));

                setProviderOptions(filtered);
            } catch (error) {
                console.error('Failed to load service providers:', error);
            }
        };

        loadProviders();
    }, [isOpen]);

    useEffect(() => {
        if (!billTypeMenuOpen) return;

        const closeMenu = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (billTypeButtonRef.current?.contains(target) || billTypeMenuRef.current?.contains(target)) {
                return;
            }
            setBillTypeMenuOpen(false);
        };
        const refreshPosition = () => {
            if (billTypeButtonRef.current) {
                setBillTypeMenuRect(billTypeButtonRef.current.getBoundingClientRect());
            }
        };

        document.addEventListener('mousedown', closeMenu);
        window.addEventListener('resize', refreshPosition);
        window.addEventListener('scroll', refreshPosition, true);

        return () => {
            document.removeEventListener('mousedown', closeMenu);
            window.removeEventListener('resize', refreshPosition);
            window.removeEventListener('scroll', refreshPosition, true);
        };
    }, [billTypeMenuOpen]);

    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

const mappedData = {
  serverid: formData.serverName || 1,
//   cardid: formData.rateCard || null,
  cardid: formData.rateCard === "defaultRates" ? 1 : formData.rateCard === "customRates" ? 2 : null,
  custname: formData.customerName,
  addressline1: formData.addressLine1,
  addressline2: formData.addressLine2,
  addressline3: formData.addressLine3,
  city: formData.city,
  pincode: formData.pincode,
  //MySQL table expects a DATE (or DATETIME) in the format YYYY-MM-DD (or YYYY-MM-DD HH:MM:SS),
  //not an ISO string with time zone (2025-07-23T18:30:00.000Z).
  joindate: formData.joiningDate ? formData.joiningDate.split("T")[0] : null,  invemailto: formData.invoiceEmailTo,
  invemailcc: formData.invoiceEmailCc,
  coremailto: formData.correspondenceEmailTo,
  coremailcc: formData.correspondenceEmailCc,
  contactmain1: formData.generalContactLine1,
  contactmain2: formData.generalContactLine2,
  contactperson1: formData.contactPersonName1,
  contactno1: formData.contactPersonNumber1,
  contactperson2: formData.contactPersonName2,
  contactno2: formData.contactPersonNumber2,
  contactperson3: formData.contactPersonName3,
  contactno3: formData.contactPersonNumber3,
  contactperson4: formData.contactPersonName4,
  contactno4: formData.contactPersonNumber4,
  isdeleted: 0,
  discount: formData.discountValue === "" ? 0 : Number(formData.discountValue),  comments: formData.comments,
  creditlimit: null,
  overlimitmessage: null,
    isdistributor: formData.isDistributor ? 1 : 0,
  isSuspended: null,
        providerid: formData.providerid ? Number(formData.providerid) : 274101100,
    ddtrefno: formData.ddtRefNo?.trim() || null,
        vat: formData.vat === "" ? 20 : Number(formData.vat),
        rental_comission: formData.rentalCommission === "" ? 0 : Number(formData.rentalCommission),
        call_comission: formData.callCommission === "" ? 0 : Number(formData.callCommission),
    billtype: formData.billType === "" ? 60 : Number(formData.billType),
};

        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(mappedData),
            });
            if (response.ok) {
                setSuccessMessage("Customer added successfully!");
                setFormData(initialFormState);
                setTimeout(() => {
                  setSuccessMessage("");
                  onClose();
                }, 1500);
            } else {
                setSuccessMessage("");
                console.error("Failed to add new customer");
            }
        } catch (error) {
            setSuccessMessage("");
            console.error("Error adding customer:", error);
        }
    };

    // If modal is not open, render nothing
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
            {successMessage && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50">
                    {successMessage}
                </div>
            )}
            {/* Modal container adjusted to fit in available space and using reduced padding for input boxes */}
            <div
                className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-5xl p-6 overflow-y-auto rounded-lg"
                style={{ maxHeight: "90vh" }}
            >
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Customer</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* <div>
                                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer ID</label>
                                <input type="number" id="customerId" name="customerId" value={formData.customerId} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div> */}
                            <div>
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name <span className="text-red-500">*</span></label>
                                <input type="text" id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Joining Date <span className="text-red-500">*</span></label>
                                <DatePicker
                                    className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                                    selected={formData.joiningDate ? new Date(formData.joiningDate) : null}
                                    onChange={(date: Date | null) => setFormData(prev => ({ ...prev, joiningDate: date ? date.toISOString() : "" }))}
                                    dateFormat={"dd/MM/yyyy"}
                                    placeholderText="Select a date"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ddtRefNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Direct Debit Reference Number</label>
                                <input
                                    type="text"
                                    id="ddtRefNo"
                                    name="ddtRefNo"
                                    value={formData.ddtRefNo}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Address Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 1 <span className="text-red-500">*</span></label>
                                <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} required onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 2</label>
                                <input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="addressLine3" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 3</label>
                                <input type="text" id="addressLine3" name="addressLine3" value={formData.addressLine3} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City <span className="text-red-500">*</span></label>
                                <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pincode <span className="text-red-500">*</span></label>
                                <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Email Contacts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="invoiceEmailTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Email (To) <span className="text-red-500">*</span></label>
                                <input type="email" id="invoiceEmailTo" name="invoiceEmailTo" value={formData.invoiceEmailTo} required onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="invoiceEmailCc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Email (CC)</label>
                                <input type="email" id="invoiceEmailCc" name="invoiceEmailCc" value={formData.invoiceEmailCc} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="correspondenceEmailTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correspondence Email (To) <span className="text-red-500">*</span></label>
                                <input type="email" id="correspondenceEmailTo" name="correspondenceEmailTo" value={formData.correspondenceEmailTo} required onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="correspondenceEmailCc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correspondence Email (CC)</label>
                                <input type="email" id="correspondenceEmailCc" name="correspondenceEmailCc" value={formData.correspondenceEmailCc} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* General Contact Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">General Contact Numbers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="generalContactLine1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Line 1</label>
                                <input type="text" id="generalContactLine1" name="generalContactLine1" value={formData.generalContactLine1} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="generalContactLine2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Line 2</label>
                                <input type="text" id="generalContactLine2" name="generalContactLine2" value={formData.generalContactLine2} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                        </div>
                    </div>
                    {/* Individual Contact Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Individual Contact Numbers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="contactPersonName1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person 1</label>
                                <input type="text" id="contactPersonName1" name="contactPersonName1" value={formData.contactPersonName1} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonNumber1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number 1</label>
                                <input type="tel" id="contactPersonNumber1" name="contactPersonNumber1" value={formData.contactPersonNumber1} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonName2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person 2</label>
                                <input type="text" id="contactPersonName2" name="contactPersonName2" value={formData.contactPersonName2} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonNumber2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number 2</label>
                                <input type="tel" id="contactPersonNumber2" name="contactPersonNumber2" value={formData.contactPersonNumber2} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonName3" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person 3</label>
                                <input type="text" id="contactPersonName3" name="contactPersonName3" value={formData.contactPersonName3} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonNumber3" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number 3</label>
                                <input type="tel" id="contactPersonNumber3" name="contactPersonNumber3" value={formData.contactPersonNumber3} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonName4" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person 4</label>
                                <input type="text" id="contactPersonName4" name="contactPersonName4" value={formData.contactPersonName4} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonNumber4" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number 4</label>
                                <input type="tel" id="contactPersonNumber4" name="contactPersonNumber4" value={formData.contactPersonNumber4} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Other Info Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
                        <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Other Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">VAT</label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="vat"
                                        name="vat"
                                        value={formData.vat}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 pr-8 text-sm"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                                    <input
                                        type="checkbox"
                                        name="isDistributor"
                                        checked={formData.isDistributor}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, isDistributor: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    Distributor (Reseller)
                                </label>
                            </div>
                            <div>
                                <label htmlFor="rentalCommission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distributor Commission - Rental</label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="rentalCommission"
                                        name="rentalCommission"
                                        value={formData.rentalCommission}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 pr-8 text-sm"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="callCommission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distributor Commission - Call Charges</label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="callCommission"
                                        name="callCommission"
                                        value={formData.callCommission}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 pr-8 text-sm"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="billType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billing Pulse</label>
                                <div className="relative mt-1">
                                    <button
                                        ref={billTypeButtonRef}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setBillTypeMenuRect(rect);
                                            setBillTypeMenuOpen((prev) => !prev);
                                        }}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                    >
                                        <span>{formData.billType || 'Select pulse'}</span>
                                        <span className="pointer-events-none float-right text-gray-500">▾</span>
                                    </button>

                                    {billTypeMenuOpen && billTypeMenuRect && (
                                        <div
                                            className="fixed z-[99999] overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-gray-900"
                                            style={{
                                                top: billTypeMenuRect.bottom + 4,
                                                left: billTypeMenuRect.left,
                                                width: billTypeMenuRect.width,
                                                maxHeight: '220px',
                                            }}
                                                ref={billTypeMenuRef}
                                        >
                                            <div className="max-h-[220px] overflow-y-auto py-1 text-sm">
                                                {Array.from({ length: 60 }, (_, index) => {
                                                    const value = String(index + 1);
                                                    const selected = formData.billType === value;
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData((prev) => ({ ...prev, billType: value }));
                                                                setBillTypeMenuOpen(false);
                                                            }}
                                                            className={`block w-full px-3 py-1.5 text-left text-sm ${selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="providerid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Provider</label>
                                <select
                                    id="providerid"
                                    name="providerid"
                                    value={formData.providerid}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                                >
                                    <option value="274101100">Pioneer Global Services Ltd</option>
                                    {providerOptions.map((provider) => (
                                        <option key={provider.custid} value={String(provider.custid)}>
                                            {provider.custname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="serverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Server Name</label>
                                <select id="rateCard" name="rateCard" value={formData.rateCard} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm">
                                    <option value="defaultRates">Default Server</option>
                                    <option value="customRates">Custom Server</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="providerid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider ID</label>
                                <input type="number" id="providerid" name="providerid" value={formData.providerid} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="rateCard" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate Card</label>
                                <select id="rateCard" name="rateCard" value={formData.rateCard} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm">
                                    <option value="defaultRates">Default Rates</option>
                                    <option value="customRates">Custom Rates</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount on Monthly Rental</label>
                                <div className="flex space-x-2 mt-1">
                                    <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-1/2 rounded-md border border-gray-300 shadow-sm p-2 text-sm">
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Lumpsum</option>
                                    </select>
                                    <input type="text" name="discountValue" placeholder={formData.discountType === "percentage" ? "e.g. 10%" : "e.g. 500"} value={formData.discountValue} onChange={handleChange} className="w-1/2 rounded-md border border-gray-300 shadow-sm p-2 text-sm" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comments</label>
                                <textarea id="comments" name="comments" value={formData.comments} onChange={handleChange} className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm" rows={3} />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-sm">Add</button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default AddCustomerModal;
