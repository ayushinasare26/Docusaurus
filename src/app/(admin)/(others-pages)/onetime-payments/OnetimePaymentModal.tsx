import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import Swal from 'sweetalert2';

interface Customer {
    custid: number;
    custname: string;
}

interface OnetimePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SECTION_OPTIONS = [
    { value: 'O', label: 'One-Off : Charge' },
    { value: 'C', label: 'Current Charges : Charge' },
    { value: 'D', label: 'Current Charges : Discount' },
];

const OnetimePaymentModal: React.FC<OnetimePaymentModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [formData, setFormData] = useState({
        custid: "",
        date: new Date().toISOString().split('T')[0],
        itemdesc: "",
        unitprice: "",
        quantity: "1",
        section: "O",
    });

    useEffect(() => {
        // Fetch customers for dropdown
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/customers');
                if (res.ok) {
                    const data = await res.json();
                    // Assume the API returns an array, filter out deleted ones if necessary
                    setCustomers(data);
                }
            } catch (err) {
                console.error("Failed to fetch customers", err);
            }
        };

        if (isOpen) {
            fetchCustomers();
            setFormData({
                custid: "",
                date: new Date().toISOString().split('T')[0],
                itemdesc: "",
                unitprice: "",
                quantity: "1",
                section: "O",
            });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.custid) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a customer.' });
            return;
        }

        if (!formData.itemdesc || !formData.unitprice || !formData.quantity) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill in all required fields.' });
            return;
        }

        setLoading(true);

        try {
            const url = '/api/onetime-payments';

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    unitprice: parseFloat(formData.unitprice),
                    quantity: parseFloat(formData.quantity)
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Operation failed');
            }

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Onetime payment added to next invoice cycle.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'An unexpected error occurred.',
            });
        } finally {
            setLoading(false);
        }
    };

    const customerOptions = customers.map(c => ({
        value: c.custid.toString(),
        label: `${c.custid} - ${c.custname}`
    }));

    // Add empty option at the top
    customerOptions.unshift({ value: "", label: "Select Customer" });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[600px] p-6"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        Add One-Time Payment
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                One-Time Type <span className="text-error-500">*</span>
                            </label>
                            <Select
                                name="section"
                                options={SECTION_OPTIONS}
                                value={formData.section}
                                onChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                One Time Date <span className="text-error-500">*</span>
                            </label>
                            <Input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            For Customer <span className="text-error-500">*</span>
                        </label>
                        <SearchableSelect
                            options={customerOptions}
                            value={formData.custid}
                            onChange={(value) => setFormData(prev => ({ ...prev, custid: value.toString() }))}
                            placeholder="Type customer ID or name..."
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Description <span className="text-error-500">*</span>
                        </label>
                        <Input
                            type="text"
                            name="itemdesc"
                            value={formData.itemdesc}
                            onChange={handleChange}
                            placeholder="Enter description"
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Price/Lumpsum Discount <span className="text-error-500">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                name="unitprice"
                                value={formData.unitprice}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Quantity/Percentage Discount <span className="text-error-500">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="1"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Total Amount:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            £{((parseFloat(formData.unitprice || '0') * parseFloat(formData.quantity || '0')) || 0).toFixed(2)}
                        </span>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Onetime Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default OnetimePaymentModal;
