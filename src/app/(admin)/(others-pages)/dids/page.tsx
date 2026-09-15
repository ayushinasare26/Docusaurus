// 'use client';

// import React, { useState, useEffect, useMemo } from "react";
// import GenericTablePage from "@/components/tables/GenericTablePage";
// import Badge from "@/components/ui/badge/Badge";
// import DidInformation from "./DidInformation";
// import AddDidModal from "./AddNewDidModal";
// import { usePageHeading } from "@/context/PageHeadingContext";
// import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
// import AssignDidModal from "./AssignDidModal";
// import LogsModal, { LogsType } from "./DisplayLogsModal";
// import Swal from 'sweetalert2';


// type Did = {
//   didno: number;
//   custid: number;
//   custname: string;
//   provider: string;
//   purchasedate: string | null;
//   isdeleted: number;
//   isTemporary: number; // New field for temporary status
//   status: string;
// };

// const PROVIDER_FILTERS = [
//   { label: "All Providers", value: "all" },
//   { label: "Magrathea", value: "magrathea" },
//   { label: "Gamma", value: "gamma" },
//   { label: "Telnyx", value: "telnyx" },
//   { label: "Other", value: "other" },
// ];

// const STATUS_FILTERS = [
//   { label: "All Status", value: "all" },
//   { label: "Assigned", value: "assigned" },
//   { label: "Reserved", value: "reserved" },
//   { label: "Unassigned", value: "unassigned" },
//   { label: "Temporary", value: "temporary" }, // if temporary stays separate
// ];


// const searchFields = [
//   { label: "By DID number", value: "didno" },
//   { label: "By user name", value: "custname" },
//   { label: "By provider", value: "provider" },
// ];

// export default function Dids() {
//   const { setHeading } = usePageHeading();

//   const [menuOpen, setMenuOpen] = useState(false);
//   const [fetchedData, setFetchedData] = useState<Did[]>([]);
//   const [sortField, setSortField] = useState<keyof Did>("custid");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const [loading, setLoading] = useState(false);

//   const [providerFilter, setProviderFilter] = useState<string>("all");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [searchField, setSearchField] = useState<string>("didno");
//   const [searchText, setSearchText] = useState("");

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showAssignModal, setShowAssignModal] = useState(false);
//   const [selectedDids, setSelectedDids] = useState<Did[]>([]);

//   const [logsModalOpen, setLogsModalOpen] = useState(false);
//   const [logsData, setLogsData] = useState<LogsType[]>([]);
//   const [logsLoading, setLogsLoading] = useState(false);

//   useEffect(() => {
//     setHeading("DID Management Module");
//   }, [setHeading]);

//   useEffect(() => {
//     async function checkExpiry() {
//       try {
//         const res = await fetch("/api/dids/expiring");
//         if (!res.ok) return;
//         const expiringDids = await res.json();
//         if (expiringDids.length > 0) {
//           const didListHtml = expiringDids
//             .map(
//               (did: Did) =>
//                 `<li class="did-list-item">
//                   <strong>DID Number:</strong> ${did.didno}, 
//                   <strong>Customer:</strong> ${did.custname ?? 'N/A'}, 
//                   <strong>Provider:</strong> ${did.provider ?? 'N/A'}
//                 </li>`
//             )
//             .join("");

//           Swal.fire({
//             icon: "warning",
//             title: `Alert: ${expiringDids.length} DID${expiringDids.length > 1 ? "s" : ""} expiring in next 2 days!`,
//             showCancelButton: true,
//             confirmButtonText: "Close",
//             cancelButtonText: "Learn More",
//             customClass: {
//             popup: 'my-swal-popup',
//             title: 'my-swal-title',
//             confirmButton: 'my-swal-confirm',
//             cancelButton: 'my-swal-cancel',
//           },

