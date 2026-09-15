import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ packageid: string }> }
) {
  try {
    const { packageid } = await params;

    // 1. Get package details
    const pkgResult: any = await query(`SELECT * FROM packages WHERE packageid = ?`, [packageid]);
    if (pkgResult.length === 0) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const pkg = pkgResult[0];

    // 2. Get group codes
    const groupsResult: any = await query(`SELECT groupcode FROM packagegroups WHERE packageid = ?`, [packageid]);
    pkg.groupcodes = groupsResult.map((g: any) => g.groupcode);

    return NextResponse.json(pkg);
  } catch (error: any) {
    console.error("Error fetching package details:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch package details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ packageid: string }> }
) {
  try {
    const { packageid } = await params;
    const body = await req.json();
    const { packagename, createdate, groupcodes, isdeleted } = body;

    // Update package info
    const updates = [];
    const queryParams = [];

    if (packagename !== undefined) { updates.push('packagename = ?'); queryParams.push(packagename); }
    if (createdate !== undefined) { updates.push('createdate = ?'); queryParams.push(createdate); }
    if (isdeleted !== undefined) { updates.push('isdeleted = ?'); queryParams.push(isdeleted); }

    if (updates.length > 0) {
      queryParams.push(packageid);
      await query(`UPDATE packages SET ${updates.join(', ')} WHERE packageid = ?`, queryParams);
    }

    // Update groups if provided
    if (groupcodes !== undefined && Array.isArray(groupcodes)) {
      // Clear existing
      await query(`DELETE FROM packagegroups WHERE packageid = ?`, [packageid]);
      // Insert new
      for (const code of groupcodes) {
        await query(`INSERT INTO packagegroups (packageid, groupcode) VALUES (?, ?)`, [packageid, code]);
      }
    }

    return NextResponse.json({ message: "Package updated successfully" });
  } catch (error: any) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: error.message || "Failed to update package" }, { status: 500 });
  }
}