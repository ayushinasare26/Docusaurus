import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sortField = searchParams.get('sortField') || 'manfid';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        const field = searchParams.get('field');
        const value = searchParams.get('value');

        // Build base query
        let sql = `SELECT * FROM manufacturers`;
        const queryParams: any[] = [];

        // Support filtering
        if (field && value) {
            if (['manfname', 'manfaddress', 'manfweb', 'manfemail', 'manfcontactno'].includes(field)) {
                sql += ` WHERE ${field} LIKE ?`;
                queryParams.push(`%${value}%`);
            }
        }

        // Support sorting (whitelist fields to prevent SQL injection)
        const validSortFields = ['manfid', 'manfname', 'manfaddress', 'manfemail', 'manfcontactno', 'isdeleted'];
        const validSortOrder = ['asc', 'desc'];

        const safeSortField = validSortFields.includes(sortField.toLowerCase()) ? sortField : 'manfid';
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
        console.error("Error fetching manufacturers:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch manufacturers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { manfname, manfaddress, manfweb, manfemail, manfcontactno } = body;

        if (!manfname) {
            return NextResponse.json({ error: "Manufacturer name is required" }, { status: 400 });
        }

        const sql = `INSERT INTO manufacturers (manfname, manfaddress, manfweb, manfemail, manfcontactno, isdeleted) VALUES (?, ?, ?, ?, ?, 0)`;
        const result: any = await query(sql, [
            manfname,
            manfaddress || null,
            manfweb || null,
            manfemail || null,
            manfcontactno || null
        ]);

        return NextResponse.json({ id: result.insertId, message: "Manufacturer created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating manufacturer:", error);
        return NextResponse.json({ error: error.message || "Failed to create manufacturer" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { manfid, manfname, manfaddress, manfweb, manfemail, manfcontactno, isdeleted } = body;

        if (!manfid) {
            return NextResponse.json({ error: "Missing manufacturer ID" }, { status: 400 });
        }

        const updates = [];
        const params = [];

        if (manfname !== undefined) { updates.push('manfname = ?'); params.push(manfname); }
        if (manfaddress !== undefined) { updates.push('manfaddress = ?'); params.push(manfaddress); }
        if (manfweb !== undefined) { updates.push('manfweb = ?'); params.push(manfweb); }
        if (manfemail !== undefined) { updates.push('manfemail = ?'); params.push(manfemail); }
        if (manfcontactno !== undefined) { updates.push('manfcontactno = ?'); params.push(manfcontactno); }
        if (isdeleted !== undefined) { updates.push('isdeleted = ?'); params.push(isdeleted ? 1 : 0); }

        if (updates.length === 0) {
            return NextResponse.json({ message: "Nothing to update" }, { status: 200 });
        }

        params.push(manfid);
        const sql = `UPDATE manufacturers SET ${updates.join(', ')} WHERE manfid = ?`;

        await query(sql, params);

        return NextResponse.json({ message: "Manufacturer updated successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating manufacturer:", error);
        return NextResponse.json({ error: error.message || "Failed to update manufacturer" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const manfid = searchParams.get('manfid');

        if (!manfid) {
            return NextResponse.json({ error: "Missing manufacturer ID" }, { status: 400 });
        }

        // Check if it's already soft deleted
        const checkSql = `SELECT isdeleted FROM manufacturers WHERE manfid = ?`;
        const rows: any = await query(checkSql, [manfid]);

        if (rows.length === 0) {
            return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
        }

        const isDeleted = rows[0].isdeleted;

        if (isDeleted) {
            // Hard delete if already soft deleted
            await query(`DELETE FROM manufacturers WHERE manfid = ?`, [manfid]);
            return NextResponse.json({ message: "Manufacturer deleted permanently" }, { status: 200 });
        } else {
            // Soft delete
            await query(`UPDATE manufacturers SET isdeleted = 1 WHERE manfid = ?`, [manfid]);
            return NextResponse.json({ message: "Manufacturer moved to trash" }, { status: 200 });
        }
    } catch (error: any) {
        console.error("Error deleting manufacturer:", error);
        return NextResponse.json({ error: error.message || "Failed to delete manufacturer" }, { status: 500 });
    }
}
