import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sortField = searchParams.get('sortField') || 'eid';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        const field = searchParams.get('field');
        const value = searchParams.get('value');

        // Build base query
        let sql = `
      SELECT a.eid, a.ename, a.prourl, b.manfname, a.isdeleted, a.manfid 
      FROM equipments a
      LEFT JOIN manufacturers b ON a.manfid = b.manfid
    `;

        const queryParams: any[] = [];

        // Support filtering
        if (field && value) {
            if (field === 'ename') {
                sql += ` WHERE a.ename LIKE ?`;
                queryParams.push(`%${value}%`);
            } else if (field === 'manfname') {
                sql += ` WHERE b.manfname LIKE ?`;
                queryParams.push(`%${value}%`);
            }
        }

        // Support sorting (whitelist fields to prevent SQL injection)
        const validSortFields = ['eid', 'ename', 'prourl', 'manfname', 'isdeleted'];
        const validSortOrder = ['asc', 'desc'];

        const safeSortField = validSortFields.includes(sortField.toLowerCase()) ? sortField : 'eid';
        const safeSortOrder = validSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder : 'asc';

        sql += ` ORDER BY ${safeSortField} ${safeSortOrder}`;

        const results = await query(sql, queryParams);

        // We should cast BigInt to string/number if it exists, otherwise JSON.stringify will fail on BigInts
        const serializedResults = JSON.parse(JSON.stringify(results, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));

        return NextResponse.json(serializedResults, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching equipment:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch equipment" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ename, prourl, manfid } = body;

        if (!ename || !manfid) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sql = `INSERT INTO equipments (ename, prourl, manfid, isdeleted) VALUES (?, ?, ?, 0)`;
        const result: any = await query(sql, [ename, prourl || null, manfid]);

        return NextResponse.json({ id: result.insertId, message: "Equipment created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating equipment:", error);
        return NextResponse.json({ error: error.message || "Failed to create equipment" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { eid, ename, prourl, manfid, isdeleted } = body;

        if (!eid) {
            return NextResponse.json({ error: "Missing equipment ID" }, { status: 400 });
        }

        const updates = [];
        const params = [];

        if (ename !== undefined) { updates.push('ename = ?'); params.push(ename); }
        if (prourl !== undefined) { updates.push('prourl = ?'); params.push(prourl); }
        if (manfid !== undefined) { updates.push('manfid = ?'); params.push(manfid); }
        if (isdeleted !== undefined) { updates.push('isdeleted = ?'); params.push(isdeleted ? 1 : 0); }

        if (updates.length === 0) {
            return NextResponse.json({ message: "Nothing to update" }, { status: 200 });
        }

        params.push(eid);
        const sql = `UPDATE equipments SET ${updates.join(', ')} WHERE eid = ?`;

        await query(sql, params);

        return NextResponse.json({ message: "Equipment updated successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating equipment:", error);
        return NextResponse.json({ error: error.message || "Failed to update equipment" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const eid = searchParams.get('eid');

        if (!eid) {
            return NextResponse.json({ error: "Missing equipment ID" }, { status: 400 });
        }

        // Check if it's already soft deleted to decide between soft delete or hard delete
        const checkSql = `SELECT isdeleted FROM equipments WHERE eid = ?`;
        const rows: any = await query(checkSql, [eid]);

        if (rows.length === 0) {
            return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
        }

        const isDeleted = rows[0].isdeleted;

        if (isDeleted) {
            // Hard delete if already soft deleted
            await query(`DELETE FROM equipments WHERE eid = ?`, [eid]);
            return NextResponse.json({ message: "Equipment deleted permanently" }, { status: 200 });
        } else {
            // Soft delete
            await query(`UPDATE equipments SET isdeleted = 1 WHERE eid = ?`, [eid]);
            return NextResponse.json({ message: "Equipment moved to trash" }, { status: 200 });
        }
    } catch (error: any) {
        console.error("Error deleting equipment:", error);
        return NextResponse.json({ error: error.message || "Failed to delete equipment" }, { status: 500 });
    }
}
