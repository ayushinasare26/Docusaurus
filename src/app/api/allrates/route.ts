import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";
import { query } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1), 1000);
    const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0", 10), 0);
    const search = (searchParams.get("search") || "").trim();

    const whereSql = search ? `WHERE groupcode LIKE ? OR dialprefix LIKE ? OR destinationplace LIKE ? OR type LIKE ?` : "";
    const whereParams = search ? Array(4).fill(`%${search}%`) : [];

    const [rows, countRows] = await Promise.all([
      query(
        `
        SELECT
          srno,
          groupcode,
          dialprefix,
          destinationplace,
          buying,
          stndcharges,
          defaultrates,
          conncharges,
          \`uk-mobile-5p\`,
          onthehill,
          dsg,
          \`dsg-client\`,
          tka,
          smart,
          type
        FROM allrates
        ${whereSql}
        ORDER BY dialprefix ASC, destinationplace ASC
        LIMIT ? OFFSET ?
        `,
        [...whereParams, limit, offset]
      ),
      query(
        `
        SELECT COUNT(*) AS total
        FROM allrates
        ${whereSql}
        `,
        whereParams
      ),
    ]);

    return NextResponse.json({
      results: rows,
      total: Array.isArray(countRows) ? Number((countRows as any[])[0]?.total || 0) : 0,
      limit,
      offset,
      search,
    });
  } catch (err: any) {
    console.error("[allrates] error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch allrates" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const srno = Number(body?.srno);
    const stndcharges = Number(body?.stndcharges);
    const defaultrates = Number(body?.defaultrates);
    const conncharges = Number(body?.conncharges);

    if (!Number.isFinite(srno)) {
      return NextResponse.json({ error: "Valid srno is required" }, { status: 400 });
    }

    await query(
      `
      UPDATE allrates
      SET stndcharges = ?, defaultrates = ?, conncharges = ?
      WHERE srno = ?
      `,
      [stndcharges, defaultrates, conncharges, srno]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[allrates patch] error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update allrates row" }, { status: 500 });
  }
}
