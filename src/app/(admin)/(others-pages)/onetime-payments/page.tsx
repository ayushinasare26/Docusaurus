'use client';

import React, { useState, useEffect, useCallback } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";
import { usePageHeading } from "@/context/PageHeadingContext";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
import Swal from 'sweetalert2';
import OnetimePaymentModal from "./OnetimePaymentModal";
import { OnetimePayment } from "./types";

const searchFields = [
    { label: "By Customer ID", value: "custid" },
    { label: "By Customer Name", value: "custname" },
    { label: "By Item Description", value: "itemdesc" },
];

export default function OnetimePaymentsPage() {
    const { setHeading } = usePageHeading();

    const [menuOpen, setMenuOpen] = useState(false);
    const [fetchedData, setFetchedData] = useState<OnetimePayment[]>([]);
    const [sortField, setSortField] = useState<keyof OnetimePayment>("custid");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(false);

    const [searchField, setSearchField] = useState<string>("custname");
    const [searchText, setSearchText] = useState("");

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setHeading("Onetime Payments");
    }, [setHeading]);

    // Fetch all Onetime Payments - memoized
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("sortField", "custid"); // Always sort by customer ID for grouping
            params.append("sortOrder", "asc");

            if (searchText.trim() !== "") {
                params.append("field", searchField);
                params.append("value", searchText.trim());
            }

            const res = await fetch(`/api/onetime-payments?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Failed to fetch onetime payments");
            }

            const json = await res.json();

            // Inject header rows for grouping
            const grouped: any[] = [];
            let lastCustId: number | null = null;

            json.forEach((item: OnetimePayment) => {
                if (item.custid !== lastCustId) {
                    grouped.push({
                        isHeader: true,
                        onetimeid: `h_${item.custid}`,
                        custid: item.custid,
                        custname: item.custname,
                    });
                    lastCustId = item.custid;
                }
                grouped.push(item);
            });

            setFetchedData(grouped);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load onetime payments data',
            });
            setFetchedData([]);
        } finally {
            setLoading(false);
        }
    }, [searchField, searchText]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(handler);
    }, [fetchData]);

    const handleCreate = () => {
        setShowModal(true);
        setMenuOpen(false);
    };

    const handleDelete = async (payment: OnetimePayment) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You will permanently delete this onetime payment entry.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const params = new URLSearchParams();
                params.append('custid', payment.custid.toString());
                params.append('itemdesc', payment.itemdesc);

                const res = await fetch(`/api/onetime-payments?${params.toString()}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    throw new Error('Failed to delete onetime payment');
                }

                Swal.fire(
                    'Deleted!',
                    'Onetime payment has been deleted.',
                    'success'
                );
                fetchData();
            } catch (err) {
                Swal.fire(
                    'Error!',
                    'There was an error deleting this payment.',
                    'error'
                );
            }
        }
    };

    // Columns definition
    const columns = [
        {
            header: "Customer ID",
            id: "custid",
            render: (_val: any, row: any) => row.isHeader ? <span className="font-bold">{row.custid}</span> : null
        },
        {
            header: "Customer Name/Item Description",
            id: "itemdesc",
            render: (_val: any, row: any) => {
                if (row.isHeader) return <span className="font-bold text-blue-600 dark:text-blue-400">{row.custname}</span>;
                return <span className="pl-4 text-gray-700 dark:text-gray-300 italic">{row.itemdesc}</span>;
            }
        },
        {
            header: "One-Time Date",
            id: "date",
            render: (_val: any, row: any) => {
                if (row.isHeader) return null;
                const val = row.date;
                try {
                    return new Intl.DateTimeFormat('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }).format(new Date(val));
                } catch (e) {
                    return val;
                }
            }
        },
        {
            header: "Unit Price",
            id: "unitprice",
            render: (_val: any, row: any) => row.isHeader ? null : `£${Number(row.unitprice).toFixed(2)}`
        },
        {
            header: "Quantity",
            id: "quantity",
            render: (_val: any, row: any) => row.isHeader ? null : row.quantity
        },
        {
            header: "Section",
            id: "section",
            render: (_val: any, row: any) => {
                if (row.isHeader) return null;
                const val = row.section;
                if (val === 'O') return <Badge color="info">OO : Charge</Badge>;
                if (val === 'C') return <Badge color="primary">CC : Charge</Badge>;
                if (val === 'D') return <Badge color="success">CC : Discount</Badge>;
                return <Badge color="dark">{val}</Badge>;
            },
        },
        {
            header: "Actions",
            id: "actions",
            render: (_val: any, row: any) => row.isHeader ? null : (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                    className="text-error-500 hover:text-error-600 dark:text-error-400 dark:hover:text-error-300 transition-colors"
                >
                    Delete
                </button>
            ),
        },
    ];

    return (
        <div>
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="text-blue-700 dark:text-blue-300 font-medium">One-time Details to be considered in the Next Invoice Cycle</span>
            </div>

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
                        Add Onetime Payment
                    </button>
                </div>
            </div>

            {showModal && (
                <OnetimePaymentModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchData();
                    }}
                />
            )}

            <GenericTablePage<OnetimePayment>
                title=""
                data={fetchedData}
                loading={loading}
                fetchUrl={undefined}
                columns={columns}
                filters={[]} // Hides internal filter bar
                searchFields={[]} // Hides internal search bar
                onSort={(field: string, order: string) => {
                    setSortField(field as keyof OnetimePayment);
                    setSortOrder(order as "asc" | "desc");
                }}
                currentSortField={sortField as string}
                currentSortOrder={sortOrder}
            />
        </div>
    );
}
