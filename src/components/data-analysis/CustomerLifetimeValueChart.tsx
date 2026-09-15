"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CustomerCLV {
  custid: string;
  custname: string;
  totalRevenue: number;
  avgMonthlySpend: number;
}

interface CLVChartProps {
  data: CustomerCLV[];
  width?: number;
  height?: number;
}

const CustomerLifetimeValueChart: React.FC<CLVChartProps> = ({
  data,
  width = 800,
  height = 400,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;
    // All chart logic must be inside this function body!

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Take top 15 customers by revenue
    const topCustomers = data.slice(0, 15);

    // Set up dimensions and margins
    const margin = { top: 20, right: 30, bottom: 100, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(topCustomers.map((d) => d.custname))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(topCustomers, (d) => d.totalRevenue) || 0])
      .nice()
      .range([chartHeight, 0]);

    // Color scale based on revenue
    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(topCustomers, (d) => d.totalRevenue) || 0])
      .interpolator(d3.interpolateBlues);

    // Add gradient definition
    const gradient = svg
      .append("defs")
      .selectAll("linearGradient")
      .data(topCustomers)
      .enter()
      .append("linearGradient")
      .attr("id", (d, i) => `gradient-${i}`)
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", (d) => colorScale(d.totalRevenue * 0.3));

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", (d) => colorScale(d.totalRevenue));

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#6b7280")
      .each(function (d: unknown) {
        if (typeof d === "string") {
          const text = d3.select(this);
          const words = d.split(" ");
          if (words.length > 2) {
            text.text(words.slice(0, 2).join(" ") + "...");
          }
        }
      });
    // Add Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickFormat((d) => `£${(d as number / 1000).toFixed(0)}k`)
      )
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280");

    // Add Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#374151")
      .style("font-weight", "600")
      .text("Total Revenue (£)");

    // Add bars with animation
    const bars = g
      .selectAll(".bar")
      .data(topCustomers)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.custname) || 0)
      .attr("y", chartHeight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("rx", 4)
      .style("cursor", "pointer");

    // Animate bars
    bars
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("y", (d) => yScale(d.totalRevenue))
      .attr("height", (d) => chartHeight - yScale(d.totalRevenue));

    // Add value labels on top of bars
    g.selectAll(".label")
      .data(topCustomers)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => (xScale(d.custname) || 0) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.totalRevenue) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#1f2937")
      .style("font-weight", "600")
      .style("opacity", 0)
      .text((d) => `£${(d.totalRevenue / 1000).toFixed(1)}k`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50 + 400)
      .style("opacity", 1);

    // Add interactivity
    bars
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8)
          .attr("stroke", "#2563eb")
          .attr("stroke-width", 2);

        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`)
            .html(
              `
              <div class="font-semibold text-gray-900 dark:text-white mb-2">${d.custname}</div>
              <div class="space-y-1">
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                  <span class="font-semibold text-blue-600">£${d.totalRevenue.toLocaleString()}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600 dark:text-gray-400">Avg Monthly:</span>
                  <span class="font-semibold text-green-600">£${d.avgMonthlySpend.toLocaleString()}</span>
                </div>
              </div>
            `
            );
        }
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke", "none");

        if (tooltipRef.current) {
          d3.select(tooltipRef.current).style("opacity", 0);
        }
      });

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-opacity", 0.7)
      .style("stroke-dasharray", "3,3");
  }, [data, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto" }} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-sm"
        style={{
          opacity: 0,
          transition: "opacity 0.2s",
          minWidth: "250px",
        }}
      />
    </div>
  );
};

export default CustomerLifetimeValueChart;
