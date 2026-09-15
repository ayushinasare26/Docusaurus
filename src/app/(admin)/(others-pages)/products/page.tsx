// 'use client';

// import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
// import { usePageHeading } from "@/context/PageHeadingContext";
// import { Button } from "@/components/ui/button";
// import Swal from "sweetalert2";

// // Lazy load components to reduce initial bundle size
// const GenericTablePage = lazy(() => import("@/components/tables/GenericTablePage"));
// const AddProductModal = lazy(() => import("./AddProductModal"));
// const EditProductModal = lazy(() => import("./EditProductModal"));


// // Type for products
// type Product = {
//   prodid: number;
//   prodname: string;
//   desc: string;
//   rent: number;
//   type: number;
//   duration: number;
//   invstatus: number;
//   isdeleted: number;
// };

// // Loading component for Suspense
// const LoadingSpinner = () => (
//   <div className="flex items-center justify-center p-8">
//     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//     <span className="ml-3 text-gray-700">Loading...</span>
//   </div>
// );

// // Memoized ProductsPage component to prevent unnecessary re-renders
// const ProductsPage = React.memo(() => {
//   const { setHeading } = usePageHeading();
//   const [packageMapping, setPackageMapping] = useState<{ [key: number]: string }>({});

  
//   // Optimized state management
//   const [editState, setEditState] = useState<{
//     prodId: number | null;
//     isOpen: boolean;
//   }>({ prodId: null, isOpen: false });
  
//   const [tableKey, setTableKey] = useState<string>('initial');

//   // Set heading only once
//   useEffect(() => {
//     setHeading("Products List");
//   }, [setHeading]);

//   // Memoized handlers to prevent re-creation on every render
//   const handleEditClick = useCallback((prodid: number) => {
//     setEditState({ prodId: prodid, isOpen: true });
//   }, []);

//   const handleEditClose = useCallback(() => {
//     setEditState({ prodId: null, isOpen: false });
//   }, []);

//   const handleEditSuccess = useCallback(() => {
//     // Use timestamp for more reliable updates
//     setTableKey(`update-${Date.now()}`);
//   }, []);

//   // Optimized delete handler
//   const handleDelete = useCallback(async (prodid: number) => {
//     try {
//       const result = await Swal.fire({
//         title: "Delete Product",
//         text: "This action cannot be undone",
//         icon: "warning",
//         showCancelButton: true,
//         confirmButtonText: "Delete",
//         cancelButtonText: "Cancel",
//         confirmButtonColor: '#dc2626',
//         cancelButtonColor: '#6b7280',
//         reverseButtons: true,
//       });

//       if (!result.isConfirmed) return;

//       // Show loading state
//       Swal.fire({
//         title: 'Deleting...',
//         allowOutsideClick: false,
//         didOpen: () => Swal.showLoading()
//       });

//       const res = await fetch(`/api/products/${prodid}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ isdeleted: 1 }),
//       });

//       if (res.ok) {
//         await Swal.fire({
//           title: "Deleted!",
//           text: "Product has been deleted successfully",
//           icon: "success",
//           timer: 1500,
//           showConfirmButton: false
//         });
        
//         // Optimistic update
//         setTableKey(`delete-${prodid}-${Date.now()}`);
//       } else {
//         const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
//         throw new Error(errorData.error || 'Failed to delete product');
//       }
//     } catch (error) {
//       console.error('Delete error:', error);
//       Swal.fire({
//         title: "Error",
//         text: error instanceof Error ? error.message : "Failed to delete product",
//         icon: "error"
//       });
//     }
//   }, []);

//   // Add useEffect to fetch package mappings
// useEffect(() => {
//   const fetchPackageMappings = async () => {
//     try {
//       const res = await fetch('/api/products/packageOptions');
//       if (res.ok) {
//         const data = await res.json();
        
//         // Create mapping of package IDs to names
//         const mapping: { [key: number]: string } = {};
//         data.forEach((item: any) => {
//           if (item.type === 'package') {
//             mapping[item.value] = item.label;
//           }
//         });
        
//         setPackageMapping(mapping);
//       }
//     } catch (error) {
//       console.error('Failed to fetch package mappings:', error);
//     }
//   };

//   fetchPackageMappings();
// }, []);

//   // Memoized columns configuration with correct typing
//   const columns = useMemo(() => [
//     { 
//       header: "Prod ID", 
//       accessor: "prodid" 
//     },
//     { 
//       header: "Prod Name", 
//       accessor: "prodname" 
//     },
//     { 
//       header: "Description", 
//       accessor: "desc" 
//     },
//     { 
//       header: "Monthly Rent", 
//       accessor: "rent" 
//     },
// { 
//   header: "Product Type", 
//   accessor: "type",
//   render: (value: any) => {
//     const basicTypes: { [key: number]: string } = {
//       0: "Others",
//       1: "DID",
//       2: "Access Number", 
//       3: "PSTN Line"
//     };
    
