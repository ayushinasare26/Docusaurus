import React from "react";
import GenericTablePage from "@/components/tables/GenericTablePage";

export type LogsType = {
  id: number;
  email: string;
  operation: string;
  table_name: string;
  description: string;
  created_at: string; // timestamp string
};

type LogsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  logs: LogsType[];
};

export default function LogsModal({ isOpen, onClose, logs }: LogsModalProps) {
  if (!isOpen) return null;

  // Optional: transform keys if needed by your table component
  const transformedLogs = logs.map(log => ({
    id: log.id,
    email: log.email,
    operation: log.operation,
    tableName: log.table_name,
    description: log.description,
    createdAt: log.created_at,
  }));

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Email", accessor: "email" },
    { header: "Operation", accessor: "operation" },
    { header: "Table", accessor: "tableName" },
    { header: "Description", accessor: "description" },
    { header: "Created At", accessor: "createdAt" },
  ];

  console.log("Logs data:", transformedLogs);

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl  relative shadow-lg border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 font-bold text-2xl"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4">Logs</h2>
        <GenericTablePage
          title=""
          data={transformedLogs}
          columns={columns}
          loading={false}
        />
      </div>
    </div>
  );
}
