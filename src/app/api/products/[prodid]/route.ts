import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ prodid: string }> }
) {
  try {
    const { prodid } = await params;
    const results: any = await query(`SELECT * FROM products WHERE prodid = ?`, [prodid]);

    if (results.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ prodid: string }> }
) {
  try {
    const { prodid } = await params;
    const body = await req.json();
    const { prodname, desc, rent, type, duration, invstatus } = body;

    const sql = `
      UPDATE products 
      SET prodname = ?, \`desc\` = ?, rent = ?, type = ?, duration = ?, invstatus = ?
      WHERE prodid = ?
    `;
    await query(sql, [prodname, desc, rent, type, duration, invstatus ? 1 : 0, prodid]);

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ prodid: string }> }
) {
  try {
    const { prodid } = await params;
    await query(`UPDATE products SET isdeleted = 1 WHERE prodid = ?`, [prodid]);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}