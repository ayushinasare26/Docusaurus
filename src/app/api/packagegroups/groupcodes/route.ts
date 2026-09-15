import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(_req: NextRequest) {
  try {
    // Fetch distinct group codes from allrates table
    const results: any = await query(`SELECT DISTINCT groupcode FROM allrates WHERE groupcode IS NOT NULL ORDER BY groupcode ASC`);

    // Map to GroupOption format: { label, value }
    const options = results.map((row: any) => ({
      label: row.groupcode,
      value: row.groupcode
    }));

    return NextResponse.json(options);
  } catch (error: any) {
    console.error("Error fetching group codes:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch group codes" }, { status: 500 });
  }
}
