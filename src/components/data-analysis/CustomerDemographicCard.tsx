"use client";
import { useState, useEffect } from "react";
// Removed unused imports
import CustomerFlowMap from "./CustomerFlowMap";

export default function CustomerDemographicCard() {
  const [flows, setFlows] = useState<{ source: string; target: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        // Hardcoded to December 2025 as requested
        const year = 2025;
        const month = '12';
        const res = await fetch(`/api/callFlows?year=${year}&month=${month}`);
        if (!res.ok) {
          setFlows([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setFlows(data.flows || []);
        setLoading(false);
      } catch {
        setFlows([]);
        setLoading(false);
      }
    };
    fetchFlows();
  }, []);

  // Removed unused dropdown functions

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customer Demographics
          </h3>
        </div>
      </div>
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
          </div>
        ) : (
          <CustomerFlowMap flows={flows} width={900} height={400} />
        )}
      </div>
    </div>
  );
}
