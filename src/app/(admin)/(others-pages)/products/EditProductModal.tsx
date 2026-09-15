// 'use client';

// import React, { useState, useEffect, useMemo } from "react";
// import { SearchDropdown } from "@/components/ui/dropdown/SearchDropdown";

// interface PackageOption {
//   value: number;
//   label: string;
// }

// interface EditProductModalProps {
//   isOpen: boolean;
//   prodid: string | number | null;
//   onClose: () => void;
//   onUpdated?: () => void;
// }

// const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, prodid, onClose, onUpdated }) => {
//   const [initialFormData, setInitialFormData] = useState({
//     prodname: "",
//     desc: "",
//     rent: "",
//     type: "0",
//     duration: "",
//     invstatus: false,
//   });

//   const [formData, setFormData] = useState({ ...initialFormData });
//   const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Fetch product details on open and prodid change
//   useEffect(() => {
//     if (isOpen && prodid) {
//       setLoading(true);
//       fetch(`/api/products/${prodid}`)
//         .then(res => res.json())
//         .then(data => {
//           const filledData = {
//             prodname: data.prodname || "",
//             desc: data.desc || "",
//             rent: data.rent != null ? data.rent.toString() : "",
//             type: data.type != null ? data.type.toString() : "0",
//             duration: data.duration != null ? data.duration.toString() : "",
//             invstatus: Boolean(data.invstatus),
//           };
//           setInitialFormData(filledData);
//           setFormData(filledData);
//         })
//         .finally(() => setLoading(false));
//     }
//   }, [isOpen, prodid]);

//   // Fetch package options on open
// useEffect(() => {
//   if (isOpen && prodid) {
//     setLoading(true);
//     fetch(`/api/products/${prodid}`)
//       .then(res => {
//         if (!res.ok) throw new Error(`Failed to fetch (status ${res.status})`);
//         return res.text(); // get raw text first
//       })
//       .then(text => {
//         if (!text) throw new Error("Empty response body");
//         return JSON.parse(text); // parse JSON only on non-empty
//       })
//       .then(data => {
//         const filledData = {
//           prodname: data.prodname || "",
//           desc: data.desc || "",
//           rent: data.rent != null ? data.rent.toString() : "",
//           type: data.type != null ? data.type.toString() : "0",
//           duration: data.duration != null ? data.duration.toString() : "",
//           invstatus: Boolean(data.invstatus),
//         };
//         setInitialFormData(filledData);
//         setFormData(filledData);
//       })
//       .catch(err => {
//         console.error("Error loading product data:", err);
//         // Optionally show an error UI or message here
//       })
//       .finally(() => setLoading(false));
//   }
// }, [isOpen, prodid]);


//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const target = e.target;
//     const { name, type } = target;
//     const value = type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // Enable update button only if form changed
//   const isDirty = useMemo(() => {
//     return JSON.stringify(formData) !== JSON.stringify(initialFormData);
//   }, [formData, initialFormData]);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const payload = {
//       prodname: formData.prodname,
//       desc: formData.desc,
//       rent: parseFloat(formData.rent) || 0,
//       type: parseInt(formData.type, 10) || 0,
//       duration: parseInt(formData.duration, 10) || 0,
//       invstatus: formData.invstatus ? 1 : 0,
//     };

//     const res = await fetch(`/api/products/${prodid}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (res.ok) {
//       if (onUpdated) onUpdated();
//       onClose();
//     } else {
//       alert("Update failed!");
//     }
//   };

//   if (!isOpen) return null;
//   if (loading) return <div>Loading...</div>;

