// "use client";

// import React, { useEffect, useRef } from "react";
// // Helper to map city/label to country name
// function mapToCountry(label: string): string | null {
//   if (!label) return null;
//   const l = label.trim().toLowerCase();
//   if (l === "" || l === ".") return null;
//   // UK cities/regions
//   const ukCities = [
//     "london", "middlesex", "west sussex", "leicester", "harrow", "essex", "milton keynes", "aldershot", "poyle", "hounslow", "birmingham", "eastleigh", "hayes", "acton", "stanmore", "pinner", "oldham", "ashford", "slough", "worcestershire", "uxbridge", "wembley", "st. albans", "borehamwood", "southhampton", "heston", "railshead road, twic", "kings langley", "worcester park", "felixstowe, soffolk", "carrickfergus", "aylesbury", "monmouthshire", "frimley", "kings langley", "worcester park", "felixstowe, soffolk", "carrickfergus", "aylesbury", "monmouthshire", "frimley", "cambs"];
//   if (ukCities.some(city => l.startsWith(city))) return "United Kingdom";
//   // UK mobile/landline types
//   if (l.startsWith("uk ")) return "United Kingdom";
//   // International
//   if (l.includes("india")) return "India";
//   if (l.includes("france")) return "France";
//   if (l.includes("usa")) return "United States";
//   if (l.includes("germany")) return "Germany";
//   if (l.includes("maldives")) return "Maldives";
//   if (l.includes("poland")) return "Poland";
//   if (l.includes("ireland")) return "Ireland";
//   if (l.includes("japan")) return "Japan";
//   if (l.includes("denmark")) return "Denmark";
//   if (l.includes("canada")) return "Canada";
//   if (l.includes("el salvador")) return "El Salvador";
//   if (l.includes("uzbekistan")) return "Uzbekistan";
//   if (l.includes("china")) return "China";
//   if (l.includes("thailand")) return "Thailand";
//   if (l.includes("brazil")) return "Brazil";
//   if (l.includes("netherlands")) return "Netherlands";
//   if (l.includes("italy")) return "Italy";
//   if (l.includes("russia")) return "Russia";
//   if (l.includes("sweden")) return "Sweden";
//   if (l.includes("switzerland")) return "Switzerland";
//   if (l.includes("greece")) return "Greece";
//   if (l.includes("norway")) return "Norway";
//   if (l.includes("portugal")) return "Portugal";
//   if (l.includes("australia")) return "Australia";
//   if (l.includes("united arab emirates")) return "United Arab Emirates";
//   if (l.includes("israel")) return "Israel";
//   if (l.includes("hungary")) return "Hungary";
//   if (l.includes("mexico")) return "Mexico";
//   if (l.includes("finland")) return "Finland";
//   if (l.includes("turkey")) return "Turkey";
//   // Add more as needed
//   return null;
// }

// import * as d3 from "d3";
// import { Feature, Geometry } from "geojson";

// type Flow = {
//   source: string;
//   target: string;
//   calls?: number;
//   minutes?: number;
// };

// type CountryFeature = Feature<Geometry, { name?: string; NAME?: string }>;

// type Props = {
//   flows: Flow[];
//   width?: number;
//   height?: number;
// };

// export default function CustomerFlowMap({ flows, width = 900, height = 400 }: Props) {
//   // Preprocess flows: map source/target to country names
//   const processedFlows = flows
//     .map(f => {
//       const sourceCountry = mapToCountry(f.source);
//       const targetCountry = mapToCountry(f.target);
//       if (!sourceCountry || !targetCountry) return null;
//       return { ...f, source: sourceCountry, target: targetCountry };
//     })
//     .filter(Boolean) as Flow[];
//   const ref = useRef<SVGSVGElement | null>(null);

//   useEffect(() => {
//     if (!ref.current) return;
//     const svg = d3.select(ref.current);
//     svg.selectAll("*").remove();

//     if (!processedFlows || processedFlows.length === 0) {
//       svg
//         .append("text")
//         .attr("x", width / 2)
//         .attr("y", height / 2)
//         .attr("text-anchor", "middle")
//         .attr("fill", "#6b7280")
//         .text("No flow data available");
//       return;
//     }

