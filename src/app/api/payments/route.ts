import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";



export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    let ptype = searchParams.get('ptype');
    if (ptype === 'BACS') {
      ptype = 'BAC';
    }
    const stype = searchParams.get('stype');
    const searchby = searchParams.get('searchby') ?? searchParams.get('field');
    const searchtext = searchParams.get('searchtext') ?? searchParams.get('value');

    // Get start and end of current month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let sql = `
      SELECT p.paymentid, c.custid, c.custname, p.paymentdate, p.amount, p.ptype, p.stype, p.comments, p.gocardless_payment_id, c.contactmain1, c.contactno1, p.invoiceno
      FROM paymentdetails p
      JOIN customer c ON p.custid = c.custid
      WHERE p.isdeleted = 0
    `;
    const queryParams: any[] = [];

    if (ptype && ptype !== 'all') {
      sql += ` AND p.ptype = ?`;
      queryParams.push(ptype);
    }

    if (stype && stype !== 'all') {
      sql += ` AND p.stype = ?`;
      queryParams.push(stype);
    }

    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    if (fromDate && toDate) {
      sql += ` AND p.paymentdate BETWEEN ? AND ?`;
      queryParams.push(fromDate, toDate);
    } else if (fromDate) {
      sql += ` AND p.paymentdate >= ?`;
      queryParams.push(fromDate);
    } else if (toDate) {
      sql += ` AND p.paymentdate <= ?`;
      queryParams.push(toDate);
    }

    if (searchby && searchtext) {
      if (searchby === 'custid') {
        sql += ` AND c.custid LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      } else if (searchby === 'custname') {
        sql += ` AND c.custname LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      } else if (searchby === 'ptype') {
        let mappedVal = searchtext;
        const lowerVal = searchtext.toLowerCase();
        if (lowerVal.includes('cash')) mappedVal = 'CSH';
        else if (lowerVal.includes('cheque') || lowerVal.includes('chq')) mappedVal = 'CHQ';
        else if (lowerVal.includes('debit') || lowerVal.includes('ddt') || lowerVal.includes('direct')) mappedVal = 'DDT';
        else if (lowerVal.includes('bac')) mappedVal = 'BAC';

        sql += ` AND p.ptype LIKE ?`;
        queryParams.push(`%${mappedVal}%`);
      } else if (searchby === 'amount') {
        sql += ` AND p.amount LIKE ?`;
        queryParams.push(`%${searchtext}%`);
      }
    }

    sql += ` ORDER BY p.paymentdate DESC`;

    const results = await query(sql, queryParams) as any[];    const mappedResults = results.map(row => {
      const processed = row.invoiceno !== 0 && row.invoiceno !== '0' && row.invoiceno !== null;
      return {
        ...row,
        processed,
        paidThisMonth: processed, // backward compatibility
      };
    });

    return NextResponse.json(mappedResults);
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { custid, paymentdate, amount, ptype, stype, comments } = body;

    const sql = `
      INSERT INTO paymentdetails (custid, invoiceno, paymentdate, amount, ptype, stype, comments) 
      VALUES (?, 0, ?, ?, ?, ?, ?)
    `;
    const result: any = await query(sql, [custid, paymentdate, amount, ptype, stype, comments]);

    return NextResponse.json({ success: true, paymentid: result.insertId, message: "Payment created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    await query(`UPDATE paymentdetails SET isdeleted = 1 WHERE paymentid = ?`, [id]);
    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}