//           }).then((result) => {
//             if (result.dismiss === Swal.DismissReason.cancel) {
//               Swal.fire({
//               title: "Expiring DIDs",
//                 html : `<ul class="did-list-container">${didListHtml}</ul>`,
//                 width: "600px",
//                 confirmButtonText: "Close",
//                 customClass: {
//                   popup: 'my-swal-popup',
//                   title: 'my-swal-title',
//                   htmlContainer: 'my-swal-html',
//                   confirmButton: 'my-swal-confirm',
//                 },
//               });
//             }
//           });
//         }
//       } catch (e) {
//         console.error("Failed to check expiring DIDs", e);
//       }
//     }

//     checkExpiry();
//   }, []);

//   // Fetch all DIDs with sorting (used when no searchText)
//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       params.append("sortField", sortField);
//       params.append("sortOrder", sortOrder);
//       const res = await fetch(`/api/dids?${params.toString()}`);
//       const json = await res.json();
//       console.log("API Response:", json);
//       setFetchedData(json);
//     } catch (error) {
//       console.error("Failed to fetch data", error);
//       setFetchedData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Function to fetch logs from API
// const fetchLogs = async () => {
//   setLogsLoading(true);
//   try {
//     const res = await fetch("/api/dids/logs");
//     if (!res.ok) throw new Error("Failed to fetch logs");
//     const data: LogsType[] = await res.json();
//     setLogsData(data);
//     return data;
//   } catch (err) {
//     console.error(err);
//     setLogsData([]);
//     return [];
//   } finally {
//     setLogsLoading(false);
//   }
// };



// useEffect(() => {
//   if (logsModalOpen) {
//     fetchLogs();
//   }
// }, [logsModalOpen]);


//   //export to csv
//   function downloadCSV(data: any[], filename = "export.csv") {
//     if (!data || data.length === 0) return;

//     const csvHeaders = Object.keys(data[0]).join(",") + "\n";
//     const csvRows = data
//       .map((row) =>
//         Object.values(row)
//           .map((value) => `"${String(value).replace(/"/g, '""')}"`) // Escape quotes
//           .join(",")
//       )
//       .join("\n");

//     const csvString = csvHeaders + csvRows;

//     const blob = new Blob([csvString], { type: "text/csv" });
//     const href = URL.createObjectURL(blob);

//     const link = document.createElement("a");
//     link.href = href;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();

//     document.body.removeChild(link);
//     URL.revokeObjectURL(href);
//   }

//   function handleExport() {
//     downloadCSV(fetchedData, "dids_export.csv");
//     Swal.fire({
//       icon: "success",
//       title: "Exported",
//       text: "DIDs exported to CSV file.",
//       timer: 1500,
//       showConfirmButton: false,
//     });
//   }

//   // Fetch search results from backend, passing raw searchText (including any % wildcards)
//   const fetchSearchResults = async () => {
//     if (searchText.trim() === "") {
//       await fetchData(); // fetch all if search empty
//       return;
//     }
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       params.append("field", searchField);
//       params.append("value", searchText.trim()); // pass raw input including %
//       params.append("sortField", sortField);
//       params.append("sortOrder", sortOrder);
//       const res = await fetch(`/api/dids?${params.toString()}`);
//             // const res = await fetch(`/api/dids?${params.toString()}`);

//       const json = await res.json();
//       setFetchedData(json);
//     } catch (error) {
//       console.error("Failed to fetch search results", error);
//       setFetchedData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounce search input changes and searchField changes to call backend search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       fetchSearchResults();
//     }, 300);
//     return () => clearTimeout(handler);
//   }, [searchText, searchField, sortField, sortOrder]);

//   // If searchText is cleared, refetch data when sorting changes
//   useEffect(() => {
//     if (searchText.trim() === "") {
//       fetchData();
//     }
//   }, [sortField, sortOrder]);

//   const handleSort = (field: keyof Did, order: "asc" | "desc") => {
//     if (field === sortField && order === sortOrder) return;
//     setSortField(field);
//     setSortOrder(order);
//   };

