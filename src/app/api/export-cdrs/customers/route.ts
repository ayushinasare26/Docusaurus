import { NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";
import { listExportCustomers } from "@/lib/exportCdr";

export async function GET() {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customers = await listExportCustomers();
    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load customers" }, { status: 500 });
  }
}
