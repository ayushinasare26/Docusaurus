import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Swal from 'sweetalert2';
import { Equipment } from "./types";

interface Manufacturer {
    manfid: number;
    manfname: string;
}

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    equipment?: Equipment | null;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    equipment
}) => {
    const isEditing = !!equipment;
    const [loading, setLoading] = useState(false);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

    const [formData, setFormData] = useState({
        ename: "",
        prourl: "",
        manfid: "",
    });

    useEffect(() => {
        // Fetch manufacturers for dropdown
        const fetchManufacturers = async () => {
            try {
                const res = await fetch('/api/manufacturers');
                if (res.ok) {
                    const data = await res.json();
                    // Filter out deleted manufacturers for the dropdown
                    setManufacturers(data.filter((m: Manufacturer & { isdeleted: number }) => m.isdeleted === 0));
                }
            } catch (err) {
                console.error("Failed to fetch manufacturers", err);
            }
        };

        if (isOpen) {
            fetchManufacturers();

            if (isEditing && equipment) {
                setFormData({
                    ename: equipment.ename || "",
                    prourl: equipment.prourl || "",
                    manfid: equipment.manfid?.toString() || "",
                });
            } else {
                setFormData({
                    ename: "",
                    prourl: "",
                    manfid: "",
                });
            }
        }
    }, [isOpen, isEditing, equipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ename) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Equipment name is required.' });
            return;
        }

        if (!formData.manfid) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a manufacturer.' });
            return;
        }

        setLoading(true);

        try {
            const url = '/api/equipment';
            const method = isEditing ? 'PUT' : 'POST';
            const payload = isEditing
                ? { ...formData, eid: equipment.eid }
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
                text: `Equipment successfully ${isEditing ? 'updated' : 'added'}.`,
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

    const manufacturerOptions = manufacturers.map(m => ({
        value: m.manfid.toString(),
        label: m.manfname
    }));

    // Add empty option at the top
    manufacturerOptions.unshift({ value: "", label: "Select Manufacturer" });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[500px] p-6"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        {isEditing ? 'Edit Equipment' : 'Add New Equipment'}
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
                            Manufacturer <span className="text-error-500">*</span>
                        </label>
                        <Select
                            name="manfid"
                            options={manufacturerOptions}
                            value={formData.manfid}
                            onChange={(val) => setFormData(prev => ({ ...prev, manfid: val }))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Equipment Name <span className="text-error-500">*</span>
                        </label>
                        <Input
                            type="text"
                            name="ename"
                            value={formData.ename}
                            onChange={handleChange}
                            placeholder="e.g. Cisco SPA112"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Provisioning URL
                        </label>
                        <Input
                            type="text"
                            name="prourl"
                            value={formData.prourl}
                            onChange={handleChange}
                            placeholder="e.g. http://prov.example.com"
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

export default EquipmentModal;
