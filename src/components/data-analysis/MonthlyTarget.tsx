"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
// Removed unused imports

// Dynamically import the chart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const months = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function MonthlyTarget() {
  const [revenue, setRevenue] = useState<number>(0);
  const [series, setSeries] = useState<number[]>([0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch(`/api/monthlyRevenue?year=${selectedYear}&month=${selectedMonth}`);
        const data = await res.json();
        const totalRevenue = data.totalRevenue || 0;

        setRevenue(totalRevenue);

        const target = 50000;
        const progress = (totalRevenue / target) * 100;
        setSeries([parseFloat(progress.toFixed(2))])
      } catch (error) {
        console.error("Failed to fetch revenue:", error);
      }
    };

    fetchRevenue();
  }, [selectedYear, selectedMonth]);

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };


  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Revenue</h3>
            <p className="mt-1 font-normal text-gray-500 text-theme-sm dark:text-gray-400">
              £{revenue.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Dropdown */}
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm px-3 py-1"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm px-3 py-1"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]">
            <ReactApexChart options={options} series={series} type="radialBar" height={330} />
          </div>
          {/* <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            +10%
          </span> */}
        </div>

        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          You earn £{revenue.toLocaleString()} in{" "}
          {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} !
           {/* it's higher than last
          month. Keep up your good work! */}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        {[
          { label: "Target", amount: "£50000", arrow: "down", color: "#D92D20" },
          { label: "Revenue", amount: `£${revenue.toLocaleString()}`, arrow: "up", color: "#039855" },
          { label: "Progress", amount: `${series[0]}%`, arrow: "up", color: "#039855" },
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
              {item.label}
            </p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {item.amount}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d={
                    item.arrow === "up"
                      ? "M7.60141 2.33683...Z"
                      : "M7.26816 13.6632...Z"
                  }
                  fill={item.color}
                />
              </svg>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