//   return (
//     <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-xl p-6 overflow-y-auto rounded-lg" style={{ maxHeight: "90vh" }}>
//         <div className="flex justify-between items-center border-b pb-4 mb-6">
//           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Product</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
//         </div>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label htmlFor="prodname" className="block text-sm font-medium">Product Name</label>
//               <input
//                 type="text"
//                 id="prodname"
//                 name="prodname"
//                 value={formData.prodname}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//               />
//             </div>
//             <div>
//               <label htmlFor="desc" className="block text-sm font-medium">Description</label>
//               <input
//                 type="text"
//                 id="desc"
//                 name="desc"
//                 value={formData.desc}
//                 onChange={handleChange}
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//               />
//             </div>
//             <div>
//               <label htmlFor="rent" className="block text-sm font-medium">Monthly Rent</label>
//               <input
//                 type="number"
//                 id="rent"
//                 name="rent"
//                 value={formData.rent}
//                 onChange={handleChange}
//                 min="0"
//                 step="0.01"
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//               />
//             </div>
//             <div>
//               <label htmlFor="type" className="block text-sm font-medium">Product Basic Type</label>
//               <select
//                 id="type"
//                 name="type"
//                 value={formData.type}
//                 onChange={handleChange}
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//               >
//                 <option value="0">Others</option>
//                 <option value="1">DID</option>
//                 <option value="2">Access Number</option>
//                 <option value="3">PSTN Line</option>
//                 {packageOptions.map(pkg => (
//                   <option key={pkg.value} value={pkg.value}>{pkg.label}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label htmlFor="duration" className="block text-sm font-medium">Duration in Minutes (Only for Packages)</label>
//               <input
//                 type="number"
//                 id="duration"
//                 name="duration"
//                 value={formData.duration}
//                 onChange={handleChange}
//                 min="0"
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//               />
//             </div>
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="invstatus"
//                 name="invstatus"
//                 checked={formData.invstatus}
//                 onChange={handleChange}
//                 className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//               />
//               <label htmlFor="invstatus" className="ml-2 block text-sm font-medium">Consider in Invoice?</label>
//             </div>
//           </div>
//         <div className="flex justify-between pt-4">
//           <div className="flex justify-end space-x-3 pt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={!isDirty}
//               className={`px-6 py-2 rounded-md text-white text-sm ${
//                 isDirty ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-400 cursor-not-allowed'
//               }`}
//             >
//               Update
//             </button>
//           </div>
//         </div>

//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditProductModal;

// 'use client';

// import React, { useState, useEffect, useMemo } from "react";
// import { Dropdown } from "@/components/ui/dropdown/Dropdown";
// import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
// import { ChevronDown } from "lucide-react";
// import Swal from "sweetalert2";

// interface PackageOption {
//   value: number;
//   label: string;
//   type?: "basic" | "package"; // Add type field
// }

// interface EditProductModalProps {
//   isOpen: boolean;
//   prodid: string | number | null;
//   onClose: () => void;
//   onUpdated?: () => void;
// }

// const EditProductModal: React.FC<EditProductModalProps> = ({ 
//   isOpen, 
//   prodid, 
//   onClose, 
//   onUpdated 
// }) => {
//   const [initialFormData, setInitialFormData] = useState({
//     prodname: "",
//     desc: "",
//     rent: "",
//     type: "0",
//     duration: "",
//     invstatus: false,
//     packageid: null as number | null,
//   });

//   const [formData, setFormData] = useState({ ...initialFormData });
//   const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);

//   // Fetch product details on open and prodid change
//   useEffect(() => {
//     if (isOpen && prodid) {
//       setLoading(true);
//       console.log("fetching : ",prodid)
//       Promise.all([
//         fetch(`/api/products/${prodid}`).then(res => res.json()),
//         fetch("/api/products/packageOptions").then(res => res.json())
//       ])
//         .then(([productData, packageOpts]) => {
//           const productFormData = {
//             prodname: productData.prodname || "",
//             desc: productData.desc || "",
//             rent: productData.rent?.toString() || "",
//             type: productData.type?.toString() || "0",
//             duration: productData.duration?.toString() || "",
//             invstatus: productData.invstatus === 1,
//             packageid: productData.packageid || null,
//           };
          
//           setFormData(productFormData);
//           setInitialFormData(productFormData);
//           setPackageOptions(packageOpts);
//         })
//         .catch((error) => {
//           console.error("Error fetching product data:", error);
//           Swal.fire("Error", "Failed to load product data.", "error");
//         })
//         .finally(() => setLoading(false));
//     }
//   }, [isOpen, prodid]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const target = e.target;
//     const { name, type } = target;
//     const value = type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handlePackageSelect = (packageOption: PackageOption) => {
//     setFormData(prev => ({ 
//       ...prev, 
//       packageid: packageOption.value 
//     }));
//     setIsPackageDropdownOpen(false);
//   };

//   const handleRemovePackage = () => {
//     setFormData(prev => ({ 
//       ...prev, 
//       packageid: null 
//     }));
//   };

//   // Enable update button only if form changed
//   const isDirty = useMemo(() => {
//     return JSON.stringify(formData) !== JSON.stringify(initialFormData);
//   }, [formData, initialFormData]);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     try {
//       const payload = {
//         prodname: formData.prodname,
//         desc: formData.desc,
//         rent: parseFloat(formData.rent) || 0,
//         type: parseInt(formData.type, 10) || 0,
//         duration: parseInt(formData.duration, 10) || 0,
//         invstatus: formData.invstatus ? 1 : 0,
//         packageid: formData.packageid,
//       };

