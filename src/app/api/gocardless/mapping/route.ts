import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const custid = searchParams.get('custid');

        if (!custid) {
            return NextResponse.json({ error: "Missing custid parameter" }, { status: 400 });
        }

        const sql = `SELECT gocardless_id FROM customer_payment_ids WHERE custid = ?`;
        const results = await query(sql, [custid]) as any[];

        if (results.length > 0) {
            return NextResponse.json({ gocardless_id: results[0].gocardless_id });
        } else {
            return NextResponse.json({ gocardless_id: null });
        }
    } catch (error: any) {
        console.error("Error fetching GoCardless mapping:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch mapping" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { custid, gocardless_id } = body;

        if (!custid || !gocardless_id) {
            return NextResponse.json({ error: "Missing custid or gocardless_id" }, { status: 400 });
        }

        const existing = await query(`SELECT custid FROM customer_payment_ids WHERE custid = ?`, [custid]) as any[];

        if (existing.length > 0) {
            await query(`UPDATE customer_payment_ids SET gocardless_id = ? WHERE custid = ?`, [gocardless_id, custid]);
            return NextResponse.json({ message: "Mapping updated successfully" });
        } else {
            await query(`INSERT INTO customer_payment_ids (custid, gocardless_id) VALUES (?, ?)`, [custid, gocardless_id]);
            return NextResponse.json({ message: "Mapping created successfully" }, { status: 201 });
        }
    } catch (error: any) {
        console.error("Error saving GoCardless mapping:", error);
        return NextResponse.json({ error: error.message || "Failed to save mapping" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const custid = searchParams.get('custid');

        if (!custid) {
            return NextResponse.json({ error: "Missing custid parameter" }, { status: 400 });
        }

        await query(`DELETE FROM customer_payment_ids WHERE custid = ?`, [custid]);
        return NextResponse.json({ message: "Mapping deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting GoCardless mapping:", error);
        return NextResponse.json({ error: error.message || "Failed to delete mapping" }, { status: 500 });
    }
}
