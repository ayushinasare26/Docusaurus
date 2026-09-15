"use client";
import React, { useEffect, useState } from "react";

type Tenant = {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
};

const getBackendBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "http://localhost:8000"
  );
};
const backendBaseUrl = getBackendBaseUrl(); 

export default function XeroConnector() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/api/xero/tenants`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTenants(data.tenants || []);
            setActiveTenantId(data.activeTenantId || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch Xero tenants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenantId = e.target.value;
    setActiveTenantId(newTenantId);
    setSwitching(true);
    try {
      const res = await fetch(`${backendBaseUrl}/api/xero/tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: newTenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || "Active organisation switched successfully.");
    } catch (err: any) {
      alert("Failed to switch organisation: " + err.message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Dropdown if connected to multiple organisations */}
      {!loading && tenants.length > 0 && (
        <select
          value={activeTenantId}
          onChange={handleTenantChange}
          disabled={switching}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 shadow-sm disabled:opacity-50"
        >
          {tenants.map((t) => (
            <option key={t.tenantId} value={t.tenantId}>
              {t.tenantName}
            </option>
          ))}
        </select>
      )}

      {/* Connect Button */}
      <a
        href={`${backendBaseUrl}/api/xero/connect`}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        {tenants.length > 0 ? "Connect Another" : "Connect to Xero"}
      </a>
    </div>
  );
}