//       const res = await fetch(`/api/products/${prodid}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         Swal.fire("Success", "Product updated successfully", "success");
//         onUpdated?.();
//         onClose();
//       } else {
//         const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
//         Swal.fire("Error", errorData.error || "Failed to update product", "error");
//       }
//     } catch (error) {
//       console.error('Update error:', error);
//       Swal.fire("Error", "Failed to update product", "error");
//     }
//   };

//   if (!isOpen) return null;
  
//   if (loading) {
//     return (
//       <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//         <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
//           <div className="flex items-center justify-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//             <span className="ml-3 text-gray-700 dark:text-gray-300">Loading product data...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Helper function to get display label with prefix
//   const getDisplayLabel = (option: PackageOption) => {
//     // Check if it's a basic type (values 0-3) or package group
//     if (option.type === "basic" || option.value <= 3) {
//       return option.label;
//     }
//     return `Package Group: ${option.label}`;
//   };

//   const selectedPackage = packageOptions.find(pkg => pkg.value === formData.packageid);

//   return (
//     <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//       <div 
//         className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-2xl p-6 overflow-visible rounded-lg relative" 
//         style={{ maxHeight: "90vh" }}
//       >
//         <div className="flex justify-between items-center border-b pb-4 mb-6">
//           <h2 className="text-xl font-bold text-gray-800 dark:text-white">
//             Edit Product
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
//               <div>
//                 <label htmlFor="prodname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
//                 <label htmlFor="rent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Rent
//                 </label>
//                 <input
//                   type="number"
//                   id="rent"
//                   name="rent"
//                   value={formData.rent}
//                   onChange={handleChange}
//                   step="0.01"
//                   min="0"
//                   className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>  
//               <div>
//                 <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Product Type
//                 </label>
                
//                 {/* Selected Package Display */}
//                 {selectedPackage && (
//                   <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-md">
//                     <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
//                       {getDisplayLabel(selectedPackage)}
//                       <button
//                         type="button"
//                         onClick={handleRemovePackage}
//                         className="ml-2 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
//                       >
//                         ×
//                       </button>
//                     </span>
//                   </div>
//                 )}

//                 {/* Dropdown for Selecting Package */}
//                 <div className="relative">
//                   <button
//                     type="button"
//                     className="dropdown-toggle w-full justify-between h-11 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center transition-colors"
//                     onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
//                   >
//                     <span className="text-gray-700 dark:text-gray-300">
//                       {selectedPackage 
//                         ? `Selected: ${getDisplayLabel(selectedPackage)}` 
//                         : "Select Product Type"
//                       }
//                     </span>
//                     <ChevronDown 
//                       className={`h-4 w-4 opacity-50 transition-transform ${
//                         isPackageDropdownOpen ? 'rotate-180' : ''
//                       }`} 
//                     />
//                   </button>

//                   <Dropdown
//                     isOpen={isPackageDropdownOpen}
//                     onClose={() => setIsPackageDropdownOpen(false)}
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
//                               onClick={() => handlePackageSelect(option)}
//                               className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
//                                 formData.packageid === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
//                               onClick={() => handlePackageSelect(option)}
//                               className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
//                                 formData.packageid === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
//                               }`}
//                             >
//                               <span className="font-medium">Package Group: {option.label}</span>
//                             </DropdownItem>
//                           ))}
//                       </>
//                     )}
                    
//                     {packageOptions.length === 0 && (
//                       <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-sm">
//                         No options available
//                       </div>
//                     )}
//                   </Dropdown>
//                 </div>
//               </div>

//               <div className="md:col-span-2">
//                 <label htmlFor="desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
//                   <label htmlFor="invstatus" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
//                     Considered in invoice?
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
//               disabled={!isDirty}
//               className={`px-6 py-2 rounded-md text-white text-sm transition-colors ${
//                 isDirty 
//                   ? 'bg-blue-600 hover:bg-blue-700' 
//                   : 'bg-gray-400 cursor-not-allowed'
//               }`}
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditProductModal;

'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronDown } from "lucide-react";
import Swal from "sweetalert2";

interface PackageOption {
  value: number;
  label: string;
  type?: "basic" | "package"; // Add type field
}

