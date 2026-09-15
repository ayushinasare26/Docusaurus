// import React, { useEffect } from "react";

// type AssignDidModalProps = {
//   isOpen: boolean;
//   selectedDids: number[];
//   onClose: () => void;
//   onSuccess: () => void;
// };

// export default function AssignDidModal({
//   isOpen,
//   selectedDids,
//   onClose,
//   onSuccess,
// }: AssignDidModalProps) {
//   useEffect(() => {
//     if (isOpen) {
//       console.log("Selected DIDs passed to modal:", selectedDids);
//     }
//   }, [isOpen, selectedDids]);

//   if (!isOpen) return null;

//   return null;
// }



// version 2 

// import React, { useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// type DidAssignmentModalProps = {
//   isOpen: boolean;
//   selectedDids: number[];
//   onClose: () => void;
//   onAssign: (customerId: number, assignmentDate: string, didNumbers: number[]) => Promise<void>;
//   onSuccess?: () => void; 

// };

// export default function DidAssignmentModal({
//   isOpen,
//   selectedDids,
//   onClose,
//   onAssign,
// }: DidAssignmentModalProps) {
//   const [customerId, setCustomerId] = useState("");
//   const [assignmentDate, setAssignmentDate] = useState<Date | null>(new Date());
//   const [loading, setLoading] = useState(false);

//   const handleAssign = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const custIdNum = Number(customerId);
//     if (!custIdNum || custIdNum <= 0) {
//       alert("Please enter a valid customer ID");
//       return;
//     }
//     if (selectedDids.length === 0) {
//       alert("No DIDs selected");
//       return;
//     }
//     if (!assignmentDate) {
//       alert("Please select an assignment date");
//       return;
//     }

//     setLoading(true);
//     try {
//       await onAssign(custIdNum, assignmentDate.toISOString().slice(0, 10), selectedDids);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//       <div
//         className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-3xl p-6 overflow-y-auto rounded-lg"
//         style={{ maxHeight: "90vh" }}
//       >
//         <div className="flex justify-between items-center border-b pb-4 mb-6">
//           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Assign DIDs to Customer</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
//             &times;
//           </button>
//         </div>

//         <form onSubmit={handleAssign} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Customer ID
//               </label>
//               <input
//                 type="number"
//                 name="customerId"
//                 id="customerId"
//                 value={customerId}
//                 onChange={(e) => setCustomerId(e.target.value)}
//                 required
//                 min={1}
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//                 placeholder="Enter Customer ID"
//               />
//             </div>

//             <div>
//               <label htmlFor="assignmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Assignment Date
//               </label>
//               <DatePicker
//                 selected={assignmentDate}
//                 onChange={(date: Date | null) => setAssignmentDate(date)}
//                 dateFormat="dd/MM/yyyy"
//                 className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
//                 placeholderText="Select assignment date"
//                 required
//                 id="assignmentDate"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Selected DID Numbers</label>
//             <div className="border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto bg-slate-50">
//               {selectedDids.length === 0 ? (
//                 <p className="text-gray-500 italic">No DIDs selected</p>
//               ) : (
//                 <ul className="list-disc list-inside max-h-48">
//                   {selectedDids.map((did) => (
//                     <li key={did} className="py-0.5">
//                       {did}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>

//           <div className="flex justify-end space-x-4 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={loading}
//               className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={loading}
//               className={`px-6 py-2 rounded-md text-white text-sm ${
//                 loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-500"
//               }`}
//             >
//               {loading ? "Assigning..." : "Assign"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


//with the temporary feature 

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Did = {
  didno: number;
  isTemporary?: number; // Change this type/name accordingly if needed (e.g., isdeleted)
};

type DidAssignmentModalProps = {
  isOpen: boolean;
  selectedDids: Did[];
  onClose: () => void;
  onAssign: (
    customerId: number,
    assignmentDate: string,
    didNumbers: number[],
    temporaryDate?: string | null
  ) => Promise<void>;
  onSuccess?: () => void;
};

export default function DidAssignmentModal({
  isOpen,
  selectedDids,
  onClose,
  onAssign,
  onSuccess,
}: DidAssignmentModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState<Date | null>(new Date());
  const [temporaryDate, setTemporaryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if any selected DID has isTemporary === 1
  const isAnyTemporary = selectedDids.some((did) => did.isTemporary === 1);

  useEffect(() => {
    // Reset temporaryDate if modal closes or opens fresh
    if (!isOpen) {
      setTemporaryDate(null);
    }
  }, [isOpen]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const custIdNum = Number(customerId);
    if (!custIdNum || custIdNum <= 0) {
      alert("Please enter a valid customer ID");
      return;
    }
    if (selectedDids.length === 0) {
      alert("No DIDs selected");
      return;
    }
    if (!assignmentDate) {
      alert("Please select an assignment date");
      return;
    }
    if (isAnyTemporary && !temporaryDate) {
      alert("Please select a temporary date for temporary DIDs");
      return;
    }

      // Log data before sending it
  console.log({
    customerId: custIdNum,
    assignmentDate: assignmentDate.toISOString().slice(0, 10),
    didNumbers: selectedDids.map((did) => did.didno),
    temporaryDate: temporaryDate ? temporaryDate.toISOString().slice(0, 10) : null,
  });


    setLoading(true);
    try {
      const didNumbers = selectedDids.map((did) => did.didno);
      await onAssign(
        custIdNum,
        assignmentDate.toISOString().slice(0, 10),
        didNumbers,
        temporaryDate ? temporaryDate.toISOString().slice(0, 10) : null
      );
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-3xl p-6 overflow-y-auto rounded-lg"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Assign DIDs to Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleAssign} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="customerId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Customer ID
              </label>
              <input
                type="number"
                name="customerId"
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                min={1}
                className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                placeholder="Enter Customer ID"
              />
            </div>

            <div>
              <label
                htmlFor="assignmentDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Assignment Date
              </label>
              <DatePicker
                selected={assignmentDate}
                onChange={(date: Date | null) => setAssignmentDate(date)}
                dateFormat="dd/MM/yyyy"
                className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                placeholderText="Select assignment date"
                required
                id="assignmentDate"
              />
            </div>
          </div>

          {isAnyTemporary && (
            <div>
              <label
                htmlFor="temporaryDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Expiry Date
              </label>
              <DatePicker
                selected={temporaryDate}
                onChange={(date: Date | null) => setTemporaryDate(date)}
                dateFormat="dd/MM/yyyy"
                className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                placeholderText="Select expiry date"
                required
                id="temporaryDate"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Selected DID Numbers
            </label>
            <div className="border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto bg-slate-50">
              {selectedDids.length === 0 ? (
                <p className="text-gray-500 italic">No DIDs selected</p>
              ) : (
                <ul className="list-disc list-inside max-h-48">
                  {selectedDids.map((did) => (
                    <li key={did.didno} className="py-0.5">
                      {did.didno}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-md text-white text-sm ${
                loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loading ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
