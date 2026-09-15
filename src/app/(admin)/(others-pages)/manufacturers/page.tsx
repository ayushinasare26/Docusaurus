'use client';

import React, { useState, useEffect, useCallback } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";
import { usePageHeading } from "@/context/PageHeadingContext";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
import Swal from 'sweetalert2';
import ManufacturerModal from "./ManufacturerModal";
import { Manufacturer } from "./types";

const searchFields = [
    { label: "By Manufacturer Name", value: "manfname" },
    { label: "By Contact Number", value: "manfcontactno" },
    { label: "By Email", value: "manfemail" },
    { label: "By Website", value: "manfweb" },
];

export default function ManufacturersPage() {
    const { setHeading } = usePageHeading();

    const [menuOpen, setMenuOpen] = useState(false);
    const [fetchedData, setFetchedData] = useState<Manufacturer[]>([]);
    const [sortField, setSortField] = useState<keyof Manufacturer>("manfid");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [loading, setLoading] = useState(false);

    const [searchField, setSearchField] = useState<string>("manfname");
    const [searchText, setSearchText] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);

    useEffect(() => {
        setHeading("Manufacturer Management");
    }, [setHeading]);

    // Fetch all Manufacturers - memoized
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("sortField", sortField);
            params.append("sortOrder", sortOrder);

            if (searchText.trim() !== "") {
                params.append("field", searchField);
                params.append("value", searchText.trim());
            }

            const res = await fetch(`/api/manufacturers?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Failed to fetch manufacturers");
            }

            const json = await res.json();
            setFetchedData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load manufacturers data',
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

    const handleEdit = (manufacturer: Manufacturer) => {
        setSelectedManufacturer(manufacturer);
        setShowModal(true);
        setMenuOpen(false);
    };

    const handleCreate = () => {
        setSelectedManufacturer(null);
        setShowModal(true);
        setMenuOpen(false);
    };

    const handleDelete = async (manufacturer: Manufacturer) => {
        const isDeleted = manufacturer.isdeleted === 1;
        const actionText = isDeleted ? "delete permanently" : "move to trash";

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${actionText} this manufacturer?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, proceed!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/manufacturers?manfid=${manufacturer.manfid}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    throw new Error('Failed to delete manufacturer');
                }

                Swal.fire(
                    'Deleted!',
                    `Manufacturer has been ${isDeleted ? 'permanently deleted' : 'moved to trash'}.`,
                    'success'
                );
                fetchData();
            } catch (err) {
                Swal.fire(
                    'Error!',
                    'There was an error deleting this manufacturer.',
                    'error'
                );
            }
        }
    };

    const handleRestore = async (manufacturer: Manufacturer) => {
        try {
            const res = await fetch(`/api/manufacturers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manfid: manufacturer.manfid, isdeleted: 0 })
            });

            if (!res.ok) {
                throw new Error('Failed to restore manufacturer');
            }

            Swal.fire(
                'Restored!',
                'Manufacturer has been restored successfully.',
                'success'
            );
            fetchData();
        } catch (err) {
            Swal.fire(
                'Error!',
                'There was an error restoring this manufacturer.',
                'error'
            );
        }
    };

    // Columns definition
    const columns = [
        { header: "ID", accessor: "manfid" },
        { header: "Manufacturer Name", accessor: "manfname" },
        { header: "Contact Number", id: "manfcontactno", render: (_val: any, row: Manufacturer) => row.manfcontactno || "N/A" },
        { header: "Email", id: "manfemail", render: (_val: any, row: Manufacturer) => row.manfemail || "N/A" },
        { header: "Website", id: "manfweb", render: (_val: any, row: Manufacturer) => row.manfweb || "N/A" },
        {
            header: "Status",
            accessor: "isdeleted",
            render: (val: any) => {
                return val === 1 ? (
                    <Badge color="error">Deleted</Badge>
                ) : (
                    <Badge color="success">Active</Badge>
                );
            },
        },
        {
            header: "Actions",
            id: "actions",
            render: (_val: any, row: Manufacturer) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                    >
                        Edit
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    {row.isdeleted === 1 ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
                            className="text-success-500 hover:text-success-600 dark:text-success-400 dark:hover:text-success-300 transition-colors"
                        >
                            Restore
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                            className="text-error-500 hover:text-error-600 dark:text-error-400 dark:hover:text-error-300 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="mb-4 text-md text-gray-700">Manage equipment manufacturers and their contact information.</div>

            {/* Filters and search inputs */}
            <div className="mb-4 flex flex-wrap items-center gap-x-2">
                <SearchDropdown fields={searchFields} activeField={searchField} onChange={setSearchField} />

                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="border rounded-md px-3 py-2 text-sm bg-white"
                />

                <div className="relative flex items-center ml-auto">
                    <button
                        onClick={handleCreate}
                        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                        Add Manufacturer
                    </button>
                </div>
            </div>

            {showModal && (
                <ManufacturerModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchData();
                    }}
                    manufacturer={selectedManufacturer}
                />
            )}

            <GenericTablePage<Manufacturer>
                title=""
                data={fetchedData}
                loading={loading}
                fetchUrl={undefined}
                columns={columns}
                filters={[]} // Hides internal filter bar
                searchFields={[]} // Hides internal search bar
                onSort={(field: string, order: string) => {
                    setSortField(field as keyof Manufacturer);
                    setSortOrder(order as "asc" | "desc");
                }}
                currentSortField={sortField as string}
                currentSortOrder={sortOrder}
            />
        </div>
    );
}
