import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const field = searchParams.get('searchby') ?? searchParams.get('field');
    const value = searchParams.get('searchtext') ?? searchParams.get('value');

    let sql = `
      SELECT p.packageid, p.packagename, DATE_FORMAT(p.createdate, '%Y-%m-%d') as createdate, p.isdeleted,
             GROUP_CONCAT(pg.groupcode ORDER BY pg.groupcode SEPARATOR ', ') as groupcodes
      FROM packages p
      LEFT JOIN packagegroups pg ON p.packageid = pg.packageid
      WHERE p.isdeleted = 0
    `;
    const queryParams: any[] = [];

    if (field && value) {
      if (field === 'packagename') {
        sql += ` AND p.packagename LIKE ?`;
        queryParams.push(`%${value}%`);
      } else if (field === 'packageid') {
        sql += ` AND p.packageid = ?`;
        queryParams.push(value);
      } else if (field === 'createdate') {
        sql += ` AND DATE_FORMAT(p.createdate, '%Y-%m-%d') LIKE ?`;
        queryParams.push(`%${value}%`);
      }
    }

    sql += ` GROUP BY p.packageid`;
    sql += ` ORDER BY createdate ASC`;

    const results = await query(sql, queryParams);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packagename, createdate, groupcodes } = body;

    // 1. Insert into packages
    const pkgResult: any = await query(
      `INSERT INTO packages (packagename, createdate, isdeleted) VALUES (?, ?, 0)`,
      [packagename, createdate]
    );
    const packageId = pkgResult.insertId;

    // 2. Insert into packagegroups
    if (groupcodes && Array.isArray(groupcodes)) {
      for (const code of groupcodes) {
        await query(
          `INSERT INTO packagegroups (packageid, groupcode) VALUES (?, ?)`,
          [packageId, code]
        );
      }
    }

    return NextResponse.json({ id: packageId, message: "Package created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: error.message || "Failed to create package" }, { status: 500 });
  }
}
