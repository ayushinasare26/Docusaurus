import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Swal from 'sweetalert2';
import { Manufacturer } from "./types";

interface ManufacturerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    manufacturer?: Manufacturer | null;
}

const ManufacturerModal: React.FC<ManufacturerModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    manufacturer
}) => {
    const isEditing = !!manufacturer;
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        manfname: "",
        manfaddress: "",
        manfweb: "",
        manfemail: "",
        manfcontactno: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing && manufacturer) {
                setFormData({
                    manfname: manufacturer.manfname || "",
                    manfaddress: manufacturer.manfaddress || "",
                    manfweb: manufacturer.manfweb || "",
                    manfemail: manufacturer.manfemail || "",
                    manfcontactno: manufacturer.manfcontactno || "",
                });
            } else {
                setFormData({
                    manfname: "",
                    manfaddress: "",
                    manfweb: "",
                    manfemail: "",
                    manfcontactno: "",
                });
            }
        }
    }, [isOpen, isEditing, manufacturer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.manfname) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Manufacturer name is required.' });
            return;
        }

        setLoading(true);

        try {
            const url = '/api/manufacturers';
            const method = isEditing ? 'PUT' : 'POST';
            const payload = isEditing
                ? { ...formData, manfid: manufacturer.manfid }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Operation failed');
            }

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Manufacturer successfully ${isEditing ? 'updated' : 'added'}.`,
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: (err as Error).message || 'An unexpected error occurred.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[600px] p-6"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        {isEditing ? 'Edit Manufacturer' : 'Add New Manufacturer'}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Manufacturer Name <span className="text-error-500">*</span>
                        </label>
                        <Input
                            type="text"
                            name="manfname"
                            value={formData.manfname}
                            onChange={handleChange}
                            placeholder="e.g. Cisco Systems"
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <Input
                                type="email"
                                name="manfemail"
                                value={formData.manfemail}
                                onChange={handleChange}
                                placeholder="e.g. contact@cisco.com"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contact Number
                            </label>
                            <Input
                                type="text"
                                name="manfcontactno"
                                value={formData.manfcontactno}
                                onChange={handleChange}
                                placeholder="e.g. +1-800-553-6387"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Website
                        </label>
                        <Input
                            type="text"
                            name="manfweb"
                            value={formData.manfweb}
                            onChange={handleChange}
                            placeholder="e.g. https://www.cisco.com"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address
                        </label>
                        <Input
                            type="text"
                            name="manfaddress"
                            value={formData.manfaddress}
                            onChange={handleChange}
                            placeholder="e.g. 170 West Tasman Dr, San Jose, CA 95134"
                            className="w-full"
                        />
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
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ManufacturerModal;
