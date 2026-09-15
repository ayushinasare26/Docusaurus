import { NextRequest, NextResponse } from "next/server";
import { listCronLogs } from "@/lib/dailyCdrSync";
import { getVerifiedToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? "10"));
  const offset = (page - 1) * limit;

  try {
    const logs = await listCronLogs(limit, offset);
    return NextResponse.json({ logs, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cron logs" }, { status: 500 });
  }
}
