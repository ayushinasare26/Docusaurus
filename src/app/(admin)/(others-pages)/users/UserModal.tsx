import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Swal from 'sweetalert2';
import { User } from "./types";
import { useAuth } from "@/context/AuthContext";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    user
}) => {
    const { isSuperAdmin } = useAuth();
    const isEditing = !!user;
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing && user) {
                setFormData({
                    email: user.email || "",
                });
            } else {
                setFormData({
                    email: "",
                });
            }
        }
    }, [isOpen, isEditing, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSuperAdmin) {
            Swal.fire({ icon: 'error', title: 'Restricted', text: 'Only the Super Admin (User ID 1) can manage users.' });
            return;
        }

        if (!formData.email) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Email is required.' });
            return;
        }

        setLoading(true);

        try {
            const url = isEditing ? `/api/admin/update-user` : '/api/admin/create-user';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Operation failed');
            }

            const data = await res.json();

            Swal.fire({
                icon: 'success',
                title: 'Success',
                html: `User successfully ${isEditing ? 'updated' : 'created'}.<br/>Initial Password: <b style="color: #2563eb; font-size: 1.2em;">${data.tempPassword || 'N/A'}</b><br/><small>Please share this manually with the Admin.</small>`,
                showConfirmButton: true
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
            className="max-w-[450px] p-6"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                        {isEditing ? 'Edit User Access' : 'Add New Admin'}
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
                            Email <span className="text-error-500">*</span>
                        </label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. user@example.com"
                            className="w-full"
                            disabled={isEditing}
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
                            disabled={loading || !isSuperAdmin}
                        >
                            {loading ? 'Processing...' : (isEditing ? 'Update User' : 'Create User')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default UserModal;