//   // Apply provider and status filters locally on backend-filtered fetchedData
//   const filteredData = useMemo(() => {
//     return fetchedData.filter((did) => {
//       // Provider filter
//       let providerMatches = true;
//       switch (providerFilter) {
//         case "magrathea":
//           providerMatches = did.provider?.toLowerCase() === "magrathea";
//           break;
//         case "gamma":
//           providerMatches = did.provider?.toLowerCase() === "gamma";
//           break;
//         case "telnyx":
//           providerMatches = did.provider?.toLowerCase() === "telnyx";
//           break;
//         case "other":
//           providerMatches =
//             did.provider?.toLowerCase() !== "magrathea" &&
//             did.provider?.toLowerCase() !== "gamma" &&
//             did.provider?.toLowerCase() !== "telnyx";
//           break;
//         default:
//           providerMatches = true;
//       }
//       // Status filter
//       let statusMatches = true;
//       switch (statusFilter) {
//         case "assigned":
//           statusMatches = did.status === "assigned";
//           break;
//         case "reserved":
//           statusMatches = did.status === "reserved";
//           break;
//         case "unassigned":
//           statusMatches = did.status === "unassigned";
//           break;
//         case "temporary":
//           statusMatches = did.isTemporary === 1;
//           break;
//         default:
//           statusMatches = true;
//       }

//       return providerMatches && statusMatches;
//     });
//   }, [fetchedData, providerFilter, statusFilter]);

//   // Toggle DID selection for checkbox with SweetAlert2 for errors
//   const toggleDidSelection = (selectedDid: Did) => {
//     const isSelected = selectedDids.some((did) => did.didno === selectedDid.didno);
//     if (isSelected) {
//       // Deselecting is always allowed
//       setSelectedDids((prev) => prev.filter((did) => did.didno !== selectedDid.didno));
//     } else {
//       const alreadySelectedAreTemporary = selectedDids.length > 0 && selectedDids[0].isTemporary === 1;
//       if (
//         selectedDids.length > 0 &&
//         ((selectedDid.isTemporary === 1 && !alreadySelectedAreTemporary) ||
//           (selectedDid.isTemporary !== 1 && alreadySelectedAreTemporary))
//       ) {
//         Swal.fire({
//           icon: "error",
//           title: "Selection Error",
//           text: "Cannot select temporary and non-temporary DIDs simultaneously.",
//           timer: 3000,
//           showConfirmButton: false,
//           customClass: {
//             popup: 'my-swal-popup',
//             title: 'my-swal-title',
//           },
//         });
//         return; // Block selection
//       }
//       setSelectedDids((prev) => [...prev, selectedDid]);
//     }
//   };

//   const selectAllDids = () => {
//     setSelectedDids(filteredData);
//   };

//   const deselectAllDids = () => {
//     setSelectedDids([]);
//   };

//   const toggleSelectAll = () => {
//     if (selectedDids.length === filteredData.length) {
//       deselectAllDids();
//     } else {
//       selectAllDids();
//     }
//   };

