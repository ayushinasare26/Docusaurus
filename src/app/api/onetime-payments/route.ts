import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sortField = searchParams.get('sortField') || 'custid';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        const field = searchParams.get('field');
        const value = searchParams.get('value');

        let sql = `
      SELECT CONCAT(IFNULL(o.custid, '0'), '_', REPLACE(REPLACE(REPLACE(IFNULL(o.date, ''), '-', ''), ':', ''), ' ', ''), '_', IFNULL(o.unitprice, '0')) AS onetimeid,
             o.custid, c.custname, o.date, o.itemdesc, o.unitprice, o.quantity, o.section, o.invoiceno
      FROM onetime o
      JOIN customer c ON o.custid = c.custid 
      WHERE o.invoiceno = 0
    `;
        const queryParams: any[] = [];
        if (field && value) {
            if (field === 'custid') {
                sql += ` AND o.custid LIKE ?`;
                queryParams.push(`%${value}%`);
            } else if (field === 'custname') {
                sql += ` AND c.custname LIKE ?`;
                queryParams.push(`%${value}%`);
            } else if (field === 'itemdesc') {
                sql += ` AND o.itemdesc LIKE ?`;
                queryParams.push(`%${value}%`);
            }
        }

        // Support sorting (whitelist fields to prevent SQL injection)
        const validSortFields = ['onetimeid', 'custid', 'custname', 'date', 'unitprice', 'quantity'];
        const validSortOrder = ['asc', 'desc'];

        const safeSortField = validSortFields.includes(sortField.toLowerCase()) ? sortField : 'custid';
        const safeSortOrder = validSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder : 'asc';

        sql += ` ORDER BY ${safeSortField} ${safeSortOrder}`;

        const results = await query(sql, queryParams);

        // We should cast BigInt to string/number if it exists, otherwise JSON.stringify will fail on BigInts
        const serializedResults = JSON.parse(JSON.stringify(results, (key, value) => {
            if (typeof value === 'bigint') return value.toString();
            return value;
        }));

        return NextResponse.json(serializedResults, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching onetime payments:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch onetime payments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { custid, date, itemdesc, unitprice, quantity, section } = body;

        if (!custid || !date || !itemdesc || unitprice === undefined || quantity === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sql = `
      INSERT INTO onetime (custid, date, itemdesc, unitprice, quantity, section, invoiceno) 
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
        const result: any = await query(sql, [
            custid,
            date,
            itemdesc,
            unitprice,
            quantity,
            section || 'O'
        ]);

        return NextResponse.json({ id: result.insertId, message: "Onetime payment created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating onetime payment:", error);
        return NextResponse.json({ error: error.message || "Failed to create onetime payment" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const custid = searchParams.get('custid');
        const itemdesc = searchParams.get('itemdesc');

        if (!custid || !itemdesc) {
            return NextResponse.json({ error: "Missing identifying fields for delete" }, { status: 400 });
        }

        await query(`DELETE FROM onetime WHERE custid = ? AND itemdesc = ? LIMIT 1`, [custid, itemdesc]);
        return NextResponse.json({ message: "Onetime payment deleted" }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting onetime payment:", error);
        return NextResponse.json({ error: error.message || "Failed to delete onetime payment" }, { status: 500 });
    }
}