//     // If it's a basic type (0-3), return the name
//     if (basicTypes[value] !== undefined) {
//       return <span className="text-sm">{basicTypes[value]}</span>;
//     }
    
//       // If it's a package group, show the actual package name
//       const packageName = packageMapping[value];
//       if (packageName) {
//         return <span className="text-sm">{packageName}</span>;
//       }
//       return <span className="text-sm text-gray-500">Unknown</span>;
//   }
  
// },

//     {
//       header: "In Invoice?",
//       accessor: "invstatus",
//       render: (value: any) => (
//         <span className={`px-2 py-1 rounded text-xs font-medium ${
//           value === 1 
//             ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
//             : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
//         }`}>
//           {value === 1 ? "Yes" : "No"}
//         </span>
//       ),
//     },
//     {
//       header: "Actions",
//       id: "actions",
//       render: (_value: any, row: unknown) => {
//         const product = row as Product;
//         return (
//           <div className="flex gap-2">
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleEditClick(product.prodid);
//               }}
//               className="hover:bg-blue-50 hover:border-blue-300"
//             >
//               Edit
//             </Button>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDelete(product.prodid);
//               }}
//               className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
//             >
//               Delete
//             </Button>
//           </div>
//         );
//       },
//     },
//   ], [handleEditClick, handleDelete, packageMapping]);

//   // Memoized search fields
//   const searchFields = useMemo(() => [
//     { label: "By Product ID", value: "prodid" },
//     { label: "By Product Name", value: "prodname" },
//     { label: "By Description", value: "desc" },
//   ], []);

//   // Memoized add modal render function
//   const renderAddModal = useCallback((close: () => void, refetch: () => void) => (
//     <Suspense fallback={<LoadingSpinner />}>
//       <AddProductModal 
//         isOpen={true} 
//         onClose={close}
//         onAdded={() => {
//           refetch();
//           setTableKey(`add-${Date.now()}`);
//         }}
//       />
//     </Suspense>
//   ), []);

//   return (
//     <div className="w-full">
//       <Suspense fallback={<LoadingSpinner />}>
//         <GenericTablePage
//           key={tableKey}
//           title="Products"
//           fetchUrl="/api/products"
//           columns={columns}
//           searchFields={searchFields}
//           renderAddModal={renderAddModal}
//         />
//       </Suspense>

//       {editState.isOpen && editState.prodId !== null && (
//         <Suspense fallback={<LoadingSpinner />}>
//           <EditProductModal
//             isOpen={editState.isOpen}
//             prodid={editState.prodId}
//             onClose={handleEditClose}
//             onUpdated={() => {
//               handleEditSuccess();
//               handleEditClose();
//             }}
//           />
//         </Suspense>
//       )}
//     </div>
//   );
// });

// ProductsPage.displayName = 'ProductsPage';

// export default ProductsPage;

'use client';

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { usePageHeading } from "@/context/PageHeadingContext";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

// Lazy load components to reduce initial bundle size
const GenericTablePage = lazy(() => import("@/components/tables/GenericTablePage"));
const AddProductModal = lazy(() => import("./AddProductModal"));
const EditProductModal = lazy(() => import("./EditProductModal"));

// Type for products
type Product = {
  prodid: number;
  prodname: string;
  desc: string;
  rent: number;
  type: number;
  duration: number;
  invstatus: number;
  isdeleted: number;
};

// Interface for package option API response
interface PackageOption {
  value: number;
  label: string;
  type: 'basic' | 'package';
}

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-700">Loading...</span>
  </div>
);