//   // Columns including checkboxes and status badges
//   const columns = [
//     {
//       id: "selection",
//       header: (
//         <input
//           type="checkbox"
//           checked={selectedDids.length === filteredData.length && filteredData.length > 0}
//           onChange={toggleSelectAll}
//           aria-label="Select all DIDs"
//         />
//       ),
//       render: (_val: any, row: Did) => {
//         const isUnassigned = (row.status ?? "").toLowerCase() === "unassigned";
//         return (
//           <input
//             type="checkbox"
//             checked={selectedDids.some((d) => d.didno === row.didno)}
//             disabled={!isUnassigned}
//             onChange={() => {
//               if (!isUnassigned) return;
//               toggleDidSelection(row);
//             }}
//             onClick={(e) => e.stopPropagation()}
//             aria-label={`Select DID ${row.didno}${!isUnassigned ? " (disabled)" : ""}`}
//             title={!isUnassigned ? "Only unassigned DIDs can be selected" : undefined}
//             className={!isUnassigned ? "cursor-not-allowed opacity-50" : ""}
//           />
//         );
//       },
//     },
//     { header: "DID Number", accessor: "didno" },
//     {
//       header: (
//         <div className="flex items-center gap-1 select-none">
//           Customer ID
//           <span className="flex flex-col ml-1">
//             <button
//               aria-label="Sort Asc"
//               onClick={() => handleSort("custid", "asc")}
//               className={sortField === "custid" && sortOrder === "asc" ? "font-bold text-black" : "text-gray-400"}
//               style={{ lineHeight: "0.75", fontSize: "12px" }}
//             >
//               ▲
//             </button>
//             <button
//               aria-label="Sort Desc"
//               onClick={() => handleSort("custid", "desc")}
//               className={sortField === "custid" && sortOrder === "desc" ? "font-bold text-black" : "text-gray-400"}
//               style={{ lineHeight: "0.75", fontSize: "12px" }}
//             >
//               ▼
//             </button>
//           </span>
//         </div>
//       ),
//       accessor: "custid",
//     },
//     { header: "Customer Name", accessor: "custname" },
//     { header: "Provider", accessor: "provider" },
//     {
//       header: "Status",
//       accessor: "status",
//       render: (val: string) => {
//         switch (val) {
//           case "assigned":
//             return <Badge color="primary">Assigned</Badge>;
//           case "unassigned":
//             return <Badge color="warning">Unassigned</Badge>;
//           case "reserved":
//             return <Badge color="error">Reserved</Badge>;
//           default:
//             return <Badge color="light">{val}</Badge>;
//         }
//       },
//     },
//   ];

//   async function assignDidsToCustomer(customerId: number, assignmentDate: string, didNumbers: number[]) {
//     try {
//       const res = await fetch(`/api/dids`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ customerId, assignmentDate, didNumbers }),
//       });
//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         Swal.fire({
//           icon: "error",
//           title: "Assignment Failed",
//           text: errorData.error || "Failed to assign DIDs",
//         });
//         throw new Error(errorData.error || "Failed to assign DIDs");
//       } else {
//         Swal.fire({
//           icon: "success",
//           title: "DIDs Assigned",
//           text: "The selected DIDs were assigned successfully.",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }
//     } catch (err) {
//       Swal.fire({
//         icon: "error",
//         title: "Assignment Failed",
//         text: "An unexpected error occurred.",
//       });
//       throw err;
//     }
//   }

//   return (
//     <div>
//       <div className="mb-4 text-md text-gray-700">Your dashboard for real-time DID status and management.</div>

//       {/* Filters and search inputs without add/assign buttons */}
//       <div className="mb-4 flex flex-wrap items-center gap-x-2">
//         <SearchDropdown fields={PROVIDER_FILTERS} activeField={providerFilter} onChange={setProviderFilter} labelPrefix="Provider: " />

//         <SearchDropdown fields={STATUS_FILTERS} activeField={statusFilter} onChange={setStatusFilter} labelPrefix="Status: " />

//         <div style={{ width: "18.5rem" }} />
//         <SearchDropdown fields={searchFields} activeField={searchField} onChange={setSearchField} />

//         <input
//           type="text"
//           value={searchText}
//           onChange={(e) => setSearchText(e.target.value)}
//           placeholder="Search (use % as wildcard)"
//           className="border rounded-md px-3 py-2 text-sm bg-white"
//         />

//         <div className="relative flex items-center">
//           {/* Hamburger button */}
//           <button
//             aria-label="Open menu"
//             className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 "
//             onClick={() => setMenuOpen((open) => !open)}
//           >
//             <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="stroke-gray-800 dark:stroke-gray-200 transition-colors">
//               <rect x="4" y="6" width="16" height="2" rx="1" />
//               <rect x="4" y="11" width="16" height="2" rx="1" />
//               <rect x="4" y="16" width="16" height="2" rx="1" />
//             </svg>
//           </button>

