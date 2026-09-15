// 'use client';

// import React, { useEffect, useState } from "react";
// import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";

// type FilterOption = { label: string; value: string };
// type SearchField = { label: string; value: string };

// export interface Column<T> {
//   header: React.ReactNode;             // header content as ReactNode
//   accessor?: keyof T | string;        // accessor optional - either key of T or string for custom columns
//   id?: string;                        // unique id for columns without accessor
//   render?: (value: any, row: T) => React.ReactNode;
//   className?: string;                // optional className for cell styling
// }

// export interface GenericTablePageProps<T> {
//   title: string;
//   fetchUrl?: string;                  // optional for controlled data mode
//   columns: Column<T>[];
//   filters?: FilterOption[];
//   searchFields?: SearchField[];
//   defaultFilter?: string;
//   defaultSearchField?: string;
//   onRowClick?: (row: T) => void;
//   renderDrawer?: (row: T | null, close: () => void) => React.ReactNode;
//   renderAddModal?: (close: () => void, refetch: () => void) => React.ReactNode;
//   filterFunction?: (row: T, activeFilter: string) => boolean;
//   rowClassName?: string;

//   data?: T[];                       // controlled data
//   loading?: boolean;                // controlled loading

//   /** For filter UI */
//   buttonFilterKeys?: string[];
//   dropdownFilterKeys?: string[];
// }

// export default function GenericTablePage<T>({
//   title,
//   fetchUrl,
//   columns,
//   filters = [],
//   searchFields = [],
//   defaultFilter = "all",
//   defaultSearchField,
//   onRowClick,
//   renderDrawer,
//   renderAddModal,
//   filterFunction,
//   rowClassName = "hover:bg-gray-50 text-base dark:hover:bg-white/[0.02] cursor-pointer",
//   data: controlledData,
//   loading: controlledLoading,
//   buttonFilterKeys = [],
//   dropdownFilterKeys = [],
// }: GenericTablePageProps<T>) {

//   const [data, setData] = useState<T[]>(controlledData ?? []);
//   const [loading, setLoading] = useState<boolean>(controlledLoading ?? true);
//   const [activeFilter, setActiveFilter] = useState(defaultFilter);
//   const [searchField, setSearchField] = useState(defaultSearchField ?? (searchFields[0]?.value ?? ""));
//   const [searchText, setSearchText] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedRow, setSelectedRow] = useState<T | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const itemsPerPage = 50;

//   const buttonFilters = filters.filter(f => buttonFilterKeys.includes(f.value));
//   const dropdownFilters = filters.filter(f => dropdownFilterKeys.includes(f.value));

