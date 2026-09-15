import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // Support both 'searchby'/'searchtext' (GenericTablePage) and legacy 'field'/'value'
    const field = searchParams.get('searchby') ?? searchParams.get('field');
    const value = searchParams.get('searchtext') ?? searchParams.get('value');

    let sql = `SELECT * FROM products WHERE isdeleted = 0`;
    const queryParams: any[] = [];

    if (field && value) {
      if (field === 'prodname') {
        sql += ` AND prodname LIKE ?`;
        queryParams.push(`%${value}%`);
      } else if (field === 'desc') {
        sql += ` AND \`desc\` LIKE ?`;
        queryParams.push(`%${value}%`);
      } else if (field === 'prodid') {
        sql += ` AND prodid = ?`;
        queryParams.push(value);
      } else if (field === 'rent') {
        sql += ` AND rent LIKE ?`;
        queryParams.push(`%${value}%`);
      }
    }
    sql += ` ORDER BY prodid ASC`;

    const results = await query(sql, queryParams);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prodid, prodname, desc, rent, type, duration, invstatus } = body;

    // Check if it's an update or insert
    if (prodid) {
      const sql = `
        UPDATE products 
        SET prodname = ?, \`desc\` = ?, rent = ?, type = ?, duration = ?, invstatus = ?
        WHERE prodid = ?
      `;
      await query(sql, [prodname, desc, rent, type, duration, invstatus ? 1 : 0, prodid]);
      return NextResponse.json({ message: "Product updated successfully" });
    } else {
      const sql = `
        INSERT INTO products (prodname, \`desc\`, rent, type, duration, invstatus, isdeleted) 
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `;
      const result: any = await query(sql, [prodname, desc, rent, type, duration, invstatus ? 1 : 0]);
      return NextResponse.json({ id: result.insertId, message: "Product created successfully" }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Error saving product:", error);
    return NextResponse.json({ error: error.message || "Failed to save product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const pid = searchParams.get('pid');

    if (!pid) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    await query(`UPDATE products SET isdeleted = 1 WHERE prodid = ?`, [pid]);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}