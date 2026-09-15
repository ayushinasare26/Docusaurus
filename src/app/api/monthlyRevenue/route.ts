import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'Year and month parameters are required' }, { status: 400 });
  }

  try {
    const results: any = await query(
      `SELECT SUM(i.total - i.prevbal + i.paymentreceived) AS totalRevenue FROM \`invoices\` i
       INNER JOIN customer c ON i.custid = c.custid
       WHERE YEAR(i.invoicedate) = ? AND MONTH(i.invoicedate) = ?
       AND c.custname != 'Pioneer Global Services Ltd'`,
      [year, month]
    );

    return NextResponse.json({ totalRevenue: results[0]?.totalRevenue || 0 });
  } catch (error: any) {
    console.error('Monthly revenue query error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly revenue data' }, { status: 500 });
  }
}