//   const fetchData = async () => {
//     if (!fetchUrl) return;  // skip if no URL (controlled mode)
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (searchField && searchText) {
//         params.append("searchby", searchField);
//         params.append("searchtext", searchText);
//       }
//       if (activeFilter && activeFilter !== "all") {
//         params.append("filter", activeFilter);
//       }
//       const res = await fetch(`${fetchUrl}?${params.toString()}`);
//       const json = await res.json();
//       setData(json);
//     } catch {
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sync controlled props with internal state
//   useEffect(() => {
//     if (controlledData) setData(controlledData);
//   }, [controlledData]);

//   useEffect(() => {
//     if (controlledLoading !== undefined) setLoading(controlledLoading);
//   }, [controlledLoading]);

//   // Auto fetch if uncontrolled mode
//   useEffect(() => {
//     if (!controlledData && fetchUrl) {
//       fetchData();
//       setCurrentPage(1);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchField, searchText, activeFilter, fetchUrl]);

//   const filteredData = !filterFunction || activeFilter === "all"
//     ? data
//     : data.filter(item => filterFunction(item, activeFilter));

//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//   const indexOfLast = currentPage * itemsPerPage;
//   const indexOfFirst = indexOfLast - itemsPerPage;
//   const visibleData = filteredData.slice(indexOfFirst, indexOfLast);

//   const getFilterButtonStyle = (val: string) => {
//     const base = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
//     const active = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
//     const inactive = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 " +
//       "dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05] dark:hover:bg-white/[0.05]";
//     return `${base} ${activeFilter === val ? active : inactive}`;
//   };

//   return (
//     <div className="container mx-auto relative">
//       <p className="mb-4 text-md text-gray-700">{title}</p>

//       {/* Filters & Search */}
//       <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4 items-center">

//         {/* Buttons */}
//         {buttonFilters.length > 0 && (
//           <div className="flex flex-wrap gap-2">
//             {buttonFilters.map(f => (
//               <button
//                 key={f.value}
//                 className={getFilterButtonStyle(f.value)}
//                 onClick={() => {
//                   setActiveFilter(f.value);
//                   setCurrentPage(1);
//                 }}
//               >
//                 {f.label}
//               </button>
//             ))}

//             {/* Dropdowns */}
//             {dropdownFilters.length > 0 && (
//               <div className="h-10">
//                 <SearchDropdown
//                   fields={dropdownFilters}
//                   activeField={dropdownFilters.some(f => f.value === activeFilter) ? activeFilter : ""}
//                   onChange={val => {
//                     setActiveFilter(val);
//                     setCurrentPage(1);
//                   }}
//                   labelPrefix="Filter"
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         {/* Search */}
//         {searchFields.length > 0 && (
//           <div className="flex gap-2 h-10 max-px-8 items-center">
//             <SearchDropdown
//               fields={searchFields}
//               activeField={searchField}
//               onChange={setSearchField}
//             />
//             <input
//               type="text"
//               value={searchText}
//               onChange={e => setSearchText(e.target.value)}
//               placeholder="Search..."
//               className="border rounded-md px-2 py-2 text-sm dark:bg-white/[0.03]"
//             />
//           </div>
//         )}

//         {/* Add New */}
//         {renderAddModal && (
//           <button
//             className="bg-blue-700 hover:bg-blue-500 text-white rounded-md border border-blue-500 px-4 py-2 h-10"
//             onClick={() => setShowAddModal(true)}
//           >
//             Add New
//           </button>
//         )}
//       </div>

//       {/* Table */}
//       <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
//         <div className="overflow-y-auto">
//           <Table className="w-full">
//             <TableHeader className="sticky top-0 bg-white border-b border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] z-10">
//               <TableRow>
//                 {columns.map(col => (
//                 <TableCell 
//                   key={col.id ?? String(col.accessor)} 
//                   isHeader
//                   className={`text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 ${col.className ?? ''}`}
//                 >
//                   {col.header}
//                 </TableCell>
//                 ))}
//               </TableRow>
//             </TableHeader>

//             <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
//               {loading ? (
//                 <TableRow>
//                   <td colSpan={columns.length} className="text-center py-8">
//                     <div className="animate-spin border-2 border-t-gray-900 w-8 h-8 rounded-full mx-auto"></div>
//                   </td>
//                 </TableRow>
//               ) : (
//                 visibleData.length > 0 ? visibleData : []
//               ).map((row, idx) => (
//                 <TableRow
//                   key={idx}
//                   className={rowClassName}
//                   onClick={() => {
//                     setSelectedRow(row);
//                     onRowClick?.(row);
//                   }}
//                 >
//                   {columns.map(col => (
//                     <TableCell key={col.id ?? String(col.accessor)} className={`px-4 py-3 break-words whitespace-normal ${col.className ?? ''}`}>
//                       {col.render
//                         ? col.render(col.accessor ? row[col.accessor as keyof T] : undefined, row)
//                         : col.accessor
//                           ? (() => {
//                               const value = row[col.accessor as keyof T];
//                               if (value === null || value === undefined) return null;
//                               if (
//                                 typeof value === "string" ||
//                                 typeof value === "number" ||
//                                 typeof value === "boolean"
//                               ) {
//                                 return value;
//                               }
//                               return String(value);
//                             })()
//                           : null}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))}
//               {!loading && visibleData.length === 0 && (
//                 <TableRow>
//                   <td colSpan={columns.length} className="text-center py-8">
//                     No results found
//                   </td>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>

//         {/* Pagination */}
//         <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-gray-100 bg-white p-2 dark:bg-white/[0.03] dark:border-white/[0.05]">
//           <div>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Showing{" "}
//               <span className="font-medium">{filteredData.length ? indexOfFirst + 1 : 0}</span> to{" "}
//               <span className="font-medium">{Math.min(indexOfLast, filteredData.length)}</span> of{" "}
//               <span className="font-medium">{filteredData.length}</span> results
//             </p>
//           </div>
//           <div className="flex gap-1">
//             <button
//               disabled={currentPage <= 1}
//               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//               className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>
//             {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
//               const pageNum =
//                 totalPages <= 5 || currentPage <= 3
//                   ? i + 1
//                   : currentPage >= totalPages - 2
//                   ? totalPages - 4 + i
//                   : currentPage - 2 + i;
//               return (
//                 <button
//                   key={pageNum}
//                   onClick={() => setCurrentPage(pageNum)}
//                   className={`inline-flex items-center justify-center rounded border px-3 py-1 text-sm ${
//                     pageNum === currentPage
//                       ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
//                       : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.05]"
//                   }`}
//                 >
//                   {pageNum}
//                 </button>
//               );
//             })}
//             <button
//               disabled={currentPage >= totalPages}
//               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//               className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Drawer & Modal */}
//       {renderDrawer && renderDrawer(selectedRow, () => setSelectedRow(null))}
//       {showAddModal && renderAddModal && renderAddModal(() => setShowAddModal(false), fetchData)}
//     </div>
//   );
// }


// // 'use client';

// // import React, { useEffect, useState } from "react";
// // import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
// // import { ChevronLeft, ChevronRight,Search } from "lucide-react";
// // import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";


// // type FilterOption = { label: string; value: string };
// // type SearchField = { label: string; value: string };

// // export interface Column<T> {
// //   header: React.ReactNode;             // header content as ReactNode
// //   accessor?: keyof T | string;        // accessor optional - either key of T or string for custom columns
// //   id?: string;                        // unique id for columns without accessor
// //   render?: (value: any, row: T) => React.ReactNode;
// //   className?: string;                // optional className for cell styling
// // }

// // export interface GenericTablePageProps<T> {
// //   title: string;
// //   fetchUrl?: string;                  // optional for controlled data mode
// //   columns: Column<T>[];
// //   filters?: FilterOption[];
// //   searchFields?: SearchField[];
// //   defaultFilter?: string;
// //   defaultSearchField?: string;
// //   onRowClick?: (row: T) => void;
// //   renderDrawer?: (row: T | null, close: () => void) => React.ReactNode;
// //   renderAddModal?: (close: () => void, refetch: () => void) => React.ReactNode;
// //   filterFunction?: (row: T, activeFilter: string) => boolean;
// //   rowClassName?: string;

// //   data?: T[];                       // controlled data
// //   loading?: boolean;                // controlled loading

// //   /** For filter UI */
// //   buttonFilterKeys?: string[];
// //   dropdownFilterKeys?: string[];
// // }

// // export default function GenericTablePage<T>({
// //   title,
// //   fetchUrl,
// //   columns,
// //   filters = [],
// //   searchFields = [],
// //   defaultFilter = "all",
// //   defaultSearchField,
// //   onRowClick,
// //   renderDrawer,
// //   renderAddModal,
// //   filterFunction,
// //   rowClassName = "px-5 py-3 text-gray-600 text-base truncate max-w-[220px] hover:bg-blue-50/60 transition-colors cursor-pointer",
// //   data: controlledData,
// //   loading: controlledLoading,
// //   buttonFilterKeys = [],
// //   dropdownFilterKeys = [],
// // }: GenericTablePageProps<T>) {

// //   const [data, setData] = useState<T[]>(controlledData ?? []);
// //   const [loading, setLoading] = useState<boolean>(controlledLoading ?? true);
// //   const [activeFilter, setActiveFilter] = useState(defaultFilter);
// //   const [searchField, setSearchField] = useState(defaultSearchField ?? (searchFields[0]?.value ?? ""));
// //   const [searchText, setSearchText] = useState('');
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [selectedRow, setSelectedRow] = useState<T | null>(null);
// //   const [showAddModal, setShowAddModal] = useState(false);
// //   const itemsPerPage = 50;

// //   const buttonFilters = filters.filter(f => buttonFilterKeys.includes(f.value));
// //   const dropdownFilters = filters.filter(f => dropdownFilterKeys.includes(f.value));

// //   const fetchData = async () => {
// //     if (!fetchUrl) return;  // skip if no URL (controlled mode)
// //     setLoading(true);
// //     try {
// //       const params = new URLSearchParams();
// //       if (searchField && searchText) {
// //         params.append("searchby", searchField);
// //         params.append("searchtext", searchText);
// //       }
// //       if (activeFilter && activeFilter !== "all") {
// //         params.append("filter", activeFilter);
// //       }
// //       const res = await fetch(`${fetchUrl}?${params.toString()}`);
// //       const json = await res.json();
// //       setData(json);
// //     } catch {
// //       setData([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Sync controlled props with internal state
// //   useEffect(() => {
// //     if (controlledData) setData(controlledData);
// //   }, [controlledData]);

// //   useEffect(() => {
// //     if (controlledLoading !== undefined) setLoading(controlledLoading);
// //   }, [controlledLoading]);

// //   // Auto fetch if uncontrolled mode
// //   useEffect(() => {
// //     if (!controlledData && fetchUrl) {
// //       fetchData();
// //       setCurrentPage(1);
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [searchField, searchText, activeFilter, fetchUrl]);