//           {/* Hamburger dropdown menu */}
//           <div
//             className={`p-1 absolute top-10 right-0 z-50 w-44 rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 transform origin-top-right transition-all duration-200 ${
//               menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
//             }`}
//           >
//             <button
//               className=" w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300"
//               onClick={() => {
//                 setShowAddModal(true);
//                 setMenuOpen(false);
//               }}
//             >
//               Add New
//             </button>

//             <button
//               disabled={selectedDids.length === 0}
//               className={`w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300 ${
//                 selectedDids.length === 0 ? "cursor-not-allowed opacity-50" : "text-grey-600  "
//               }`}
//               onClick={() => {
//                 if (selectedDids.length === 0) return;
//                 setShowAssignModal(true);
//                 setMenuOpen(false);
//               }}
//             >
//               Assign DIDs
//             </button>

//             <button
//               className="w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300"
//               onClick={() => {
//                 handleExport();
//                 setMenuOpen(false);
//               }}
//               style={{ boxShadow: "none" }}
//             >
//               Export DIDs
//             </button>

//             <button
//               className="w-full whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
//               onClick={() => {
//                 setLogsModalOpen(true);
//                 setMenuOpen(false);
//               }}
//             >
//               Display Logs
//             </button>
//           </div>
//         </div>
//       </div>

//       {showAddModal && (
//         <AddDidModal
//           isOpen={showAddModal}
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             fetchData();
//           }}
//         />
//       )}

//       <GenericTablePage<Did>
//         title=""
//         data={filteredData}
//         loading={loading}
//         fetchUrl={undefined}
//         columns={columns}
//         filters={[]} // Hides internal filter bar
//         searchFields={[]} // Hides internal search bar
//         renderDrawer={(row, close) => (row ? <DidInformation did={row} isOpen={!!row} onClose={close} /> : null)}
//       />

//       {showAssignModal && (
//         <AssignDidModal
//           isOpen={showAssignModal}
//           selectedDids={selectedDids}
//           onClose={() => setShowAssignModal(false)}
//           onAssign={assignDidsToCustomer}
//           onSuccess={() => {
//             setShowAssignModal(false);
//             setSelectedDids([]);
//             fetchData();
//           }}
//         />
//       )}

//       <LogsModal
//         isOpen={logsModalOpen}
//         onClose={() => setLogsModalOpen(false)}
//         logs={logsData}
//       />


//     </div>
//   );
// }

'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import GenericTablePage from "@/components/tables/GenericTablePage";
import Badge from "@/components/ui/badge/Badge";
import DidInformation from "./DidInformation";
import AddDidModal from "./AddNewDidModal";
import { usePageHeading } from "@/context/PageHeadingContext";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";
import AssignDidModal from "./AssignDidModal";
import LogsModal, { LogsType } from "./DisplayLogsModal";
import Swal from 'sweetalert2';

type Did = {
  didno: number;
  custid: number;
  custname: string;
  provider: string;
  purchasedate: string | null;
  isdeleted: number;
  isTemporary: number;
  status: string;
};

const PROVIDER_FILTERS = [
  { label: "All Providers", value: "all" },
  { label: "Magrathea", value: "magrathea" },
  { label: "Gamma", value: "gamma" },
  { label: "Telnyx", value: "telnyx" },
  { label: "Other", value: "other" },
];

const STATUS_FILTERS = []; // Keeping empty to prevent other references from breaking if any, or we can remove it. Actually let's delete it.

const searchFields = [
  { label: "By DID number", value: "didno" },
  { label: "By customer name", value: "custname" },
  { label: "By customer ID", value: "custid" },
  { label: "By provider", value: "provider" },
];

