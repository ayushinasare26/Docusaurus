// 'use client';

// import React, { useEffect, useState } from "react";
// import GenericTablePage from "@/components/tables/GenericTablePage";
// import { usePageHeading } from "@/context/PageHeadingContext";
// import { Button } from "@/components/ui/button";
// import AddNewPackageModal from "./AddNewPackage";
// import EditPackageModal from "./EditPackageModal"; 
// import Swal from "sweetalert2";

// type Packagegroups = {
//   packageid: number;
//   packagename: string;
//   createdate: string; // use string format for dates
// };

// export default function PackagegroupsPage() {
//   const { setHeading } = usePageHeading();
//   const [editPackageId, setEditPackageId] = useState<number | null>(null);
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [refetchTable, setRefetchTable] = useState(false);

//   useEffect(() => {
//     setHeading("Package Groups List");
//   }, [setHeading]);

//   // Handler to open Edit modal
//   const handleEdit = (packageid: number) => {
//     setEditPackageId(packageid);
//     setEditModalOpen(true);
//   };

//   // Handler to close Edit modal
//   const handleEditClose = () => {
//     setEditModalOpen(false);
//     setEditPackageId(null);
//   };

//   // Handler after successful update to refresh the table
//   const handleEditSuccess = () => {
//     setRefetchTable(prev => !prev);
//   };

//   // Delete with SweetAlert confirmation and soft delete API call
//   const handleDelete = async (packageid: number) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "This will mark the package group as deleted.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete it!",
//       cancelButtonText: "Cancel",
//     });

//     if (result.isConfirmed) {
//       try {
//         const res = await fetch(`/api/packagegroups/${packageid}`, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ isdeleted: 1 }),
//         });

//         if (res.ok) {
//           Swal.fire("Deleted!", "The package group has been deleted.", "success");
//           setRefetchTable(prev => !prev);
//         } else {
//           Swal.fire("Error", "Failed to delete the package group.", "error");
//         }
//       } catch (error) {
//         Swal.fire("Error", "An error occurred while deleting.", "error");
//       }
//     }
//   };

//   return (
//     <>
//       <GenericTablePage<Packagegroups>
//         key={refetchTable ? "refetch" : "normal"}
//         title="Package Groups"
//         fetchUrl="/api/packagegroups"
//         columns={[
//           { header: "Package group ID", accessor: "packageid" },
//           { header: "Package name", accessor: "packagename" },
//           { header: "Created date", accessor: "createdate" },
//           {
//             header: "Actions",
//             id: "actions",
//             render: (_value, row) => (
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleEdit(row.packageid);
//                   }}
//                   className="hover:bg-blue-50 hover:border-blue-300"

//                 >
//                   Edit
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDelete(row.packageid);
//                   }}
//                   className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
//                 >
//                   Delete
//                 </Button>
//               </div>
//             ),
//           },
//         ]}
//         searchFields={[
//           { label: "By Package ID", value: "packageid" },
//           { label: "By Package Name", value: "packagename" },
//           { label: "By Created date", value: "createdate" },
//         ]}
//         renderAddModal={(close, _refetch) => (
//           <AddNewPackageModal isOpen={true} onClose={close} />
//         )}
//       />

//       {editModalOpen && editPackageId !== null && (
//         <EditPackageModal
//           isOpen={editModalOpen}
//           packageid={editPackageId}
//           onClose={handleEditClose}
//           onUpdated={() => {
//             handleEditSuccess();
//             handleEditClose();
//           }}
//         />
//       )}
//     </>
//   );
// }

'use client';

import React, { useEffect, useState } from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";
import { usePageHeading } from "@/context/PageHeadingContext";
import { Button } from "@/components/ui/button";
import AddNewPackageModal from "./AddNewPackage";
import EditPackageModal from "./EditPackageModal"; 
import Swal from "sweetalert2";

type Packagegroups = {
  packageid: number;
  packagename: string;
  createdate: string; // use string format for dates
  groupcodes?: string;
};

export default function PackagegroupsPage() {
  const { setHeading } = usePageHeading();
  const [editPackageId, setEditPackageId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refetchTable, setRefetchTable] = useState(false);

  useEffect(() => {
    setHeading("Package Groups List");
  }, [setHeading]);

  // Handler to open Edit modal
  const handleEdit = (packageid: number) => {
    setEditPackageId(packageid);
    setEditModalOpen(true);
  };

  // Handler to close Edit modal
  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditPackageId(null);
  };

  // Handler after successful update to refresh the table
  const handleEditSuccess = () => {
    setRefetchTable(prev => !prev);
  };

  // Delete with SweetAlert confirmation and soft delete API call
  const handleDelete = async (packageid: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will mark the package group as deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/packagegroups/${packageid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isdeleted: 1 }),
        });

        if (res.ok) {
          Swal.fire("Deleted!", "The package group has been deleted.", "success");
          setRefetchTable(prev => !prev);
        } else {
          Swal.fire("Error", "Failed to delete the package group.", "error");
        }
      } catch {
        // Fix: Remove unused 'error' parameter - line 69
        Swal.fire("Error", "An error occurred while deleting.", "error");
      }
    }
  };

  return (
    <>
      <GenericTablePage<Packagegroups>
        key={refetchTable ? "refetch" : "normal"}
        title="Package Groups"
        fetchUrl="/api/packagegroups"
        columns={[
          { header: "Package group ID", accessor: "packageid" },
          { header: "Package name", accessor: "packagename" },
          {
            header: "Group codes",
            accessor: "groupcodes",
            render: (v: any) => {
              if (!v) return <span className="text-gray-400 italic">None</span>;
              const codes = String(v).split(', ');
              return (
                <div className="flex flex-wrap gap-1 max-w-[320px]">
                  {codes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              );
            }
          },
          { header: "Created date", accessor: "createdate" },
          {
            header: "Actions",
            id: "actions",
            render: (_value, row) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row.packageid);
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
                    handleDelete(row.packageid);
                  }}
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchFields={[
          { label: "By Package ID", value: "packageid" },
          { label: "By Package Name", value: "packagename" },
          { label: "By Created date", value: "createdate" },
        ]}
        renderAddModal={(close) => (
          // Fix: Remove unused '_refetch' parameter - line 122
          <AddNewPackageModal isOpen={true} onClose={close} />
        )}
      />

      {editModalOpen && editPackageId !== null && (
        <EditPackageModal
          isOpen={editModalOpen}
          packageid={editPackageId}
          onClose={handleEditClose}
          onUpdated={() => {
            handleEditSuccess();
            handleEditClose();
          }}
        />
      )}
    </>
  );
}