// //   const filteredData = !filterFunction || activeFilter === "all"
// //     ? data
// //     : data.filter(item => filterFunction(item, activeFilter));

// //   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
// //   const indexOfLast = currentPage * itemsPerPage;
// //   const indexOfFirst = indexOfLast - itemsPerPage;
// //   const visibleData = filteredData.slice(indexOfFirst, indexOfLast);

// //   const getFilterButtonStyle = (val: string) => {
// //     const base = "px-4 py-2 text-sm font-medium rounded-md transition-colors hover:scale-[1.02] shadow-sm";
// //     const active = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
// //     const inactive = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 " +
// //       "dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05] dark:hover:bg-white/[0.05]";
// //     return `${base} ${activeFilter === val ? active : inactive}`;
// //   };

// //   return (
// //     <div className="container mx-auto relative">
// //       <p className="mb-4 text-md text-gray-700">{title}</p>

// //       {/* Filters & Search */}
// //       <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4 items-center  bg-gray-25 p-2 rounded-xl border border-gray-200">

// //         {/* Buttons */}
// //         {buttonFilters.length > 0 && (
// //           <div className="flex flex-wrap gap-2">
// //             {buttonFilters.map(f => (
// //               <button
// //                 key={f.value}
// //                 className={getFilterButtonStyle(f.value)}
// //                 onClick={() => {
// //                   setActiveFilter(f.value);
// //                   setCurrentPage(1);
// //                 }}
// //               >
// //                 {f.label}
// //               </button>
// //             ))}

