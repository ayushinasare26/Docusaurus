
// "use client";

// import React, { useEffect, useState } from "react";
// import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
// import Badge from "@/components/ui/badge/Badge";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import CustomerInformation from "./CustomerInformation";
// // import { usePageHeading } from "@/context/PageHeadingContext";
// import AddCustomerModal from "./AddNewCustomerModal"; // Import the modal component

// type Customer = {
//   custid: number;
//   serverid: number;
//   cardid: number;
//   custname: string;
//   addressline1: string;
//   addressline2: string;
//   addressline3: string;
//   city: string;
//   pincode: string;
//   joindate: string | null;
//   invemailto: string | null;
//   invemailcc: string | null;
//   coremailto: string | null;
//   coremailcc: string | null;
//   contactmain1: string | null;
//   contactmain2: string | null;
//   contactperson1: string | null;
//   contactno1: string | null;
//   isdeleted: number;
//   discount: number;
//   comments: string | null;
//   creditlimit: number;
//   overlimitmessage: string | null;
//   isdistributor: number;
//   isSuspended: number;
//   providerid: number;
//   vat: number;
//   rental_comission: number;
//   call_comission: number;
//   billtype: number;
// };

// interface TableRowProps {
//   children: React.ReactNode;
//   className?: string;
//   onClick?: () => void;
// }

// // Customized TableRow component that supports the onClick prop
// const CustomTableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
//   return <tr className={className} onClick={onClick}>{children}</tr>;
// };

// // Define filter options
// type FilterType = "all" | "active" | "suspended" | "distributor" | "deleted";

// const Customers = () => {
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showDrawer, setShowDrawer] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
//   const [activeFilter, setActiveFilter] = useState<FilterType>("all");
//   const [showAddModal, setShowAddModal] = useState(false);
//   const itemsPerPage = 50;
//   //added search functionality
// const [searchField, setSearchField] = useState<"custname" | "custid" | "contactno1">("custname");
// const [searchText, setSearchText] = useState("");


//   // Fetch customers data from the API
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const response = await fetch("/api/customers");
//         const data = await response.json();
//         setCustomers(data);
//       } catch (error) {
//         console.error("Error fetching customers:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Filter customers based on the active filter setting
//   const filteredCustomers = customers.filter((customer) => {
//   // Apply filter
//   const matchesFilter = (() => {
//     switch (activeFilter) {
//       case "active":
//         return !customer.isSuspended && !customer.isdeleted;
//       case "suspended":
//         return customer.isSuspended === 1;
//       case "distributor":
//         return customer.isdistributor === 1;
//       case "deleted":
//         return customer.isdeleted === 1;
//       default:
//         return true;
//     }
//   })();

//   // Apply search
//   const searchValue = searchText.toLowerCase().trim();
//   const fieldValue = (customer[searchField] || "").toString().toLowerCase();

//   const matchesSearch = searchValue === "" || fieldValue.includes(searchValue);

//   return matchesFilter && matchesSearch;
// });


//   // Reset page to 1 when the filter changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [activeFilter]);

//   // Pagination calculations
//   const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

//   // Next and previous page handlers
//   const nextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   const prevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   // When a customer row is clicked, show detailed customer information in a drawer
//   const handleCustomerClick = (customer: Customer) => {
//     setSelectedCustomer(customer);
//     setShowDrawer(true);
//   };

//   // Opens the modal for adding a new customer
//   const addNewCustomer = () => {
//     setShowAddModal(true);
//   };

//   // Closes the customer information drawer
//   const closeDrawer = () => {
//     setShowDrawer(false);
//   };

//   // Return the appropriate button styling based on the active filter state
//   const getFilterButtonStyle = (filterType: FilterType) => {
//     const baseStyle = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
//     const activeStyle = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
//     const inactiveStyle =
//       "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05] dark:hover:bg-white/[0.05]";
//       return `${baseStyle} ${activeFilter === filterType ? activeStyle : inactiveStyle}`;
//   };

//   return (
//     <div className="container mx-auto relative">
//       <p className="mb-4 text-md text-gray-700">
//         A list of all the customers of Pinevox. Total count is {customers.length}.
//       </p>

