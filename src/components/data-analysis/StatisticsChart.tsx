"use client";
import React, { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import dynamic from "next/dynamic";
import { FaChevronDown } from "react-icons/fa";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function StatisticsChart() {
  const [callVolume, setCallVolume] = useState<number[]>([]);
  const [monthlySales, setMonthlySales] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [viewMode, setViewMode] = useState<"callVolume" | "revenue">("callVolume");
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch call volume data
        const callVolumeResponse = await fetch(`/api/callVolume?year=${selectedYear}`);       
        const callVolumeData = await callVolumeResponse.json();
        setCallVolume(callVolumeData);

        // Fetch monthly sales data
        const salesResponse = await fetch(`/api/monthlySales?year=${selectedYear}`);
        const salesData = await salesResponse.json();
        setMonthlySales(salesData.monthlySales || Array(12).fill(0));
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setCallVolume([]);
        setMonthlySales([]);
      }
    };

    fetchData();
  }, [selectedYear]);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: [viewMode === "callVolume" ? "#465FFF" : "#10B981"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      x: {
        format: "dd MMM yyyy",
      },
      y: {
        formatter: function (val) {
          if (viewMode === "callVolume") {
            return val.toFixed(0) + " mins";
          } else {
            return "£" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        },
      },
    },
    xaxis: {
      type: "category",
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: [viewMode === "callVolume" ? "#465FFF" : "#10B981"],
        },
        formatter: function (val) {
          if (viewMode === "callVolume") {
            return val.toFixed(0);
          } else {
            return "£" + (val / 1000).toFixed(0) + "k";
          }
        },
      },
      title: {
        text: viewMode === "callVolume" ? "Call Volume (Minutes)" : "Monthly Revenue (£)",
        style: {
          fontSize: "12px",
          color: viewMode === "callVolume" ? "#465FFF" : "#10B981",
          fontWeight: 600,
        },
      },
    },
  };

  const series = [
    {
      name: viewMode === "callVolume" ? "Call Volume (Minutes)" : "Monthly Revenue (£)",
      data: viewMode === "callVolume" ? callVolume : monthlySales,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header section with title and dropdowns */}
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {viewMode === "callVolume" ? "Call Volume Overview" : "Monthly Revenue Overview"}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {viewMode === "callVolume" 
              ? "Total call duration in minutes per month."
              : "Total monthly revenue in pounds sterling."}
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
          {/* View Mode Dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={viewMode}
              onChange={e => setViewMode(e.target.value as "callVolume" | "revenue")}
            >
              <option value="callVolume">Call Volume</option>
              <option value="revenue">Monthly Revenue</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FaChevronDown className="text-gray-400" />
            </span>
          </div>
          {/* Year Dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FaChevronDown className="text-gray-400" />
            </span>
          </div>
        </div>
      </div>

      {/* Chart section */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={310}
          />
        </div>
      </div>
    </div>
  );
}