// Memoized ProductsPage component to prevent unnecessary re-renders
const ProductsPage = React.memo(() => {
  const { setHeading } = usePageHeading();
  const [packageMapping, setPackageMapping] = useState<{ [key: number]: string }>({});

  
  // Optimized state management
  const [editState, setEditState] = useState<{
    prodId: number | null;
    isOpen: boolean;
  }>({ prodId: null, isOpen: false });
  
  const [tableKey, setTableKey] = useState<string>('initial');

  // Set heading only once
  useEffect(() => {
    setHeading("Products List");
  }, [setHeading]);

  // Memoized handlers to prevent re-creation on every render
  const handleEditClick = useCallback((prodid: number) => {
    setEditState({ prodId: prodid, isOpen: true });
  }, []);

  const handleEditClose = useCallback(() => {
    setEditState({ prodId: null, isOpen: false });
  }, []);

  const handleEditSuccess = useCallback(() => {
    // Use timestamp for more reliable updates
    setTableKey(`update-${Date.now()}`);
  }, []);

  // Optimized delete handler
  const handleDelete = useCallback(async (prodid: number) => {
    try {
      const result = await Swal.fire({
        title: "Delete Product",
        text: "This action cannot be undone",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      // Show loading state
      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(`/api/products/${prodid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isdeleted: 1 }),
      });

      if (res.ok) {
        await Swal.fire({
          title: "Deleted!",
          text: "Product has been deleted successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        
        // Optimistic update
        setTableKey(`delete-${prodid}-${Date.now()}`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire({
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to delete product",
        icon: "error"
      });
    }
  }, []);

  // Add useEffect to fetch package mappings
  useEffect(() => {
    const fetchPackageMappings = async () => {
      try {
        const res = await fetch('/api/products/packageOptions');
        if (res.ok) {
          const data: PackageOption[] = await res.json();
          
          // Create mapping of package IDs to names
          const mapping: { [key: number]: string } = {};
          data.forEach((item: PackageOption) => {
            if (item.type === 'package') {
              mapping[item.value] = item.label;
            }
          });
          
          setPackageMapping(mapping);
        }
      } catch (error) {
        console.error('Failed to fetch package mappings:', error);
      }
    };

    fetchPackageMappings();
  }, []);

  // Memoized columns configuration with correct typing
  const columns = useMemo(() => [
    { 
      header: "Prod ID", 
      accessor: "prodid" 
    },
    { 
      header: "Prod Name", 
      accessor: "prodname" 
    },
    { 
      header: "Description", 
      accessor: "desc" 
    },
    { 
      header: "Monthly Rent", 
      accessor: "rent",
      render: (value: unknown) => (
        <span>{Number(value).toFixed(2)}</span>
      )
    },
    { 
      header: "Product Type", 
      accessor: "type",
      render: (value: unknown) => { // Fix: Replace 'any' with 'unknown'
        const typeValue = value as number; // Type assertion for safe usage
        const basicTypes: { [key: number]: string } = {
          0: "Others",
          1: "DID",
          2: "Access Number", 
          3: "PSTN Line"
        };
        
        // If it's a basic type (0-3), return the name
        if (basicTypes[typeValue] !== undefined) {
          return <span className="text-sm">{basicTypes[typeValue]}</span>;
        }
        
        // If it's a package group, show the actual package name
        const packageName = packageMapping[typeValue];
        if (packageName) {
          return <span className="text-sm">{packageName}</span>;
        }
        return <span className="text-sm text-gray-500">Unknown</span>;
      }
    },
    {
      header: "In Invoice?",
      accessor: "invstatus",
      render: (value: unknown) => { // Fix: Replace 'any' with 'unknown'
        const statusValue = value as number; // Type assertion for safe usage
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            statusValue === 1 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {statusValue === 1 ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      render: (value: unknown, row: unknown) => { // Fix: Replace 'any' with 'unknown'
        const product = row as Product;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(product.prodid);
              }}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product.prodid);
              }}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ], [handleEditClick, handleDelete, packageMapping]);

  // Memoized search fields
  const searchFields = useMemo(() => [
    { label: "By Product ID", value: "prodid" },
    { label: "By Product Name", value: "prodname" },
    { label: "By Description", value: "desc" },
    { label: "By Monthly Rent", value: "rent" },
  ], []);

  // Memoized add modal render function
  const renderAddModal = useCallback((close: () => void, refetch: () => void) => (
    <Suspense fallback={<LoadingSpinner />}>
      <AddProductModal 
        isOpen={true} 
        onClose={close}
        onAdded={() => {
          refetch();
          setTableKey(`add-${Date.now()}`);
        }}
      />
    </Suspense>
  ), []);

  return (
    <div className="w-full">
      <Suspense fallback={<LoadingSpinner />}>
        <GenericTablePage
          key={tableKey}
          title="Products"
          fetchUrl="/api/products"
          columns={columns}
          searchFields={searchFields}
          renderAddModal={renderAddModal}
        />
      </Suspense>

      {editState.isOpen && editState.prodId !== null && (
        <Suspense fallback={<LoadingSpinner />}>
          <EditProductModal
            isOpen={editState.isOpen}
            prodid={editState.prodId}
            onClose={handleEditClose}
            onUpdated={() => {
              handleEditSuccess();
              handleEditClose();
            }}
          />
        </Suspense>
      )}
    </div>
  );
});

ProductsPage.displayName = 'ProductsPage';

export default ProductsPage;