//         {/* Filter Controls and Add New Customer Button
//         <div className="flex items-center justify-between mb-4">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <button onClick={() => setActiveFilter("all")} className={getFilterButtonStyle("all")}>
//               All Customers
//             </button>
//             <button onClick={() => setActiveFilter("active")} className={getFilterButtonStyle("active")}>
//               Active
//             </button>
//             <button onClick={() => setActiveFilter("suspended")} className={getFilterButtonStyle("suspended")}>
//               Suspended
//             </button>
//             <button onClick={() => setActiveFilter("distributor")} className={getFilterButtonStyle("distributor")}>
//               Distributor
//             </button>
//             <button onClick={() => setActiveFilter("deleted")} className={getFilterButtonStyle("deleted")}>
//               Deleted
//             </button>
//           </div>
//           <div className="mb-4 flex flex-wrap gap-2">
//             <button
//               className="bg-blue-700 hover:bg-blue-500 text-white rounded-md py-2 px-4 border border-blue-500 hover:border-transparent"
//               onClick={addNewCustomer}
//             >
//               Add New Customer
//             </button>
//           </div>
//         </div> */}

//   {/* Filter & Search Controls */}
//   <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
//   {/* Filters */}
//   <div className="flex flex-wrap gap-2">
//     <button onClick={() => setActiveFilter("all")} className={getFilterButtonStyle("all")}>
//       All Customers
//     </button>
//     <button onClick={() => setActiveFilter("active")} className={getFilterButtonStyle("active")}>
//       Active
//     </button>
//     <button onClick={() => setActiveFilter("suspended")} className={getFilterButtonStyle("suspended")}>
//       Suspended
//     </button>
//     <button onClick={() => setActiveFilter("distributor")} className={getFilterButtonStyle("distributor")}>
//       Distributor
//     </button>
//     <button onClick={() => setActiveFilter("deleted")} className={getFilterButtonStyle("deleted")}>
//       Deleted
//     </button>
//   </div>

//   {/* Search Criteria */}
//   <div className="flex gap-2">
//     <select
//       value={searchField}
//       onChange={(e) => setSearchField(e.target.value as any)}
//       className="border border-gray-300 rounded-md px-2 py-1 text-sm dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05]"
//     >
//       <option value="custname">By Customer Name</option>
//       <option value="custid">By Customer ID</option>
//       <option value="contactno1">By Contact Number</option>
//     </select>
//     <input
//       type="text"
//       value={searchText}
//       onChange={(e) => setSearchText(e.target.value)}
//       placeholder="Search..."
//       className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05]"
//     />
//   </div>

//   {/* Add New */}
//   <div>
//     <button
//       className="bg-blue-700 hover:bg-blue-500 text-white rounded-md py-2 px-4 border border-blue-500 hover:border-transparent"
//       onClick={addNewCustomer}
//     >
//       Add New Customer
//     </button>
//   </div>
//   </div>


//       {/* Customers Table */}
//       <div className="rounded-xl p-2 border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
//         <div className="overflow-auto">
//           <Table>
//             <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
//               <TableRow>
//                 <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
//                   Customer ID
//                 </TableCell>
//                 <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
//                   Customer Name
//                 </TableCell>
//                 <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
//                   Contact Person
//                 </TableCell>
//                 <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
//                   Contact Details
//                 </TableCell>
//                 <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
//                   Status
//                 </TableCell>
//               </TableRow>
//             </TableHeader>
//             <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
//               {loading ? (
//                 <TableRow>
//                   <td colSpan={27} className="text-center py-8">
//                     <div className="flex justify-center items-center h-32">
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
//                     </div>
//                   </td>
//                 </TableRow>
//               ) : currentCustomers.length > 0 ? (
//                 currentCustomers.map((customer) => (
//                   <CustomTableRow
//                     key={customer.custid}
//                     className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
//                     onClick={() => handleCustomerClick(customer)}
//                   >
//                     <TableCell className="whitespace-nowrap px-4 py-3 text-start">
//                       <span className="text-gray-800 dark:text-gray-200 font-medium">{customer.custid}</span>
//                     </TableCell>
//                     <TableCell className="whitespace-nowrap px-4 py-3 text-start">
//                       <span className="font-medium text-gray-800 dark:text-white/90">{customer.custname}</span>
//                     </TableCell>
//                     <TableCell className="whitespace-nowrap px-4 py-3 text-start">
//                       <span className="text-gray-800 dark:text-gray-200">{customer.contactperson1 || "—"}</span>
//                     </TableCell>
//                     <TableCell className="whitespace-nowrap px-4 py-3 text-start flex flex-col gap-1">
//                       <span className="text-gray-800 dark:text-gray-200">{customer.contactno1 || "—"}</span>
//                     </TableCell>
//                     <TableCell className="whitespace-nowrap px-4 py-3 text-start">
//                       <Badge color={customer.isSuspended ? "warning" : "primary"}>
//                         {customer.isSuspended ? "Suspended" : "Active"}
//                       </Badge>
//                     </TableCell>
//                   </CustomTableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <td colSpan={27} className="text-center py-8">
//                     <span className="text-gray-500 dark:text-gray-400">No Customers Found</span>
//                   </td>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>