// //             {/* Dropdowns */}
// //             {dropdownFilters.length > 0 && (
// //               <div className="h-10">
// //                 <SearchDropdown
// //                   fields={dropdownFilters}
// //                   activeField={dropdownFilters.some(f => f.value === activeFilter) ? activeFilter : ""}
// //                   onChange={val => {
// //                     setActiveFilter(val);
// //                     setCurrentPage(1);
// //                   }}
// //                   labelPrefix="Filter"
// //                 />
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* Search */}
// //         {searchFields.length > 0 && (
// //           <div className="flex gap-2 h-10 max-px-8 items-center ">
// //             <SearchDropdown
// //               fields={searchFields}
// //               activeField={searchField}
// //               onChange={setSearchField}
// //             />

// //             <div className="relative flex items-center">
// //               <Search className="absolute left-3 w-5 h-5 text-gray-500 pointer-events-none" />
// //               <input
// //                 type="text"
// //                 value={searchText}
// //                 onChange={e => setSearchText(e.target.value)}
// //                 placeholder="Search..."
// //                 className="pl-10 py-2 border rounded-md text-sm shadow-2xs bg-gray-100"
// //               />
// //             </div>

// //           </div>
// //         )}

// //         {/* Add New */}
// //         {renderAddModal && (
// //           <button
// //             className="bg-blue-700 hover:bg-blue-500 text-white rounded-md border border-blue-500 px-4 py-2 h-10 hover:scale-[1.02] shadow-lg"
// //             onClick={() => setShowAddModal(true)}
// //           >
// //             Add New
// //           </button>
// //         )}
// //       </div>

