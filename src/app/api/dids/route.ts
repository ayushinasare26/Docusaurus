import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";
import { getVerifiedToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const searchby = searchParams.get('searchby') ?? searchParams.get('field') ?? 'didno';
    const searchtext = searchParams.get('searchtext') ?? searchParams.get('value') ?? '';

    let sql = `
      SELECT d.*, c.custname 
      FROM dids d
      LEFT JOIN customer c ON d.custid = c.custid
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (searchtext) {
      if (searchby === 'didno') {
        sql += ` AND d.didno LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      } else if (searchby === 'custid') {
        sql += ` AND d.custid LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      } else if (searchby === 'custname') {
        sql += ` AND c.custname LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      } else if (searchby === 'provider') {
        sql += ` AND d.provider LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      }
    }

    if (searchby === 'available') {
      sql += ` AND (d.custid = 0 OR d.custid IS NULL)`;
    } else if (searchby === 'allocated') {
      sql += ` AND d.custid > 0`;
    }

    sql += ` ORDER BY d.didno ASC`;

    const results = await query(sql, queryParams);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching DIDs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch DIDs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      didno, custid, allocateddate, purchasedate, type,
      provider, location, terminationno, in_ll_callcharge,
      in_m_callcharge, didlocation, countryid
    } = body;

    const existing = await query(`SELECT didno FROM dids WHERE didno = ?`, [didno]) as any[];

    if (existing.length > 0) {
      const sql = `
        UPDATE dids 
        SET custid = ?, allocateddate = ?, purchasedate = ?, type = ?, 
            provider = ?, location = ?, terminationno = ?, in_ll_callcharge = ?, 
            in_m_callcharge = ?, didlocation = ?, countryid = ?
        WHERE didno = ?
      `;
      await query(sql, [
        custid, allocateddate, purchasedate, type,
        provider, location, terminationno, in_ll_callcharge,
        in_m_callcharge, didlocation, countryid, didno
      ]);
      return NextResponse.json({ message: "DID updated successfully" });
    } else {
      const sql = `
        INSERT INTO dids (
          didno, custid, allocateddate, purchasedate, type, 
          provider, location, terminationno, in_ll_callcharge, 
          in_m_callcharge, didlocation, countryid
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        didno, custid, allocateddate, purchasedate, type,
        provider, location, terminationno, in_ll_callcharge,
        in_m_callcharge, didlocation, countryid
      ]);
      return NextResponse.json({ message: "DID created successfully" }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Error saving DID:", error);
    return NextResponse.json({ error: error.message || "Failed to save DID" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const didno = searchParams.get('didno');

    if (!didno) {
      return NextResponse.json({ error: "Missing DID number" }, { status: 400 });
    }

    await query(`DELETE FROM dids WHERE didno = ?`, [didno]);
    return NextResponse.json({ message: "DID deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting DID:", error);
    return NextResponse.json({ error: error.message || "Failed to delete DID" }, { status: 500 });
  }
}
