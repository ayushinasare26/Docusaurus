import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";
import { buildExportRows, normalizeExportDate, rowsToCsv } from "@/lib/exportCdr";

export async function GET(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = normalizeExportDate(searchParams.get("startDate"));
    const endDate = normalizeExportDate(searchParams.get("endDate"));
    const custids = (searchParams.get("custids") || "")
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }
    if (startDate > endDate) {
      return NextResponse.json({ error: "startDate must be before or equal to endDate" }, { status: 400 });
    }

    const rows = await buildExportRows({ startDate, endDate, custids: custids.length > 0 ? custids : undefined });
    const csv = rowsToCsv(rows);
    const filename = `cdr-export-${startDate}-to-${endDate}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export CDRs" }, { status: 500 });
  }
}