// //       {/* Table */}
// //       <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
// //         <div className="overflow-y-auto">
// //           <Table className="w-full text-demo">
// //             <TableHeader className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
// //               <TableRow>
// //                 {columns.map(col => (
// //                 <TableCell 
// //                   key={col.id ?? String(col.accessor)} 
// //                   isHeader
// //                   className={`text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-400 ${col.className ?? ''}`}
// //                 >
// //                   {col.header}
// //                 </TableCell>
// //                 ))}
// //               </TableRow>
// //             </TableHeader>

// //             <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
// //               {loading ? (
// //                 <TableRow>
// //                   <td colSpan={columns.length} className="text-center py-8">
// //                     <div className="animate-spin border-2 border-t-gray-900 w-8 h-8 rounded-full mx-auto"></div>
// //                   </td>
// //                 </TableRow>
// //               ) : (
// //                 visibleData.length > 0 ? visibleData : []
// //               ).map((row, idx) => (
// //                 <TableRow
// //                   key={idx}
// //                   className={rowClassName}
// //                   onClick={() => {
// //                     setSelectedRow(row);
// //                     onRowClick?.(row);
// //                   }}
// //                 >
// //                   {columns.map(col => (
// //                     <TableCell key={col.id ?? String(col.accessor)} className={`px-4 py-3 break-words whitespace-normal ${col.className ?? ''}`}>
// //                       {col.render
// //                         ? col.render(col.accessor ? row[col.accessor as keyof T] : undefined, row)
// //                         : col.accessor
// //                           ? (() => {
// //                               const value = row[col.accessor as keyof T];
// //                               if (value === null || value === undefined) return null;
// //                               if (
// //                                 typeof value === "string" ||
// //                                 typeof value === "number" ||
// //                                 typeof value === "boolean"
// //                               ) {
// //                                 return value;
// //                               }
// //                               return String(value);
// //                             })()
// //                           : null}
// //                     </TableCell>
// //                   ))}
// //                 </TableRow>
// //               ))}
// //               {!loading && visibleData.length === 0 && (
// //                 <TableRow>
// //                   <td colSpan={columns.length} className="text-center py-8">
// //                     No results found
// //                   </td>
// //                 </TableRow>
// //               )}
// //             </TableBody>
// //           </Table>
// //         </div>

// //         {/* Pagination */}
// //         <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-gray-100 bg-white p-2 dark:bg-white/[0.03] dark:border-white/[0.05]">
// //           <div>
// //             <p className="text-sm text-gray-500 dark:text-gray-400">
// //               Showing{" "}
// //               <span className="font-medium">{filteredData.length ? indexOfFirst + 1 : 0}</span> to{" "}
// //               <span className="font-medium">{Math.min(indexOfLast, filteredData.length)}</span> of{" "}
// //               <span className="font-medium">{filteredData.length}</span> results
// //             </p>
// //           </div>
// //           <div className="flex gap-1">
// //             <button
// //               disabled={currentPage <= 1}
// //               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
// //               className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
// //             >
// //               <ChevronLeft className="w-4 h-4" />
// //             </button>
// //             {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
// //               const pageNum =
// //                 totalPages <= 5 || currentPage <= 3
// //                   ? i + 1
// //                   : currentPage >= totalPages - 2
// //                   ? totalPages - 4 + i
// //                   : currentPage - 2 + i;
// //               return (
// //                 <button
// //                   key={pageNum}
// //                   onClick={() => setCurrentPage(pageNum)}
// //                   className={`inline-flex items-center justify-center rounded border px-3 py-1 text-sm ${
// //                     pageNum === currentPage
// //                       ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
// //                       : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.05]"
// //                   }`}
// //                 >
// //                   {pageNum}
// //                 </button>
// //               );
// //             })}
// //             <button
// //               disabled={currentPage >= totalPages}
// //               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
// //               className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
// //             >
// //               <ChevronRight className="w-4 h-4" />
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Drawer & Modal */}
// //       {renderDrawer && renderDrawer(selectedRow, () => setSelectedRow(null))}
// //       {showAddModal && renderAddModal && renderAddModal(() => setShowAddModal(false), fetchData)}
// //     </div>
// //   );
// // }