//     // Adjust projection to show more of the upper hemisphere (move map down)
//     const projection = d3
//       .geoMercator()
//       .scale((width / 2 / Math.PI) * 1.2)
//       .translate([width / 2, height / 1.3]);
//     const path = d3.geoPath().projection(projection);

//     const g = svg.append("g");


//     (async () => {
//       let topo;
//       try {
//         const topoResp = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
//         const contentType = topoResp.headers.get("content-type") || "";
//         if (!topoResp.ok) {
//           const txt = await topoResp.text();
//           console.error("Failed to load topojson from unpkg:", topoResp.status, topoResp.statusText, txt.slice(0, 500));
//           svg
//             .append("text")
//             .attr("x", width / 2)
//             .attr("y", height / 2)
//             .attr("text-anchor", "middle")
//             .attr("fill", "#ff0000")
//             .text("Failed to load map data (network error)");
//           return;
//         }

//         // If server returned HTML (error page), log and bail out instead of calling .json()
//         if (!contentType.includes("application/json") && !contentType.includes("application/geo+json") && !contentType.includes("application/octet-stream")) {
//           const txt = await topoResp.text();
//           console.error("Topojson response was not JSON. Response preview:", txt.slice(0, 500));
//           svg
//             .append("text")
//             .attr("x", width / 2)
//             .attr("y", height / 2)
//             .attr("text-anchor", "middle")
//             .attr("fill", "#ff0000")
//             .text("Failed to load map data (invalid response)");
//           return;
//         }

//         topo = await topoResp.json();
//       } catch (err) {
//         console.error("Error fetching topojson:", err);
//         svg
//           .append("text")
//           .attr("x", width / 2)
//           .attr("y", height / 2)
//           .attr("text-anchor", "middle")
//           .attr("fill", "#ff0000")
//           .text("Failed to load map data (exception)");
//         return;
//       }

//       // use topojson if available globally
//       const win = window as unknown as { topojson?: any };
//       const countries: CountryFeature[] = win.topojson
//         ? win.topojson.feature(topo, topo.objects.countries).features
//         : (topo.objects && topo.objects.countries && win.topojson)
//         ? win.topojson.feature(topo, topo.objects.countries).features
//         : [];

//       g.append("g")
//         .selectAll("path")
//         .data(countries)
//         .join("path")
//         .attr("d", (d) => path(d) || null)
//         .attr("fill", "#f8fafc")
//         .attr("stroke", "#e6e9ee")
//         .attr("stroke-width", 0.4);

//       // build centroid map
//       const centroidMap: Record<string, [number, number]> = {};
//       countries.forEach((f: CountryFeature) => {
//         const name = f.properties && (f.properties.name || f.properties.NAME);
//         if (name) centroidMap[name] = d3.geoCentroid(f as CountryFeature);
//       });

//       const validFlows = processedFlows
//         .map((d) => {
//           const s = centroidMap[d.source];
//           const t = centroidMap[d.target];
//           if (!s || !t) return null;
//           return { ...d, sourceCoord: s, targetCoord: t };
//         })
//         .filter((v): v is Flow & { sourceCoord: [number, number]; targetCoord: [number, number] } => v !== null);

//       if (!validFlows || validFlows.length === 0) {
//         svg
//           .append("text")
//           .attr("x", width / 2)
//           .attr("y", height / 2)
//           .attr("text-anchor", "middle")
//           .attr("fill", "#6b7280")
//           .text("No geocoded flow data available");
//         return;
//       }

//       const arcsG = g.append("g").attr("class", "arcs");
//       const pointsG = g.append("g").attr("class", "points");

//       validFlows.forEach((f) => {
//         if (!f) return;
//         const interp = d3.geoInterpolate(f.sourceCoord, f.targetCoord);
//         const steps = d3.range(0, 1.01, 0.02);
//         const coords = steps.map((t: number) => interp(t));
//         const projected = coords.map((c: [number, number]) => projection(c) as [number, number]);

