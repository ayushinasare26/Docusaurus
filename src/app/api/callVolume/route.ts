import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const year = searchParams.get('year');

  if (!year) {
    return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
  }

  const months = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  try {
    const callVolumes = Array(12).fill(0);

    for (let i = 0; i < months.length; i++) {
      const tableName = `${months[i]}${year}`;

      // Check if table exists (SHOW TABLES LIKE does not support parameterized queries)
      const tables: any = await query(`SHOW TABLES LIKE '${tableName}'`);

      if (tables.length === 0) continue;

      // Sum call duration and convert seconds to minutes
      const results: any = await query(
        `SELECT ROUND(SUM(callduration) / 60, 2) AS duration_minutes 
         FROM \`${tableName}\` 
         WHERE YEAR(calldate) = ? AND MONTH(calldate) = ?`,
        [year, i + 1]
      );

      callVolumes[i] = results[0]?.duration_minutes || 0;
    }

    return NextResponse.json(callVolumes);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch call volume data' }, { status: 500 });
  }
}