'use client';

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";

type FilterOption = { label: string; value: string };
type SearchField = { label: string; value: string };

export interface Column<T> {
  header: React.ReactNode;             // header content as ReactNode
  accessor?: keyof T | string;        // accessor optional - either key of T or string for custom columns
  id?: string;                        // unique id for columns without accessor
  render?: (value: unknown, row: T) => React.ReactNode; // Fix: Replace 'any' with 'unknown'
  className?: string;                // optional className for cell styling
}

export interface GenericTablePageProps<T> {
  title: string;
  fetchUrl?: string;                  // optional for controlled data mode
  columns: Column<T>[];
  filters?: FilterOption[];
  searchFields?: SearchField[];
  defaultFilter?: string;
  defaultSearchField?: string;
  onRowClick?: (row: T) => void;
  renderDrawer?: (row: T | null, close: () => void) => React.ReactNode;
  renderAddModal?: (close: () => void, refetch: () => void) => React.ReactNode;
  filterFunction?: (row: T, activeFilter: string) => boolean;
  rowClassName?: string;

  data?: T[];                       // controlled data
  loading?: boolean;                // controlled loading

  /** For filter UI */
  buttonFilterKeys?: string[];
  dropdownFilterKeys?: string[];

  /** Sorting */
  onSort?: (field: string, order: string) => void;
  currentSortField?: string;
  currentSortOrder?: "asc" | "desc";
}

