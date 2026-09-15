import React, { useRef, useState } from "react";

const paymentFileAccept = ".csv,.txt,.xls,.xlsx";

export default function UploadPaymentModal({
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

      const res = await fetch("/api/payments/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMsg(`Payment file uploaded successfully. ${result.message || ''}`);
        onSuccess?.();
        onClose();
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Create a separate handler function for button click
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
        <h2 className="text-xl font-bold mb-6 text-gray-800">Upload Payment File</h2>
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition h-56"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
          <span className="block text-4xl text-gray-400 mb-2">＋</span>
          <p className="text-gray-600 mb-4 text-center">
            Drag and drop your Payment file here
            <br />
            or click to upload from your computer
          </p>
          <p className="text-gray-500 text-xs text-center mb-4">
            Supported formats: CSV, TXT, XLS, XLSX
            <br />
            Expected columns: custid, paymentdate, amount, ptype, stype, comments
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={paymentFileAccept}
            className="hidden"
            onChange={onFileChange}
            disabled={uploading}
          />
          {/* Display selected file name, if any */}
          {selectedFile && (
            <div className="mb-2 text-gray-700 text-sm font-medium">
              📄 {selectedFile.name}
            </div>
          )}
          <button
            className="mt-4 px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            onClick={handleUploadClick}
            disabled={uploading || !selectedFile}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            ✅ {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}