//         {/* Pagination Controls */}
//         <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
//           <div>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Showing{" "}
//               <span className="font-medium">
//                 {filteredCustomers.length > 0 ? indexOfFirstItem + 1 : 0}
//               </span>{" "}
//               to{" "}
//               <span className="font-medium">
//                 {indexOfLastItem > filteredCustomers.length ? filteredCustomers.length : indexOfLastItem}
//               </span>{" "}
//               of <span className="font-medium">{filteredCustomers.length}</span> results
//             </p>
//           </div>
//           <div className="flex space-x-1">
//             <button
//               onClick={prevPage}
//               disabled={currentPage === 1}
//               className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>
//             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//               let pageNum;
//               if (totalPages <= 5) {
//                 pageNum = i + 1;
//               } else if (currentPage <= 3) {
//                 pageNum = i + 1;
//               } else if (currentPage >= totalPages - 2) {
//                 pageNum = totalPages - 4 + i;
//               } else {
//                 pageNum = currentPage - 2 + i;
//               }
//               return (
//                 <button
//                   key={pageNum}
//                   onClick={() => setCurrentPage(pageNum)}
//                   className={`inline-flex items-center justify-center w-8 h-8 rounded ${currentPage === pageNum
//                       ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
//                       : "border border-gray-200 bg-white text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
//                     }`}
//                 >
//                   {pageNum}
//                 </button>
//               );
//             })}
//             <button
//               onClick={nextPage}
//               disabled={currentPage === totalPages || totalPages === 0}
//               className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Customer Information Drawer */}
//       <CustomerInformation customer={selectedCustomer} isOpen={showDrawer} onClose={closeDrawer} />

//       {/* Add Customer Modal */}
//       {showAddModal && (
//         <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
//       )}
//     </div>
//   );
// };

// export default Customers;

"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { ChevronLeft, ChevronRight, Pencil, Package, Eye, Trash2, MoreHorizontal, RotateCcw } from "lucide-react";
import CustomerInformation from "./CustomerInformation";
import { usePageHeading } from "@/context/PageHeadingContext"; // Uncomment this
import AddCustomerModal from "./AddNewCustomerModal";
import { useRouter } from "next/navigation";

// Your existing Customer type is perfect, keep it as is
type Customer = {
  custid: number;
  serverid: number;
  cardid: number;
  custname: string;
  addressline1: string;
  addressline2: string;
  addressline3: string;
  city: string;
  pincode: string;
  joindate: string | null;
  invemailto: string | null;
  invemailcc: string | null;
  coremailto: string | null;
  coremailcc: string | null;
  contactmain1: string | null;
  contactmain2: string | null;
  contactperson1: string | null;
  contactno1: string | null;
  isdeleted: number;
  discount: number;
  comments: string | null;
  creditlimit: number;
  overlimitmessage: string | null;
  isdistributor: number;
  isSuspended: number;
  providerid: number;
  ddtrefno: string | null;
  vat: number;
  rental_comission: number;
  call_comission: number;
  billtype: number;
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const CustomTableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return <tr className={className} onClick={onClick}>{children}</tr>;
};

