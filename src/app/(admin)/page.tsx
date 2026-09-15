import type { Metadata } from "next";
import React from "react";
import MonthlyTarget from "@/components/data-analysis/MonthlyTarget";
import MonthlySalesD3Chart from "@/components/data-analysis/MonthlySalesD3Chart";
import StatisticsChart from "@/components/data-analysis/StatisticsChart";
import CustomerStatsCards from "@/components/data-analysis/CustomerStatsCards";
import CustomerDemographicCard from "@/components/data-analysis/CustomerDemographicCard";
import CustomerLifetimeValueCard from "@/components/data-analysis/CustomerLifetimeValueCard";
import XeroConnector from "@/components/xero/XeroConnector";

export const metadata: Metadata = {
  title:
    "Pinevox Billing System",
  description: "This is the billing system for Pinevox.",
};

export default function Ecommerce() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 relative">
      <div className="absolute top-0 right-0 z-10 -mt-16 sm:-mt-12">
        <a 
          href={`${backendBaseUrl}/api/xero/connect`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          Connect to Xero
        </a>
      </div>
      <div className="col-span-12">
        <CustomerStatsCards />
      </div>

      <div className="col-span-12 space-y-6 xl:col-span-7">
        <MonthlySalesD3Chart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12">
        <CustomerLifetimeValueCard />
      </div>

      <div className="col-span-12">
        <CustomerDemographicCard />
      </div>
    </div>
  );
}
