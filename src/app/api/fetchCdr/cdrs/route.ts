import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const custid = searchParams.get('custid');
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!custid || !year || !month) {
    return NextResponse.json({ error: 'custid, year, and month are required' }, { status: 400 });
  }

  try {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = Number(month) - 1;
    if (monthIdx < 0 || monthIdx > 11) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    const tableName = `${monthNames[monthIdx]}${year}`;

    // Check if table exists
    const tables: any = await query(`SHOW TABLES LIKE ?`, [tableName]);
    if (tables.length === 0) {
      return NextResponse.json({ cdrs: [] });
    }

    const results = await query(`SELECT * FROM \`${tableName}\` WHERE custid = ? ORDER BY calldate ASC`, [custid]);

    return NextResponse.json({ cdrs: results });
  } catch (error: any) {
    console.error('Error fetching CDRs:', error);
    return NextResponse.json({ error: 'Failed to fetch CDRs', details: error.message }, { status: 500 });
  }
}
