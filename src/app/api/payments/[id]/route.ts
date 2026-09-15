import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results: any = await query(`
      SELECT p.*, c.custname 
      FROM paymentdetails p
      JOIN customer c ON p.custid = c.custid
      WHERE p.paymentid = ?
    `, [id]);

    if (results.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { custid, paymentdate, amount, ptype, stype, comments } = body;

    const sql = `
      UPDATE paymentdetails 
      SET custid = ?, paymentdate = ?, amount = ?, ptype = ?, stype = ?, comments = ?
      WHERE paymentid = ?
    `;
    await query(sql, [custid, paymentdate, amount, ptype, stype, comments, id]);

    return NextResponse.json({ success: true, message: "Payment updated successfully" });
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`UPDATE paymentdetails SET isdeleted = 1 WHERE paymentid = ?`, [id]);
    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}