export default function GenericTablePage<T>({
  title,
  fetchUrl,
  columns,
  filters = [],
  searchFields = [],
  defaultFilter = "all",
  defaultSearchField,
  onRowClick,
  renderDrawer,
  renderAddModal,
  filterFunction,
  rowClassName = "hover:bg-gray-50 text-base dark:hover:bg-white/[0.02] cursor-pointer",
  data: controlledData,
  loading: controlledLoading,
  buttonFilterKeys = [],
  dropdownFilterKeys = [],
  onSort,
  currentSortField,
  currentSortOrder,
}: GenericTablePageProps<T>) {

  const [data, setData] = useState<T[]>(controlledData ?? []);
  const [loading, setLoading] = useState<boolean>(controlledLoading ?? true);
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [searchField, setSearchField] = useState(defaultSearchField ?? (searchFields[0]?.value ?? ""));
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 50;

  const buttonFilters = filters.filter(f => buttonFilterKeys.includes(f.value));
  const dropdownFilters = filters.filter(f => dropdownFilterKeys.includes(f.value));

  const fetchData = async () => {
    if (!fetchUrl) return;  // skip if no URL (controlled mode)
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchField && searchText) {
        params.append("searchby", searchField);
        params.append("searchtext", searchText);
      }
      if (activeFilter && activeFilter !== "all") {
        params.append("filter", activeFilter);
      }
      const res = await fetch(`${fetchUrl}?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync controlled props with internal state
  useEffect(() => {
    if (controlledData) setData(controlledData);
  }, [controlledData]);

  useEffect(() => {
    if (controlledLoading !== undefined) setLoading(controlledLoading);
  }, [controlledLoading]);

  // Auto fetch if uncontrolled mode
  useEffect(() => {
    if (!controlledData && fetchUrl) {
      fetchData();
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchField, searchText, activeFilter, fetchUrl]);

  const filteredData = !filterFunction || activeFilter === "all"
    ? data
    : data.filter(item => filterFunction(item, activeFilter));

  const totalPages = Array.isArray(filteredData) ? Math.ceil(filteredData.length / itemsPerPage) : 0;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const visibleData = Array.isArray(filteredData) ? filteredData.slice(indexOfFirst, indexOfLast) : [];

  const getFilterButtonStyle = (val: string) => {
    const base = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
    const active = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
    const inactive = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 " +
      "dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05] dark:hover:bg-white/[0.05]";
    return `${base} ${activeFilter === val ? active : inactive}`;
  };

  return (
    <div className="container mx-auto relative">
      <p className="mb-4 text-md text-gray-700">{title}</p>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4 items-center">

        {/* Buttons */}
        {buttonFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttonFilters.map(f => (
              <button
                key={f.value}
                className={getFilterButtonStyle(f.value)}
                onClick={() => {
                  setActiveFilter(f.value);
                  setCurrentPage(1);
                }}
              >
                {f.label}
              </button>
            ))}

            {/* Dropdowns */}
            {dropdownFilters.length > 0 && (
              <div className="h-10">
                <SearchDropdown
                  fields={dropdownFilters}
                  activeField={dropdownFilters.some(f => f.value === activeFilter) ? activeFilter : ""}
                  onChange={val => {
                    setActiveFilter(val);
                    setCurrentPage(1);
                  }}
                  labelPrefix="Filter"
                />
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {searchFields.length > 0 && (
          <div className="flex gap-2 h-10 max-px-8 items-center">
            <SearchDropdown
              fields={searchFields}
              activeField={searchField}
              onChange={setSearchField}
            />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search..."
              className="border rounded-md px-2 py-2 text-sm dark:bg-white/[0.03]"
            />
          </div>
        )}

        {/* Add New */}
        {renderAddModal && (
          <button
            className="bg-blue-700 hover:bg-blue-500 text-white rounded-md border border-blue-500 px-4 py-2 h-10"
            onClick={() => setShowAddModal(true)}
          >
            Add New
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-y-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-white border-b border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] z-10">
              <TableRow>
                {columns.map(col => (
                  <TableCell
                    key={col.id ?? String(col.accessor)}
                    isHeader
                    className={`text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 ${col.className ?? ''}`}
                  >
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <td colSpan={columns.length} className="text-center py-8">
                    <div className="animate-spin border-2 border-t-gray-900 w-8 h-8 rounded-full mx-auto"></div>
                  </td>
                </TableRow>
              ) : (
                visibleData.length > 0 ? visibleData : []
              ).map((row, idx) => (
                <TableRow
                  key={idx}
                  className={rowClassName}
                  onClick={() => {
                    setSelectedRow(row);
                    onRowClick?.(row);
                  }}
                >
                  {columns.map(col => (
                    <TableCell key={col.id ?? String(col.accessor)} className={`px-4 py-3 break-words whitespace-normal ${col.className ?? ''}`}>
                      {col.render
                        ? col.render(col.accessor ? row[col.accessor as keyof T] : undefined, row)
                        : col.accessor
                          ? (() => {
                            const value = row[col.accessor as keyof T];
                            if (value === null || value === undefined) return null;
                            if (
                              typeof value === "string" ||
                              typeof value === "number" ||
                              typeof value === "boolean"
                            ) {
                              return value;
                            }
                            return String(value);
                          })()
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && visibleData.length === 0 && (
                <TableRow>
                  <td colSpan={columns.length} className="text-center py-8">
                    No results found
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-gray-100 bg-white p-2 dark:bg-white/[0.03] dark:border-white/[0.05]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium">{filteredData.length ? indexOfFirst + 1 : 0}</span> to{" "}
              <span className="font-medium">{Math.min(indexOfLast, filteredData.length)}</span> of{" "}
              <span className="font-medium">{filteredData.length}</span> results
            </p>
          </div>
          <div className="flex gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum =
                totalPages <= 5 || currentPage <= 3
                  ? i + 1
                  : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`inline-flex items-center justify-center rounded border px-3 py-1 text-sm ${pageNum === currentPage
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="inline-flex items-center justify-center rounded border border-gray-200 px-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:text-gray-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer & Modal */}
      {renderDrawer && renderDrawer(selectedRow, () => setSelectedRow(null))}
      {showAddModal && renderAddModal && renderAddModal(() => setShowAddModal(false), fetchData)}
    </div>
  );
};