interface EditProductModalProps {
  isOpen: boolean;
  prodid: string | number | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  isOpen, 
  prodid, 
  onClose, 
  onUpdated 
}) => {
  const [initialFormData, setInitialFormData] = useState({
    prodname: "",
    desc: "",
    rent: "",
    type: "0", // Changed from packageid to type
    duration: "",
    invstatus: false,
  });

  const [formData, setFormData] = useState({ ...initialFormData });
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);

  // Fetch product details on open and prodid change
  useEffect(() => {
    if (isOpen && prodid) {
      setLoading(true);
      console.log("fetching : ", prodid)
      Promise.all([
        fetch(`/api/products/${prodid}`).then(res => res.json()),
        fetch("/api/products/packageOptions").then(res => res.json())
      ])
        .then(([productData, packageOpts]) => {
          const productFormData = {
            prodname: productData.prodname || "",
            desc: productData.desc || "",
            rent: productData.rent?.toString() || "",
            type: productData.type?.toString() || "0", // Use type instead of packageid
            duration: productData.duration?.toString() || "",
            invstatus: productData.invstatus === 1,
          };
          
          setFormData(productFormData);
          setInitialFormData(productFormData);
          setPackageOptions(packageOpts);
        })
        .catch((error) => {
          console.error("Error fetching product data:", error);
          Swal.fire("Error", "Failed to load product data.", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, prodid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, type } = target;
    const value = type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePackageSelect = (packageOption: PackageOption) => {
    setFormData(prev => ({ 
      ...prev, 
      type: packageOption.value.toString() // Update type instead of packageid
    }));
    setIsPackageDropdownOpen(false);
  };

  const handleRemovePackage = () => {
    setFormData(prev => ({ 
      ...prev, 
      type: "0" // Reset to "Others" instead of null
    }));
  };

  // Enable update button only if form changed
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const payload = {
        prodname: formData.prodname,
        desc: formData.desc,
        rent: parseFloat(formData.rent) || 0,
        type: parseInt(formData.type, 10) || 0, // Use type directly
        duration: parseInt(formData.duration, 10) || 0,
        invstatus: formData.invstatus ? 1 : 0,
      };

      console.log('=== FRONTEND DEBUG ===');
      console.log('Form data:', formData);
      console.log('Payload being sent:', payload);
      console.log('=====================');

      const res = await fetch(`/api/products/${prodid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire("Success", "Product updated successfully", "success");
        onUpdated?.();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        Swal.fire("Error", errorData.error || "Failed to update product", "error");
      }
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire("Error", "Failed to update product", "error");
    }
  };

  if (!isOpen) return null;
  
  if (loading) {
    return (
      <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading product data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get display label with prefix
  const getDisplayLabel = (option: PackageOption) => {
    // Check if it's a basic type (values 0-3) or package group
    if (option.type === "basic" || option.value <= 3) {
      return option.label;
    }
    return `Package Group: ${option.label}`;
  };

  const selectedPackage = packageOptions.find(pkg => pkg.value === parseInt(formData.type)); // Use type

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-2xl p-6 overflow-visible rounded-lg relative" 
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Edit Product
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
              <div>
                <label htmlFor="prodname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label htmlFor="rent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rent
                </label>
                <input
                  type="number"
                  id="rent"
                  name="rent"
                  value={formData.rent}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>  
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type
                </label>
                
                {/* Selected Package Display */}
                {selectedPackage && (
                  <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-md">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                      {getDisplayLabel(selectedPackage)}
                      <button
                        type="button"
                        onClick={handleRemovePackage}
                        className="ml-2 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}

                {/* Dropdown for Selecting Package */}
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-toggle w-full justify-between h-11 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center transition-colors"
                    onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedPackage 
                        ? `Selected: ${getDisplayLabel(selectedPackage)}` 
                        : "Select Product Type"
                      }
                    </span>
                    <ChevronDown 
                      className={`h-4 w-4 opacity-50 transition-transform ${
                        isPackageDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  <Dropdown
                    isOpen={isPackageDropdownOpen}
                    onClose={() => setIsPackageDropdownOpen(false)}
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
                              onClick={() => handlePackageSelect(option)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
                                parseInt(formData.type) === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
                              onClick={() => handlePackageSelect(option)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
                                parseInt(formData.type) === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <span className="font-medium">Package Group: {option.label}</span>
                            </DropdownItem>
                          ))}
                      </>
                    )}
                    
                    {packageOptions.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-sm">
                        No options available
                      </div>
                    )}
                  </Dropdown>
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <label htmlFor="invstatus" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Considered in invoice?
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
              disabled={!isDirty}
              className={`px-6 py-2 rounded-md text-white text-sm transition-colors ${
                isDirty 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;