//         const lineGen = d3
//           .line<[number, number]>()
//           .x((d: [number, number]) => d[0])
//           .y((d: [number, number]) => d[1])
//           .curve(d3.curveBasis);

//         arcsG
//           .append("path")
//           .attr("d", lineGen(projected) as string)
//           .attr("fill", "none")
//           .attr("stroke", "#222") // black for visibility
//           .attr("stroke-width", 2)
//           .attr("stroke-linecap", "round")
//           .attr("opacity", 0.85);
//       });

//       const nodes = Array.from(new Set(validFlows.flatMap((f) => f ? [f.source, f.target] : [])));
//       const nodeData = nodes
//         .map((name) => ({ name, coord: centroidMap[name] }))
//         .map((d) => {
//           const proj = d.coord ? projection(d.coord) : null;
//           return proj ? { ...d, proj } : null;
//         })
//         .filter(Boolean) as Array<{ name: string; coord: [number, number]; proj: [number, number] }>;

//       pointsG
//         .selectAll("circle")
//         .data(nodeData)
//         .join("circle")
//         .attr("cx", (d) => d.proj[0])
//         .attr("cy", (d) => d.proj[1])
//         .attr("r", 3.5)
//         .attr("fill", "#1f2937")
//         .attr("stroke", "#fff")
//         .attr("stroke-width", 0.8);

      
//     })();

//     return () => {
//       const svgNode = ref.current;
//       if (svgNode) {
//         // Copy ref to local variable at effect start
//         d3.select(svgNode).selectAll("*").remove();
//       }
//     };
//   }, [flows, width, height, processedFlows]);

//   return (
//     <div style={{ position: "relative", width: "100%", maxWidth: width }}>
//       <svg ref={ref} width={width} height={height} />
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Feature, Geometry } from "geojson";
import { Topology } from "topojson-specification";

/* -------------------- Helpers -------------------- */

function mapToCountry(label: string): string | null {
  if (!label) return null;
  const l = label.trim().toLowerCase();
  if (l === "" || l === ".") return null;

  const ukCities = [
    "london", "middlesex", "west sussex", "leicester", "harrow",
    "essex", "milton keynes", "aldershot", "poyle", "hounslow",
    "birmingham", "eastleigh", "hayes", "acton", "stanmore",
    "pinner", "oldham", "ashford", "slough", "worcestershire",
    "uxbridge", "wembley", "st. albans", "borehamwood",
    "southhampton", "heston", "kings langley",
    "worcester park", "carrickfergus", "aylesbury",
    "monmouthshire", "frimley", "cambs"
  ];

  if (ukCities.some(city => l.startsWith(city)) || l.startsWith("uk ")) {
    return "United Kingdom";
  }

  if (l.includes("india")) return "India";
  if (l.includes("france")) return "France";
  if (l.includes("usa")) return "United States";
  if (l.includes("germany")) return "Germany";
  if (l.includes("maldives")) return "Maldives";
  if (l.includes("poland")) return "Poland";
  if (l.includes("ireland")) return "Ireland";
  if (l.includes("japan")) return "Japan";
  if (l.includes("denmark")) return "Denmark";
  if (l.includes("canada")) return "Canada";
  if (l.includes("el salvador")) return "El Salvador";
  if (l.includes("uzbekistan")) return "Uzbekistan";
  if (l.includes("china")) return "China";
  if (l.includes("thailand")) return "Thailand";
  if (l.includes("brazil")) return "Brazil";
  if (l.includes("netherlands")) return "Netherlands";
  if (l.includes("italy")) return "Italy";
  if (l.includes("russia")) return "Russia";
  if (l.includes("sweden")) return "Sweden";
  if (l.includes("switzerland")) return "Switzerland";
  if (l.includes("greece")) return "Greece";
  if (l.includes("norway")) return "Norway";
  if (l.includes("portugal")) return "Portugal";
  if (l.includes("australia")) return "Australia";
  if (l.includes("united arab emirates")) return "United Arab Emirates";
  if (l.includes("israel")) return "Israel";
  if (l.includes("hungary")) return "Hungary";
  if (l.includes("mexico")) return "Mexico";
  if (l.includes("finland")) return "Finland";
  if (l.includes("turkey")) return "Turkey";

  return null;
}

