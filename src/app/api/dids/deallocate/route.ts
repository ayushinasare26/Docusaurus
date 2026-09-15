import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";
import { getVerifiedToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { didno } = body;

    if (!didno) {
      return NextResponse.json({ error: "Missing DID number" }, { status: 400 });
    }

    // Update dids table to clear custid, allocateddate, and terminationno
    const sql = `
      UPDATE dids 
      SET custid = 0, allocateddate = NULL, terminationno = NULL
      WHERE didno = ?
    `;

    await query(sql, [didno]);

    return NextResponse.json({ message: "DID deallocated successfully" });
  } catch (error: any) {
    console.error("Error deallocating DID:", error);
    return NextResponse.json({ error: error.message || "Failed to deallocate DID" }, { status: 500 });
  }
}
