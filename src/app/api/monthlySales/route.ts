import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const year = searchParams.get('year');
  const custid = searchParams.get('custid');

  if (!year) {
    return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
  }

  try {
    const monthlySales = [];

    for (let month = 1; month <= 12; month++) {
      let sql;
      let params;

      if (custid && custid !== 'all') {
        sql = `SELECT SUM(i.total - i.prevbal + i.paymentreceived) AS sales FROM \`invoices\` i
               INNER JOIN customer c ON i.custid = c.custid
               WHERE YEAR(i.invoicedate) = ? AND MONTH(i.invoicedate) = ? AND i.custid = ?
               AND c.custname != 'Pioneer Global Services Ltd'`;
        params = [year, month, custid];
      } else {
        sql = `SELECT SUM(i.total - i.prevbal + i.paymentreceived) AS sales FROM \`invoices\` i
               INNER JOIN customer c ON i.custid = c.custid
               WHERE YEAR(i.invoicedate) = ? AND MONTH(i.invoicedate) = ?
               AND c.custname != 'Pioneer Global Services Ltd'`;
        params = [year, month];
      }

      const results: any = await query(sql, params);
      monthlySales.push(results[0]?.sales || 0);
    }

    return NextResponse.json({ monthlySales });
  } catch (error: any) {
    console.error('Monthly sales query error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly sales data' }, { status: 500 });
  }
}
