import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const custid = searchParams.get('custid');

  // Validate required params
  if (!year || !month) {
    return NextResponse.json(
      { error: 'Year and month are required' },
      { status: 400 }
    );
  }

  const monthNames = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  const m = Number(month);
  if (isNaN(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: 'Invalid month value' }, { status: 400 });
  }

  const tableName = `${monthNames[m - 1]}${year}`; // e.g., dec2025

  try {
    // Base query
    let sqlQuery = `SELECT COALESCE(c.city, 'Unknown') AS source, COALESCE(i.calllocation, 'Unknown') AS target,
                        COUNT(*) AS calls, SUM(COALESCE(i.callduration,0)) AS minutes
                 FROM \`${tableName}\` i
                 INNER JOIN customer c ON i.custid = c.custid
                 WHERE 1=1 AND c.custname != 'Pioneer Global Services Ltd'`;

    const params: any[] = [];

    if (custid && custid !== 'all') {
      sqlQuery += ' AND i.custid = ?';
      params.push(custid);
    }

    sqlQuery += ' GROUP BY source, target ORDER BY minutes DESC LIMIT 1000';

    const rows: any = await query(sqlQuery, params);

    const flows = rows.map((r: any) => ({
      source: r.source,
      target: r.target,
      calls: Number(r.calls),
      minutes: Number(r.minutes)
    }));

    console.log('[Next.js API] Returning flows count:', flows.length);

    return NextResponse.json({ flows });
  } catch (error: any) {
    let message = 'Unknown error';

    if (error instanceof Error) {
      message = error.message;
    }

    console.error('[Next.js API] Error in callFlows request:', message);
    console.error('[Next.js API] Error details:', error);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ flows: [] });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch call flows',
        details: message,
      },
      { status: 500 }
    );
  }
}
