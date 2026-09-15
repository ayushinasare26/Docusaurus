"use client";
import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

export default function MonthlySalesD3Chart() {
  const [salesData, setSalesData] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [customers, setCustomers] = useState<{ custid: string; custname: string }[]>([]);
  const chartRef = useRef<SVGSVGElement>(null);

  // Fetch customers list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        setCustomers(data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const url = selectedCustomer === "all" 
          ? `/api/monthlySales?year=${selectedYear}`
          : `/api/monthlySales?year=${selectedYear}&custid=${selectedCustomer}`;
        
        const res = await fetch(url);
        const data = await res.json();
        console.log("Fetched sales data:", data); // Debug log
        setSalesData(data.monthlySales || Array(12).fill(0));
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };
    fetchSales();
  }, [selectedYear, selectedCustomer]);

  // Create D3 chart
  useEffect(() => {
    if (!chartRef.current || !salesData || salesData.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    // Chart dimensions and margins
    const margin = { top: 20, right: 50, bottom: 40, left: 50 }; // Increased left margin for Y-axis labels
    const width = 600 - margin.left - margin.right; // Reduced width to show only Jan-Sep
    const height = 400 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3
      .select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Month labels
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Prepare data for D3
    const data = months.map((month, index) => ({
      month,
      sales: salesData[index] || 0
    }));

    // X scale (months)
    const x = d3
      .scaleBand()
      .domain(months)
      .range([0, width])
      .padding(0.5); // Increased padding for narrower bars

    // Y scale (sales values)
    const maxSales = d3.max(data, (d) => d.sales) || 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxSales * 1.1]) // Add 10% padding to top
      .nice()
      .range([height, 0]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-family", "Outfit, sans-serif")
      .style("font-size", "12px")
      .style("fill", "#64748b");

    // Add Y axis with better formatting
    svg
      .append("g")
      .call(
        d3.axisLeft(y)
          .ticks(8) // More tick marks
          .tickFormat((d) => d3.format(",.0f")(d as number)) // Removed £ symbol
      )
      .selectAll("text")
      .style("font-family", "Outfit, sans-serif")
      .style("font-size", "12px")
      .style("fill", "#64748b")
      .style("font-weight", "500");

    // Style Y-axis line and ticks
    svg.select("g")
      .selectAll("line")
      .style("stroke", "#e2e8f0");

    svg.select("g")
      .select(".domain")
      .style("stroke", "#e2e8f0");

    // Add grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .ticks(8)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .style("stroke", "#e2e8f0")
      .style("stroke-opacity", 0.3)
      .style("stroke-dasharray", "3,3");

    // Remove grid domain line
    svg.select(".grid").select(".domain").remove();

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#1e293b")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-family", "Outfit, sans-serif")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
      .style("z-index", "1000");

    // Add bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.month) || 0)
      .attr("y", height) // Start from bottom for animation
      .attr("width", x.bandwidth())
      .attr("height", 0) // Start with 0 height for animation
      .attr("fill", "#465fff")
      .attr("rx", 5) // Rounded corners
      .style("cursor", "pointer")
      // Hover effects
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "#3b4ecc");

        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.month} ${selectedYear}</strong><br/>Sales: £${d3.format(",.2f")(d.sales)}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "#465fff");

        tooltip.style("opacity", 0);
      })
      // Animation on load
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("y", (d) => (d.sales === 0 ? height : y(d.sales)))
      .attr("height", (d) => (d.sales === 0 ? 0 : height - y(d.sales)));

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [salesData, selectedYear]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Sales Chart
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              {selectedCustomer === "all" 
                ? "Total sales across all customers" 
                : `Sales for ${customers.find(c => c.custid === selectedCustomer)?.custname || "selected customer"}`}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Customer Dropdown */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
              >
                <option value="all">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.custid} value={customer.custid}>
                    {customer.custname}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
        <div className="flex justify-center overflow-x-auto">
          <svg ref={chartRef}></svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="h-3 w-3 rounded-sm bg-[#465fff]"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Sales (£)</span>
      </div>
    </div>
  );
}