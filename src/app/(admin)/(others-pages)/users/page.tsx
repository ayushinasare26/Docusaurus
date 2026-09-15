'use client';

import React, { useState, useEffect, useCallback } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";
import { usePageHeading } from "@/context/PageHeadingContext";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
import Swal from 'sweetalert2';
import UserModal from "./UserModal";
import { User } from "./types";
import { useAuth } from "@/context/AuthContext";

const searchFields = [
    { label: "By Email", value: "email" },
];

export default function UsersPage() {
    const { setHeading } = usePageHeading();
    const { isSuperAdmin, user, loading: authLoading } = useAuth();

    const [fetchedData, setFetchedData] = useState<User[]>([]);
    const [sortField, setSortField] = useState<keyof User>("email");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [loading, setLoading] = useState(false);

    const [searchField, setSearchField] = useState<string>("email");
    const [searchText, setSearchText] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        setHeading("User Management");
    }, [setHeading]);

    // Fetch all Users - memoized
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("sortField", sortField as string);
            params.append("sortOrder", sortOrder);

            if (searchText.trim() !== "") {
                params.append("field", searchField);
                params.append("value", searchText.trim());
            }

            const res = await fetch(`/api/users?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Failed to fetch users");
            }

            const json = await res.json();
            setFetchedData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load users data',
            });
            setFetchedData([]);
        } finally {
            setLoading(false);
        }
    }, [sortField, sortOrder, searchField, searchText]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(handler);
    }, [fetchData]);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setShowModal(true);
    };

    const handleResetPassword = async (user: User) => {
        const result = await Swal.fire({
            title: 'Reset Password?',
            text: `This will generate a new temporary password for ${user.email}.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Generate Temp Password'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/admin/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                });

                if (!res.ok) throw new Error('Failed to reset password');

                const data = await res.json();
                Swal.fire({
                    title: 'New Temp Password',
                    html: `<p>The temporary password is:</p><code className="bg-gray-100 p-2 block mt-2">${data.tempPassword}</code><p className="mt-2 text-sm text-gray-500">Please provide this to the user. Managed via Cognito.</p>`,
                    icon: 'success'
                });
            } catch (err: any) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    const handleDelete = async (user: User) => {
        const isDeactivated = user.isActive === 0;
        const actionText = isDeactivated ? "delete permanently" : "deactivate";

        if (user.email.toUpperCase() === 'ADMIN') {
            Swal.fire('Restricted', 'Cannot delete the ADMIN user', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${actionText} this user?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, proceed!'
        });

        if (result.isConfirmed) {
            try {
                // Delete from Cognito is now handled by the main /api/users endpoint
                const res = await fetch(`/api/users?email=${user.email}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to delete user');
                }

                Swal.fire(
                    'Deleted!',
                    `User has been ${isDeactivated ? 'permanently deleted' : 'deactivated'}.`,
                    'success'
                );
                fetchData();
            } catch (err: any) {
                Swal.fire(
                    'Error!',
                    err.message || 'There was an error deleting this user.',
                    'error'
                );
            }
        }
    };

    const handleRestore = async (user: User) => {
        try {
            const res = await fetch(`/api/users`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, isActive: 1 })
            });

            if (!res.ok) {
                throw new Error('Failed to restore user');
            }

            Swal.fire(
                'Restored!',
                'User has been activated successfully.',
                'success'
            );
            fetchData();
        } catch (err) {
            Swal.fire(
                'Error!',
                'There was an error activating this user.',
                'error'
            );
        }
    };

    const columns = [
        { header: "Email Address", accessor: "email" },
        {
            header: "Status",
            accessor: "isActive",
            render: (val: any) => {
                return val === 1 ? (
                    <Badge color="success">Active</Badge>
                ) : (
                    <Badge color="error">Deactivated</Badge>
                );
            },
        },
        {
            header: "Actions",
            id: "actions",
            render: (_val: any, row: User) => {
                if (row.email.toUpperCase() === 'ADMIN') {
                    return <span className="text-gray-400 italic">System Reserved</span>
                }

                return (
                    <div className="flex gap-2">
                        {isSuperAdmin && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleResetPassword(row); }}
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                                >
                                    Reset Password
                                </button>

                                {row.email !== user?.username && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        {row.isActive === 0 ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
                                                className="text-success-500 hover:text-success-600 dark:text-success-400 dark:hover:text-success-300 transition-colors"
                                            >
                                                Activate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                                className="text-warning-500 hover:text-warning-600 dark:text-warning-400 dark:hover:text-warning-300 transition-colors"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                );
            }
        },
    ].filter(column => column.id !== "actions" || isSuperAdmin);

    if (authLoading) return <div className="p-6">Loading Auth...</div>;

    return (
        <div>
            <div className="mb-4 text-md text-gray-700">Manage system users and login credentials using Email and Password via Cognito.</div>

            <div className="mb-4 flex flex-wrap items-center gap-x-2">
                <SearchDropdown fields={searchFields} activeField={searchField} onChange={setSearchField} />

                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="border rounded-md px-3 py-2 text-sm bg-white"
                />

                {isSuperAdmin && (
                    <div className="relative flex items-center ml-auto">
                        <button
                            onClick={handleCreate}
                            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                            Add New User
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <UserModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchData();
                    }}
                    user={selectedUser}
                />
            )}

            <GenericTablePage<User>
                title=""
                data={fetchedData}
                loading={loading}
                fetchUrl={undefined}
                columns={columns}
                filters={[]}
                searchFields={[]}
                onSort={(field: string, order: string) => {
                    setSortField(field as keyof User);
                    setSortOrder(order as "asc" | "desc");
                }}
                currentSortField={sortField as string}
                currentSortOrder={sortOrder}
            />
        </div>
    );
}