/* -------------------- Types -------------------- */

type Flow = {
  source: string;
  target: string;
  calls?: number;
  minutes?: number;
};

type CountryFeature = Feature<
  Geometry,
  { name?: string; NAME?: string }
>;

type Props = {
  flows: Flow[];
  width?: number;
  height?: number;
};

/* -------------------- Component -------------------- */

export default function CustomerFlowMap({
  flows,
  width = 900,
  height = 400,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* Preprocess flows */
  const processedFlows = useMemo(() => {
    return flows
      .map(f => {
        const source = mapToCountry(f.source);
        const target = mapToCountry(f.target);
        if (!source || !target) return null;
        return { ...f, source, target };
      })
      .filter(Boolean) as Flow[];
  }, [flows]);

  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode) return;

    const svg = d3.select(svgNode);
    svg.selectAll("*").remove();

    if (processedFlows.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .text("No flow data available");
      return;
    }

    const projection = d3
      .geoMercator()
      .scale((width / 2 / Math.PI) * 1.2)
      .translate([width / 2, height / 1.3]);

    const path = d3.geoPath(projection);
    const g = svg.append("g");

    (async () => {
      let topology: Topology;

      try {
        const resp = await fetch(
          "https://unpkg.com/world-atlas@2/countries-110m.json"
        );

        if (!resp.ok) throw new Error("Failed to fetch map");

        topology = (await resp.json()) as Topology;
      } catch (err) {
        console.error(err);
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#ef4444")
          .text("Failed to load map data");
        return;
      }

      const countries: CountryFeature[] =
        topology.objects?.countries
          ? (
              topojson.feature(
                topology,
                topology.objects.countries
              ) as { features: CountryFeature[] }
            ).features
          : [];

      g.append("g")
        .selectAll("path")
        .data(countries)
        .join("path")
        .attr("d", d => path(d) || null)
        .attr("fill", "#f8fafc")
        .attr("stroke", "#e6e9ee")
        .attr("stroke-width", 0.4);

      /* Build centroid lookup */
      const centroidMap: Record<string, [number, number]> = {};
      countries.forEach(f => {
        const name = f.properties?.name || f.properties?.NAME;
        if (name) centroidMap[name] = d3.geoCentroid(f);
      });

      const validFlows = processedFlows
        .map(f => {
          const s = centroidMap[f.source];
          const t = centroidMap[f.target];
          if (!s || !t) return null;
          return { ...f, sourceCoord: s, targetCoord: t };
        })
        .filter(
          (f): f is Flow & {
            sourceCoord: [number, number];
            targetCoord: [number, number];
          } => f !== null
        );

      const arcsG = g.append("g");
      const pointsG = g.append("g");

      validFlows.forEach(f => {
        const interpolate = d3.geoInterpolate(
          f.sourceCoord,
          f.targetCoord
        );

        const coords = d3
          .range(0, 1.01, 0.02)
          .map(t => projection(interpolate(t)) as [number, number]);

        const line = d3
          .line<[number, number]>()
          .curve(d3.curveBasis);

        arcsG
          .append("path")
          .attr("d", line(coords)!)
          .attr("fill", "none")
          .attr("stroke", "#111827")
          .attr("stroke-width", 2)
          .attr("opacity", 0.85);
      });

      const nodes = Array.from(
        new Set(validFlows.flatMap(f => [f.source, f.target]))
      );

      pointsG
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("cx", d => projection(centroidMap[d])?.[0] ?? 0)
        .attr("cy", d => projection(centroidMap[d])?.[1] ?? 0)
        .attr("r", 3.5)
        .attr("fill", "#1f2937")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.8);
    })();

    return () => {
      d3.select(svgNode).selectAll("*").remove();
    };
  }, [processedFlows, width, height]);

  return (
    <div style={{ maxWidth: width }}>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}