export default function Dids() {
  const { setHeading } = usePageHeading();

  const [menuOpen, setMenuOpen] = useState(false);
  const [fetchedData, setFetchedData] = useState<Did[]>([]);
  const [sortField, setSortField] = useState<keyof Did>("custid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);

  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [searchField, setSearchField] = useState<string>("didno");
  const [searchText, setSearchText] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDids, setSelectedDids] = useState<Did[]>([]);

  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsData, setLogsData] = useState<LogsType[]>([]);

  const router = useRouter();

  useEffect(() => {
    setHeading("DID Management Module");
  }, [setHeading]);

  useEffect(() => {
    async function checkExpiry() {
      try {
        const res = await fetch("/api/dids/expiring");
        if (!res.ok) return;
        const expiringDids = await res.json();
        if (expiringDids.length > 0) {
          const didListHtml = expiringDids
            .map(
              (did: Did) =>
                `<li class="did-list-item">
                  <strong>DID Number:</strong> ${did.didno}, 
                  <strong>Customer:</strong> ${did.custname ?? 'N/A'}, 
                  <strong>Provider:</strong> ${did.provider ?? 'N/A'}
                </li>`
            )
            .join("");

          Swal.fire({
            icon: "warning",
            title: `Alert: ${expiringDids.length} DID${expiringDids.length > 1 ? "s" : ""} expiring in next 2 days!`,
            showCancelButton: true,
            confirmButtonText: "Close",
            cancelButtonText: "Learn More",
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              confirmButton: 'my-swal-confirm',
              cancelButton: 'my-swal-cancel',
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
              Swal.fire({
                title: "Expiring DIDs",
                html: `<ul class="did-list-container">${didListHtml}</ul>`,
                width: "600px",
                confirmButtonText: "Close",
                customClass: {
                  popup: 'my-swal-popup',
                  title: 'my-swal-title',
                  htmlContainer: 'my-swal-html',
                  confirmButton: 'my-swal-confirm',
                },
              });
            }
          });
        }
      } catch (e) {
        console.error("Failed to check expiring DIDs", e);
      }
    }

    checkExpiry();
  }, []);

  // Fetch all DIDs with sorting - memoized to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sortField", sortField);
      params.append("sortOrder", sortOrder);
      const res = await fetch(`/api/dids?${params.toString()}`);
      const json = await res.json();
      console.log("API Response:", json);
      setFetchedData(json);
    } catch (error) {
      console.error("Failed to fetch data", error);
      setFetchedData([]);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  // Function to fetch logs from API - memoized
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/dids/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: LogsType[] = await res.json();
      setLogsData(data);
      return data;
    } catch (err) {
      console.error(err);
      setLogsData([]);
      return [];
    }
  }, []);

  useEffect(() => {
    if (logsModalOpen) {
      fetchLogs();
    }
  }, [logsModalOpen, fetchLogs]);

  // Export to CSV - fixed type annotation
  function downloadCSV(data: Did[], filename = "export.csv") {
    if (!data || data.length === 0) return;

    const csvHeaders = Object.keys(data[0]).join(",") + "\n";
    const csvRows = data
      .map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const csvString = csvHeaders + csvRows;

    const blob = new Blob([csvString], { type: "text/csv" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }

  function handleExport() {
    downloadCSV(fetchedData, "dids_export.csv");
    Swal.fire({
      icon: "success",
      title: "Exported",
      text: "DIDs exported to CSV file.",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  // Fetch search results - memoized to prevent dependency issues
  const fetchSearchResults = useCallback(async () => {
    if (searchText.trim() === "") {
      await fetchData();
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("field", searchField);
      params.append("value", searchText.trim());
      params.append("sortField", sortField);
      params.append("sortOrder", sortOrder);
      const res = await fetch(`/api/dids?${params.toString()}`);
      const json = await res.json();
      setFetchedData(json);
    } catch (error) {
      console.error("Failed to fetch search results", error);
      setFetchedData([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, searchField, sortField, sortOrder, fetchData]);

  // Debounce search input changes - fixed dependencies
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSearchResults();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchSearchResults]);

  // If searchText is cleared, refetch data when sorting changes - fixed dependencies
  useEffect(() => {
    if (searchText.trim() === "") {
      fetchData();
    }
  }, [fetchData, searchText]);

  const handleSort = (field: keyof Did, order: "asc" | "desc") => {
    if (field === sortField && order === sortOrder) return;
    setSortField(field);
    setSortOrder(order);
  };

  // Apply provider filters locally on backend-filtered fetchedData
  const filteredData = useMemo(() => {
    return fetchedData.filter((did) => {
      // Provider filter
      let providerMatches = true;
      switch (providerFilter) {
        case "magrathea":
          providerMatches = did.provider?.toLowerCase() === "magrathea";
          break;
        case "gamma":
          providerMatches = did.provider?.toLowerCase() === "gamma";
          break;
        case "telnyx":
          providerMatches = did.provider?.toLowerCase() === "telnyx";
          break;
        case "other":
          providerMatches =
            did.provider?.toLowerCase() !== "magrathea" &&
            did.provider?.toLowerCase() !== "gamma" &&
            did.provider?.toLowerCase() !== "telnyx";
          break;
        default:
          providerMatches = true;
      }

      return providerMatches;
    });
  }, [fetchedData, providerFilter]);

  // Toggle DID selection for checkbox with SweetAlert2 for errors
  const toggleDidSelection = (selectedDid: Did) => {
    const isSelected = selectedDids.some((did) => did.didno === selectedDid.didno);
    if (isSelected) {
      // Deselecting is always allowed
      setSelectedDids((prev) => prev.filter((did) => did.didno !== selectedDid.didno));
    } else {
      const alreadySelectedAreTemporary = selectedDids.length > 0 && selectedDids[0].isTemporary === 1;
      if (
        selectedDids.length > 0 &&
        ((selectedDid.isTemporary === 1 && !alreadySelectedAreTemporary) ||
          (selectedDid.isTemporary !== 1 && alreadySelectedAreTemporary))
      ) {
        Swal.fire({
          icon: "error",
          title: "Selection Error",
          text: "Cannot select temporary and non-temporary DIDs simultaneously.",
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
          },
        });
        return; // Block selection
      }
      setSelectedDids((prev) => [...prev, selectedDid]);
    }
  };

  const selectAllDids = () => {
    setSelectedDids(filteredData);
  };

  const deselectAllDids = () => {
    setSelectedDids([]);
  };

  const toggleSelectAll = () => {
    if (selectedDids.length === filteredData.length) {
      deselectAllDids();
    } else {
      selectAllDids();
    }
  };

  // Columns including checkboxes
  const columns = [
    {
      id: "selection",
      header: (
        <input
          type="checkbox"
          checked={selectedDids.length === filteredData.length && filteredData.length > 0}
          onChange={toggleSelectAll}
          aria-label="Select all DIDs"
        />
      ),
      render: (_val: unknown, row: Did) => {
        const isUnassigned = !row.custid || row.custid === 0;
        return (
          <input
            type="checkbox"
            checked={selectedDids.some((d) => d.didno === row.didno)}
            disabled={!isUnassigned}
            onChange={() => {
              if (!isUnassigned) return;
              toggleDidSelection(row);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select DID ${row.didno}${!isUnassigned ? " (disabled)" : ""}`}
            title={!isUnassigned ? "Only unassigned DIDs can be selected" : undefined}
            className={!isUnassigned ? "cursor-not-allowed opacity-50" : ""}
          />
        );
      },
    },
    { header: "DID Number", accessor: "didno" as keyof Did },
    { header: "Customer ID", accessor: "custid" as keyof Did },
    { header: "Customer Name", accessor: "custname" as keyof Did },
    { header: "Provider", accessor: "provider" as keyof Did },
  ];

  async function assignDidsToCustomer(customerId: number, assignmentDate: string, didNumbers: number[]) {
    try {
      const res = await fetch(`/api/dids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, assignmentDate, didNumbers }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Assignment Failed",
          text: errorData.error || "Failed to assign DIDs",
        });
        throw new Error(errorData.error || "Failed to assign DIDs");
      } else {
        Swal.fire({
          icon: "success",
          title: "DIDs Assigned",
          text: "The selected DIDs were assigned successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: "An unexpected error occurred.",
      });
      throw err;
    }
  }

  return (
    <div>
      <div className="mb-4 text-md text-gray-700">Your dashboard for real-time DID status and management.</div>

      {/* Filters and search inputs without add/assign buttons */}
      <div className="mb-4 flex flex-wrap items-center gap-x-2">
        <SearchDropdown fields={PROVIDER_FILTERS} activeField={providerFilter} onChange={setProviderFilter} labelPrefix="Provider: " />
        <SearchDropdown fields={searchFields} activeField={searchField} onChange={setSearchField} />

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search (use % as wildcard)"
          className="border rounded-md px-3 py-2 text-sm bg-white"
        />

        <div className="relative flex items-center">
          {/* Hamburger button */}
          <button
            aria-label="Open menu"
            className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 "
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="stroke-gray-800 dark:stroke-gray-200 transition-colors">
              <rect x="4" y="6" width="16" height="2" rx="1" />
              <rect x="4" y="11" width="16" height="2" rx="1" />
              <rect x="4" y="16" width="16" height="2" rx="1" />
            </svg>
          </button>

          {/* Hamburger dropdown menu */}
          <div
            className={`p-1 absolute top-10 right-0 z-50 w-44 rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 transform origin-top-right transition-all duration-200 ${
              menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <button
              className=" w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300"
              onClick={() => {
                router.push('/dids/add');
                setMenuOpen(false);
              }}
            >
              Add DID Number
            </button>

            <button
              className="w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300"
              onClick={() => {
                setShowUploadModal(true);
                setMenuOpen(false);
              }}
            >
              Upload DID File
            </button>

            <button
              disabled={selectedDids.length === 0}
              className={`w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300 ${
                selectedDids.length === 0 ? "cursor-not-allowed opacity-50" : "text-grey-600  "
              }`}
              onClick={() => {
                if (selectedDids.length === 0) return;
                setShowAssignModal(true);
                setMenuOpen(false);
              }}
            >
              Assign DIDs
            </button>

            <button
              className="w-full whitespace-wrap bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none border-b border-gray-300"
              onClick={() => {
                handleExport();
                setMenuOpen(false);
              }}
              style={{ boxShadow: "none" }}
            >
              Export DIDs
            </button>

            <button
              className="w-full whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              onClick={() => {
                setLogsModalOpen(true);
                setMenuOpen(false);
              }}
            >
              Display Logs
            </button>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <AddDidModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchData();
          }}
        />
      )}

      <GenericTablePage<Did>
        title=""
        data={filteredData}
        loading={loading}
        fetchUrl={undefined}
        columns={columns}
        filters={[]}
        searchFields={[]}
        renderDrawer={(row, close) => (
          row ? (
            <DidInformation
              did={row}
              isOpen={!!row}
              onClose={close}
              onDeallocateSuccess={() => {
                close();
                fetchData();
              }}
            />
          ) : null
        )}
      />

      {showAssignModal && (
        <AssignDidModal
          isOpen={showAssignModal}
          selectedDids={selectedDids}
          onClose={() => setShowAssignModal(false)}
          onAssign={assignDidsToCustomer}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedDids([]);
            fetchData();
          }}
        />
      )}

      <LogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        logs={logsData}
      />
    </div>
  );
}