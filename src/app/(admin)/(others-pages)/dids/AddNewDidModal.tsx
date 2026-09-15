// import React, { useRef, useState } from "react";

// const didFileAccept = ".csv,.txt,.xls,.xlsx"; // Adjust if needed

// export default function UploadDidModal({
//   isOpen,
//   onClose,
//   onSuccess,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess?: () => void;
// }) {
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   if (!isOpen) return null;

//   // Set selected file and clear errors/messages
//   const handleFileSelect = (file: File) => {
//     setSelectedFile(file);
//     setError("");
//     setSuccessMsg("");
//   };

//   // Actual upload triggered by button click
//   const doUpload = async () => {
//     if (!selectedFile) {
//       setError("Please select a file first.");
//       return;
//     }
//     setUploading(true);
//     setError("");
//     setSuccessMsg("");
//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);

//       const res = await fetch("/api/dids/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const result = await res.json();

//       if (result.error) {
//         setError(result.error);
//       } else {
//         setSuccessMsg("DID file uploaded successfully.");
//         onSuccess && onSuccess();
//         onClose();
//         setSelectedFile(null);
//       }
//     } catch (_e) {
//       setError("Upload failed. Please try again.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const onDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       handleFileSelect(e.dataTransfer.files[0]);
//     }
//   };

//   const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       handleFileSelect(e.target.files[0]);
//     }
//   };

//   return (
//     <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
//       <div className="bg-white p-8 rounded-xl w-3xl relative shadow-lg border border-gray-200">
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 font-bold text-2xl"
//         >
//           ×
//         </button>
//         <h2 className="text-xl font-bold mb-6 text-gray-800">Upload DID File</h2>
//         <div
//           className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition h-56"
//           onDrop={onDrop}
//           onDragOver={(e) => e.preventDefault()}
//           onClick={() => inputRef.current?.click()}
//           style={{ cursor: "pointer" }}
//         >
//           <span className="block text-4xl text-gray-400 mb-2">＋</span>
//           <p className="text-gray-600 mb-4 text-center">
//             Drag and drop your DID file here
//             <br />
//             or click to upload from your computer
//           </p>
//           <input
//             ref={inputRef}
//             type="file"
//             accept={didFileAccept}
//             className="hidden"
//             onChange={onFileChange}
//             disabled={uploading}
//           />
//           {/* Display selected file name, if any */}
//           {selectedFile && (
//             <div className="mb-2 text-gray-700 text-sm">{selectedFile.name}</div>
//           )}
//           <button
//             className="mt-4 px-6 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
//               onClick={(e) => {
//                                 e.stopPropagation(); // Prevent click bubbling
//                                 doUpload();
//                               }}
//             disabled={uploading || !selectedFile}
//           >
//             {uploading ? "Uploading..." : "Upload File"}
//           </button>
//         </div>
//         {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
//         {successMsg && (
//           <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useRef, useState } from "react";

const didFileAccept = ".csv,.txt,.xls,.xlsx"; // Adjust if needed

export default function UploadDidModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Set selected file and clear errors/messages
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError("");
    setSuccessMsg("");
  };

  // Actual upload triggered by button click
  const doUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/dids/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMsg("DID file uploaded successfully.");
        onSuccess?.(); // Fixed: Use optional chaining instead of && operator
        onClose();
        setSelectedFile(null);
      }
    } catch (error) { // Fixed: Use 'error' instead of '_e' and handle it properly
      console.error("Upload error:", error);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Fixed: Create a separate handler function for button click
  const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent click bubbling
    doUpload();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-3xl relative shadow-lg border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 font-bold text-2xl"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-6 text-gray-800">Upload DID File</h2>
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition h-56"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
          <span className="block text-4xl text-gray-400 mb-2">＋</span>
          <p className="text-gray-600 mb-4 text-center">
            Drag and drop your DID file here
            <br />
            or click to upload from your computer
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={didFileAccept}
            className="hidden"
            onChange={onFileChange}
            disabled={uploading}
          />
          {/* Display selected file name, if any */}
          {selectedFile && (
            <div className="mb-2 text-gray-700 text-sm">{selectedFile.name}</div>
          )}
          <button
            className="mt-4 px-6 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleUploadClick} // Fixed: Use the separate handler function
            disabled={uploading || !selectedFile}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
        {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {successMsg && (
          <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>
        )}
      </div>
    </div>
  );
}
