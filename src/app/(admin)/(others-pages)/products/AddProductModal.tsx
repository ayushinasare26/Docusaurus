// "use client";

// import React, { useState, useEffect } from "react";
// import { Dropdown } from "@/components/ui/dropdown/Dropdown";
// import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
// import { ChevronDown } from "lucide-react";
// import Swal from "sweetalert2";

// interface AddProductModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onAdded?: () => void;
// }

// interface PackageOption {
//   value: number;
//   label: string;
//   type?: "basic" | "package"; // Add type field
// }

// type ProductFormState = {
//   prodid: string;
//   prodname: string;
//   desc: string;
//   rent: string;
//   type: number; // Changed to number to match the selected value
//   duration: string;
//   invstatus: boolean;
// };

// const AddProductModal: React.FC<AddProductModalProps> = ({
//   isOpen,
//   onClose,
//   onAdded,
// }) => {
//   const initialFormState: ProductFormState = {
//     prodid: "",
//     prodname: "",
//     desc: "",
//     rent: "",
//     type: 0, // Default to "Others"
//     duration: "",
//     invstatus: false,
//   };

//   const [formData, setFormData] = useState<ProductFormState>(initialFormState);
//   const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
//   const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

// useEffect(() => {
//   async function fetchPackageOptions() {
//     try {
//       setLoading(true);
//       const res = await fetch('/api/products/packageOptions');
//       if (res.ok) {
//         const data: PackageOption[] = await res.json();
//         console.log('Package Options received:', data); // ADD THIS DEBUG LOG
//         setPackageOptions(data);
//       } else {
//         console.error('Failed to fetch package options');
//         Swal.fire("Error", "Failed to load package options", "error");
//       }
//     } catch (error) {
//       console.error('Error fetching package options:', error);
//       Swal.fire("Error", "Failed to load package options", "error");
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (isOpen) {
//     fetchPackageOptions();
//     // Reset form when modal opens
//     setFormData({ ...initialFormState }); // Create new object to avoid reference issues
//   }
// }, [isOpen]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const target = e.target;
//     const { name } = target;

//     const value =
//       (target as HTMLInputElement).type === 'checkbox'
//         ? (target as HTMLInputElement).checked
//         : target.value;

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleTypeSelect = (typeOption: PackageOption) => {
//     setFormData(prev => ({ 
//       ...prev, 
//       type: typeOption.value 
//     }));
//     setIsTypeDropdownOpen(false);
//   };

//   // Helper function to get display label with prefix
//   const getDisplayLabel = (option: PackageOption) => {
//     // Check if it's a basic type (values 0-3) or package group
//     if (option.type === "basic" || option.value <= 3) {
//       return option.label;
//     }
//     return `Package Group: ${option.label}`;
//   };

//   // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//   //   e.preventDefault();

//   //   try {
//   //     // Construct payload
//   //     const payload = {
//   //       prodid: formData.prodid,
//   //       prodname: formData.prodname,
//   //       desc: formData.desc,
//   //       rent: parseFloat(formData.rent) || 0,
//   //       type: formData.type,
//   //       duration: parseInt(formData.duration, 10) || 0,
//   //       invstatus: formData.invstatus ? 1 : 0,
//   //     };

//   //     const response = await fetch("/api/products", {
//   //       method: "POST", 
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify(payload),
//   //     });

//   //     if (response.ok) {
//   //       await Swal.fire({
//   //         title: "Success!",
//   //         text: "Product added successfully",
//   //         icon: "success",
//   //         timer: 1500,
//   //         showConfirmButton: false
//   //       });
        
//   //       setFormData(initialFormState); // Reset form
//   //       if (onAdded) onAdded();
//   //       onClose();
//   //     } else {
//   //       const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//   //       Swal.fire("Error", errorData.error || "Failed to add product", "error");
//   //     }
//   //   } catch (err) {
//   //     console.error("Error adding product:", err);
//   //     Swal.fire("Error", "Failed to add product", "error");
//   //   }
//   // };

// const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//   e.preventDefault();

//   try {
//     // Construct payload with proper type conversions
//     const payload = {
//       prodid: formData.prodid.trim() || null,
//       prodname: formData.prodname.trim(),
//       desc: formData.desc.trim() || '', // ✅ Send empty string instead of null
//       rent: formData.rent ? parseFloat(formData.rent) : 0,
//       type: Number(formData.type), // This should be the selected type/package ID
//       duration: formData.duration ? parseInt(formData.duration, 10) : 0,
//       invstatus: formData.invstatus ? 1 : 0,
//     };

//     // Debug logs
//     console.log('Form Data:', formData);
//     console.log('Selected Type:', formData.type, typeof formData.type);
//     console.log('Final Payload:', payload);
//     console.log('Payload Type:', payload.type, typeof payload.type);

//     // Validate required fields
//     if (!payload.prodname) {
//       Swal.fire("Error", "Product name is required", "error");
//       return;
//     }

//     if (payload.rent < 0) {
//       Swal.fire("Error", "Rent cannot be negative", "error");
//       return;
//     }

//     if (payload.duration < 0) {
//       Swal.fire("Error", "Duration cannot be negative", "error");
//       return;
//     }

//     const response = await fetch("/api/products", {
//       method: "POST", 
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (response.ok) {
//       await Swal.fire({
//         title: "Success!",
//         text: "Product added successfully",
//         icon: "success",
//         timer: 1500,
//         showConfirmButton: false
//       });
      
//       setFormData(initialFormState);
//       if (onAdded) onAdded();
//       onClose();
//     } else {
//       const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//       console.error('Server response:', errorData);
//       Swal.fire("Error", errorData.error || "Failed to add product", "error");
//     }
//   } catch (err) {
//     console.error("Error adding product:", err);
//     Swal.fire("Error", "Failed to add product", "error");
//   }
// };

//   if (!isOpen) return null;

//   if (loading) {
//     return (
//       <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//         <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
//           <div className="flex items-center justify-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//             <span className="ml-3 text-gray-700 dark:text-gray-300">Loading...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const selectedType = packageOptions.find(option => option.value === formData.type);

//   return (
//     <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//       <div
//         className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-2xl p-6 overflow-visible rounded-lg relative"
//         style={{ maxHeight: "90vh" }}
//       >
//         <div className="flex justify-between items-center border-b pb-4 mb-6">
//           <h2 className="text-xl font-bold text-gray-800 dark:text-white">
//             Add New Product
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
//           >
//             &times;
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
//           <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
//             <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">
//               Product Information
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input type="hidden" name="prodid" value={formData.prodid} />
              
//               <div>
//                 <label
//                   htmlFor="prodname"
//                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
//                 >
//                   Product Name
//                 </label>
//                 <input
//                   type="text"
//                   id="prodname"
//                   name="prodname"
//                   value={formData.prodname}
//                   onChange={handleChange}
//                   required
//                   className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="rent"
//                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
//                 >
//                   Monthly Rent
//                 </label>
//                 <input
//                   type="number"
//                   id="rent"
//                   name="rent"
//                   value={formData.rent}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.01"
//                   className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>

//               {/* Updated Product Type Dropdown */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Product Type
//                 </label>
                
//                 <div className="relative">
//                   <button
//                     type="button"
//                     className="dropdown-toggle w-full justify-between h-11 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center transition-colors"
//                     onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
//                   >
//                     <span className="text-gray-700 dark:text-gray-300">
//                       {selectedType ? getDisplayLabel(selectedType) : "Select Product Type"}
//                     </span>
//                     <ChevronDown 
//                       className={`h-4 w-4 opacity-50 transition-transform ${
//                         isTypeDropdownOpen ? 'rotate-180' : ''
//                       }`} 
//                     />
//                   </button>

//                   <Dropdown
//                     isOpen={isTypeDropdownOpen}
//                     onClose={() => setIsTypeDropdownOpen(false)}
//                     className="w-full min-w-[400px] max-h-60 overflow-y-auto z-[60] left-0"
//                   >
//                     {/* Basic Types Section */}
//                     {packageOptions.filter(option => option.type === "basic" || option.value <= 3).length > 0 && (
//                       <>
//                         <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
//                           Basic Types
//                         </div>
//                         {packageOptions
//                           .filter(option => option.type === "basic" || option.value <= 3)
//                           .map((option, index) => (
//                             <DropdownItem
//                               key={`basic-${option.value}-${index}`}
//                               onClick={() => handleTypeSelect(option)}
//                               className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
//                                 formData.type === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
//                               }`}
//                             >
//                               <span className="font-medium">{option.label}</span>
//                             </DropdownItem>
//                           ))}
//                       </>
//                     )}
                    
//                     {/* Package Groups Section */}
//                     {packageOptions.filter(option => option.type === "package" || option.value > 3).length > 0 && (
//                       <>
//                         <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
//                           Package Groups
//                         </div>
//                         {packageOptions
//                           .filter(option => option.type === "package" || option.value > 3)
//                           .map((option, index) => (
//                             <DropdownItem
//                               key={`package-${option.value}-${index}`}
//                               onClick={() => handleTypeSelect(option)}
//                               className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
//                                 formData.type === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
//                               }`}
//                             >
//                               <span className="font-medium">Package Group: {option.label}</span>
//                             </DropdownItem>
//                           ))}
//                       </>
//                     )}
                    
//                     {packageOptions.length === 0 && (
//                       <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-sm">
//                         No product types available
//                       </div>
//                     )}
//                   </Dropdown>
//                 </div>
//               </div>

//               <div>
//                 <label
//                   htmlFor="duration"
//                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
//                 >
//                   Duration (months)
//                 </label>
//                 <input
//                   type="number"
//                   id="duration"
//                   name="duration"
//                   value={formData.duration}
//                   onChange={handleChange}
//                   min="0"
//                   className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label
//                   htmlFor="desc"
//                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
//                 >
//                   Description
//                 </label>
//                 <textarea
//                   id="desc"
//                   name="desc"
//                   value={formData.desc}
//                   onChange={handleChange}
//                   rows={3}
//                   className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter product description..."
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="invstatus"
//                     name="invstatus"
//                     checked={formData.invstatus}
//                     onChange={handleChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label
//                     htmlFor="invstatus"
//                     className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
//                   >
//                     Consider in Invoice?
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end space-x-3 pt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm transition-colors"
//             >
//               Add Product
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddProductModal;

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronDown } from "lucide-react";
import Swal from "sweetalert2";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

interface PackageOption {
  value: number;
  label: string;
  type?: "basic" | "package"; // Add type field
}

type ProductFormState = {
  prodid: string;
  prodname: string;
  desc: string;
  rent: string;
  type: number; // Changed to number to match the selected value
  duration: string;
  invstatus: boolean;
};

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdded,
}) => {
  // Fix: Move initialFormState outside component or use useMemo to stabilize the reference
  const initialFormState: ProductFormState = useMemo(() => ({
    prodid: "",
    prodname: "",
    desc: "",
    rent: "",
    type: 0, // Default to "Others"
    duration: "",
    invstatus: false,
  }), []); // Empty dependency array since this is truly static

  const [formData, setFormData] = useState<ProductFormState>(initialFormState);
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPackageOptions() {
      try {
        setLoading(true);
        const res = await fetch('/api/products/packageOptions');
        if (res.ok) {
          const data: PackageOption[] = await res.json();
          console.log('Package Options received:', data);
          setPackageOptions(data);
        } else {
          console.error('Failed to fetch package options');
          Swal.fire("Error", "Failed to load package options", "error");
        }
      } catch (error) {
        console.error('Error fetching package options:', error);
        Swal.fire("Error", "Failed to load package options", "error");
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchPackageOptions();
      // Reset form when modal opens
      setFormData({ ...initialFormState }); // Create new object to avoid reference issues
    }
  }, [isOpen, initialFormState]); // Fix: Now initialFormState is stable

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name } = target;

    const value =
      (target as HTMLInputElement).type === 'checkbox'
        ? (target as HTMLInputElement).checked
        : target.value;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (typeOption: PackageOption) => {
    setFormData(prev => ({ 
      ...prev, 
      type: typeOption.value 
    }));
    setIsTypeDropdownOpen(false);
  };

  // Helper function to get display label with prefix
  const getDisplayLabel = (option: PackageOption) => {
    // Check if it's a basic type (values 0-3) or package group
    if (option.type === "basic" || option.value <= 3) {
      return option.label;
    }
    return `Package Group: ${option.label}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Construct payload with proper type conversions
      const payload = {
        prodid: formData.prodid.trim() || null,
        prodname: formData.prodname.trim(),
        desc: formData.desc.trim() || '', // ✅ Send empty string instead of null
        rent: formData.rent ? parseFloat(formData.rent) : 0,
        type: Number(formData.type), // This should be the selected type/package ID
        duration: formData.duration ? parseInt(formData.duration, 10) : 0,
        invstatus: formData.invstatus ? 1 : 0,
      };

      // Debug logs
      console.log('Form Data:', formData);
      console.log('Selected Type:', formData.type, typeof formData.type);
      console.log('Final Payload:', payload);
      console.log('Payload Type:', payload.type, typeof payload.type);

      // Validate required fields
      if (!payload.prodname) {
        Swal.fire("Error", "Product name is required", "error");
        return;
      }

      if (payload.rent < 0) {
        Swal.fire("Error", "Rent cannot be negative", "error");
        return;
      }

      if (payload.duration < 0) {
        Swal.fire("Error", "Duration cannot be negative", "error");
        return;
      }

      const response = await fetch("/api/products", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await Swal.fire({
          title: "Success!",
          text: "Product added successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        
        setFormData(initialFormState);
        if (onAdded) onAdded();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server response:', errorData);
        Swal.fire("Error", errorData.error || "Failed to add product", "error");
      }
    } catch (err) {
      console.error("Error adding product:", err);
      Swal.fire("Error", "Failed to add product", "error");
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedType = packageOptions.find(option => option.value === formData.type);

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-2xl p-6 overflow-visible rounded-lg relative"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
            <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="prodid" value={formData.prodid} />
              
              <div>
                <label
                  htmlFor="prodname"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  id="prodname"
                  name="prodname"
                  value={formData.prodname}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="rent"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Monthly Rent
                </label>
                <input
                  type="number"
                  id="rent"
                  name="rent"
                  value={formData.rent}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Updated Product Type Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type
                </label>
                
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-toggle w-full justify-between h-11 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center transition-colors"
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedType ? getDisplayLabel(selectedType) : "Select Product Type"}
                    </span>
                    <ChevronDown 
                      className={`h-4 w-4 opacity-50 transition-transform ${
                        isTypeDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  <Dropdown
                    isOpen={isTypeDropdownOpen}
                    onClose={() => setIsTypeDropdownOpen(false)}
                    className="w-full min-w-[400px] max-h-60 overflow-y-auto z-[60] left-0"
                  >
                    {/* Basic Types Section */}
                    {packageOptions.filter(option => option.type === "basic" || option.value <= 3).length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Basic Types
                        </div>
                        {packageOptions
                          .filter(option => option.type === "basic" || option.value <= 3)
                          .map((option, index) => (
                            <DropdownItem
                              key={`basic-${option.value}-${index}`}
                              onClick={() => handleTypeSelect(option)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
                                formData.type === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <span className="font-medium">{option.label}</span>
                            </DropdownItem>
                          ))}
                      </>
                    )}
                    
                    {/* Package Groups Section */}
                    {packageOptions.filter(option => option.type === "package" || option.value > 3).length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Package Groups
                        </div>
                        {packageOptions
                          .filter(option => option.type === "package" || option.value > 3)
                          .map((option, index) => (
                            <DropdownItem
                              key={`package-${option.value}-${index}`}
                              onClick={() => handleTypeSelect(option)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
                                formData.type === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <span className="font-medium">Package Group: {option.label}</span>
                            </DropdownItem>
                          ))}
                      </>
                    )}
                    
                    {packageOptions.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-sm">
                        No product types available
                      </div>
                    )}
                  </Dropdown>
                </div>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Duration (months)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="desc"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="desc"
                  name="desc"
                  value={formData.desc}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description..."
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="invstatus"
                    name="invstatus"
                    checked={formData.invstatus}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="invstatus"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Consider in Invoice?
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm transition-colors"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;