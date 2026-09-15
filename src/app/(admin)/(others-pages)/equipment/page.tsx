'use client';

import React, { useState, useEffect, useCallback } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";
import { usePageHeading } from "@/context/PageHeadingContext";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
import Swal from 'sweetalert2';
import EquipmentModal from "./EquipmentModal";
import { Equipment } from "./types";

const searchFields = [
    { label: "By Equipment Name", value: "ename" },
    { label: "By Manufacturer", value: "manfname" },
];

export default function EquipmentPage() {
    const { setHeading } = usePageHeading();

    const [menuOpen, setMenuOpen] = useState(false);
    const [fetchedData, setFetchedData] = useState<Equipment[]>([]);
    const [sortField, setSortField] = useState<keyof Equipment>("eid");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [loading, setLoading] = useState(false);

    const [searchField, setSearchField] = useState<string>("ename");
    const [searchText, setSearchText] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    useEffect(() => {
        setHeading("Equipment Management");
    }, [setHeading]);

    // Fetch all Equipment - memoized
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

            const res = await fetch(`/api/equipment?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Failed to fetch equipment");
            }

            const json = await res.json();
            setFetchedData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load equipment data',
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

    const handleEdit = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setShowModal(true);
        setMenuOpen(false);
    };

    const handleCreate = () => {
        setSelectedEquipment(null);
        setShowModal(true);
        setMenuOpen(false);
    };

    const handleDelete = async (equipment: Equipment) => {
        const isDeleted = equipment.isdeleted === 1;
        const actionText = isDeleted ? "delete permanently" : "move to trash";

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${actionText} this equipment?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, proceed!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/equipment?eid=${equipment.eid}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    throw new Error('Failed to delete equipment');
                }

                Swal.fire(
                    'Deleted!',
                    `Equipment has been ${isDeleted ? 'permanently deleted' : 'moved to trash'}.`,
                    'success'
                );
                fetchData();
            } catch (err) {
                Swal.fire(
                    'Error!',
                    'There was an error deleting this equipment.',
                    'error'
                );
            }
        }
    };

    const handleRestore = async (equipment: Equipment) => {
        try {
            const res = await fetch(`/api/equipment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eid: equipment.eid, isdeleted: 0 })
            });

            if (!res.ok) {
                throw new Error('Failed to restore equipment');
            }

            Swal.fire(
                'Restored!',
                'Equipment has been restored successfully.',
                'success'
            );
            fetchData();
        } catch (err) {
            Swal.fire(
                'Error!',
                'There was an error restoring this equipment.',
                'error'
            );
        }
    };

    // Columns definition
    const columns = [
        { header: "ID", accessor: "eid" },
        { header: "Equipment Name", accessor: "ename" },
        { header: "Manufacturer", id: "manfname", render: (_val: any, row: Equipment) => row.manfname || "N/A" },
        { header: "Provisioning URL", id: "prourl", render: (_val: any, row: Equipment) => row.prourl || "N/A" },
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
            render: (_val: any, row: Equipment) => (
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
            <div className="mb-4 text-md text-gray-700">Manage equipment hardware used in the network infrastructure.</div>

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
                        Add Equipment
                    </button>
                </div>
            </div>

            {showModal && (
                <EquipmentModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchData();
                    }}
                    equipment={selectedEquipment}
                />
            )}

            <GenericTablePage<Equipment>
                title=""
                data={fetchedData}
                loading={loading}
                fetchUrl={undefined}
                columns={columns}
                filters={[]} // Hides internal filter bar
                searchFields={[]} // Hides internal search bar
                onSort={(field: string, order: string) => {
                    setSortField(field as keyof Equipment);
                    setSortOrder(order as "asc" | "desc");
                }}
                currentSortField={sortField as string}
                currentSortOrder={sortOrder}
            />
        </div>
    );
}