type FilterType = "all" | "active" | "suspended" | "distributor" | "deleted";

// Define search field type properly
type SearchField = "custname" | "custid" | "contactno1";

const Customers = () => {
  const { setHeading } = usePageHeading(); // Add this back
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const itemsPerPage = 50;

  // Fix: Use proper type for searchField
  const [searchField, setSearchField] = useState<SearchField>("custname");
  const [searchText, setSearchText] = useState("");

  // Set page heading
  useEffect(() => {
    setHeading("Customers");
  }, [setHeading]);

  // Fetch customers data from the API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter and sort customers based on the active filter setting
  let filteredCustomers = customers.filter((customer) => {
    // Apply filter
    const matchesFilter = (() => {
      switch (activeFilter) {
        case "active":
          return !customer.isSuspended && !customer.isdeleted;
        case "suspended":
          return customer.isSuspended === 1;
        case "distributor":
          return customer.isdistributor === 1;
        case "deleted":
          return customer.isdeleted === 1;
        default:
          return !customer.isdeleted; // For 'all', show only not deleted
      }
    })();

    // Apply search
    const searchValue = searchText.toLowerCase().trim();
    const fieldValue = (customer[searchField] || "").toString().toLowerCase();

    const matchesSearch = searchValue === "" || fieldValue.includes(searchValue);

    return matchesFilter && matchesSearch;
  });

  // For 'all' filter, sort: active first (asc), then suspended (asc)
  if (activeFilter === "all") {
    filteredCustomers = [...filteredCustomers].sort((a, b) => {
      const aSusp = a.isSuspended === 1 ? 1 : 0;
      const bSusp = b.isSuspended === 1 ? 1 : 0;
      if (aSusp !== bSusp) {
        return aSusp - bSusp;
      }
      return a.custid - b.custid;
    });
  }

  // Reset page to 1 when the filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  // Next and previous page handlers
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // When a customer row is clicked, show detailed customer information in a drawer
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDrawer(true);
  };

  // Opens the modal for adding a new customer
  const addNewCustomer = () => {
    setShowAddModal(true);
  };

  // Closes the customer information drawer
  const closeDrawer = () => {
    setShowDrawer(false);
  };

  // Action handlers
  const handleEditCustomer = (e: React.MouseEvent, custid: number) => {
    e.stopPropagation();
    router.push(`/customers/edit/${custid}`);
  };

  const handleViewProducts = (e: React.MouseEvent, custid: number) => {
    e.stopPropagation();
    router.push(`/customers/${custid}/products`);
  };

  const handleViewDetails = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setShowDrawer(true);
  };

  const handleRestoreCustomer = async (e: React.MouseEvent, custid: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to restore this customer?")) {
      try {
        const response = await fetch(`/api/customers/${custid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isdeleted: 0, isSuspended: 0 })
        });
        if (response.ok) {
          fetchCustomers();
        } else {
          console.error('Failed to restore customer');
        }
      } catch (error) {
        console.error('Error restoring customer:', error);
      }
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (e: React.MouseEvent, custid: number) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === custid ? null : custid);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Return the appropriate button styling based on the active filter state
  const getFilterButtonStyle = (filterType: FilterType) => {
    const baseStyle = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
    const activeStyle = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
    const inactiveStyle =
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05] dark:hover:bg-white/[0.05]";
    return `${baseStyle} ${activeFilter === filterType ? activeStyle : inactiveStyle}`;
  };

  const getRowHighlightClass = (customer: Customer) => {
    const hasDdRef = Boolean(customer.ddtrefno && String(customer.ddtrefno).trim());
    return hasDdRef
    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
    : "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30";
  };

  return (
    <div className="container mx-auto relative">
      <p className="mb-4 text-md text-gray-700">
        A list of all the customers of Pinevox. Total count is {customers.length}.
      </p>

      {/* Filter & Search Controls */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveFilter("all")} className={getFilterButtonStyle("all")}>
            All Customers
          </button>
          <button onClick={() => setActiveFilter("active")} className={getFilterButtonStyle("active")}>
            Active
          </button>
          <button onClick={() => setActiveFilter("suspended")} className={getFilterButtonStyle("suspended")}>
            Suspended
          </button>
          <button onClick={() => setActiveFilter("distributor")} className={getFilterButtonStyle("distributor")}>
            Distributor
          </button>
          <button onClick={() => setActiveFilter("deleted")} className={getFilterButtonStyle("deleted")}>
            Deleted
          </button>
        </div>

        {/* Search Criteria */}
        <div className="flex gap-2">
          <select
            value={searchField}
            // Fix: Remove 'any' type and use proper type casting
            onChange={(e) => setSearchField(e.target.value as SearchField)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05]"
          >
            <option value="custname">By Customer Name</option>
            <option value="custid">By Customer ID</option>
            <option value="contactno1">By Contact Number</option>
          </select>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.05]"
          />
        </div>

        {/* Add New */}
        <div>
          <button
            className="bg-blue-700 hover:bg-blue-500 text-white rounded-md py-2 px-4 border border-blue-500 hover:border-transparent"
            onClick={addNewCustomer}
          >
            Add New Customer
          </button>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <div className="rounded-xl p-2 border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  Customer ID
                </TableCell>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  Customer Name
                </TableCell>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  Contact Person
                </TableCell>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  Contact Details
                </TableCell>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  </td>
                </TableRow>
              ) : currentCustomers.length > 0 ? (
                currentCustomers.map((customer) => (
                  <CustomTableRow
                    key={customer.custid}
                    className={`${getRowHighlightClass(customer)} cursor-pointer`}
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{customer.custid}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                      <span className="font-medium text-gray-800 dark:text-white/90">{customer.custname}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                      <span className="text-gray-800 dark:text-gray-200">{customer.contactperson1 || "—"}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-start flex flex-col gap-1">
                      <span className="text-gray-800 dark:text-gray-200">{customer.contactno1 || "—"}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                      <Badge color={customer.isSuspended ? "warning" : "primary"}>
                        {customer.isSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Desktop: Show all buttons */}
                        <div className="hidden md:flex items-center gap-1">
                          <button
                            onClick={(e) => handleEditCustomer(e, customer.custid)}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                            title="Edit Customer"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleViewProducts(e, customer.custid)}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                            title="View Products"
                          >
                            <Package className="h-3.5 w-3.5 mr-1" />
                            Products
                          </button>
                          {customer.isdeleted === 1 && (
                            <button
                              onClick={(e) => handleRestoreCustomer(e, customer.custid)}
                              className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              title="Restore Customer"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Restore
                            </button>
                          )}
                        </div>

                        {/* Mobile: Show dropdown menu */}
                        <div className="md:hidden relative">
                          <button
                            onClick={(e) => toggleDropdown(e, customer.custid)}
                            className="inline-flex items-center justify-center p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {activeDropdown === customer.custid && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
                              <button
                                onClick={(e) => handleEditCustomer(e, customer.custid)}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </button>
                              <button
                                onClick={(e) => handleViewProducts(e, customer.custid)}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <Package className="h-4 w-4 mr-2" /> Products
                              </button>
                              {customer.isdeleted === 1 && (
                                <button
                                  onClick={(e) => handleRestoreCustomer(e, customer.custid)}
                                  className="w-full flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" /> Restore
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </CustomTableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={6} className="text-center py-8">
                    <span className="text-gray-500 dark:text-gray-400">No Customers Found</span>
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium">
                {filteredCustomers.length > 0 ? indexOfFirstItem + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {indexOfLastItem > filteredCustomers.length ? filteredCustomers.length : indexOfLastItem}
              </span>{" "}
              of <span className="font-medium">{filteredCustomers.length}</span> results
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded ${currentPage === pageNum
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "border border-gray-200 bg-white text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Information Drawer */}
      <CustomerInformation 
        customer={selectedCustomer} 
        isOpen={showDrawer} 
        onClose={closeDrawer} 
        onCustomerUpdated={fetchCustomers}
      />

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      )}

    </div>
  );
};

export default Customers;
