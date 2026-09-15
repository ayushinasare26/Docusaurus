"use client";
import { useState, useEffect } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import CustomerLifetimeValueChart from "./CustomerLifetimeValueChart";

interface CustomerCLV {
  custid: string;
  custname: string;
  totalRevenue: number;
  avgMonthlySpend: number;
}

interface CLVSummary {
  totalCustomers: number;
  totalRevenue: number;
  avgCLV: number;
  avgMonthlySpend: number;
}

export default function CustomerLifetimeValueCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerCLV[]>([]);
  const [summary, setSummary] = useState<CLVSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCLVData = async () => {
      try {
        const res = await fetch("/api/customerLifetimeValue");
        const data = await res.json();
        setCustomers(data.customers || []);
        setSummary(data.summary || null);
      } catch (error) {
        console.error("Error fetching CLV data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCLVData();
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customer Lifetime Value
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Top customers by total revenue and average monthly spend
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Export Data
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View All
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              Total Revenue
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              £{(summary.totalRevenue / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
              Avg CLV
            </div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              £{(summary.avgCLV / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
              Avg Monthly
            </div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
              £{summary.avgMonthlySpend.toLocaleString()}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
              Customers
            </div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {summary.totalCustomers}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Loading CLV data...</p>
          </div>
        ) : customers.length > 0 ? (
          <CustomerLifetimeValueChart data={customers} width={900} height={400} />
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">No customer data available</p>
          </div>
        )}
      </div>

      {/* Top Customers Table */}
      {!loading && customers.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Top 5 Customers by Revenue
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Customer
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Avg Monthly
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 5).map((customer, index) => (
                  <tr
                    key={customer.custid}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {customer.custname}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                      £{customer.totalRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                      £{customer.avgMonthlySpend.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
