import { NextResponse } from 'next/server';
import getDbConnection from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getVerifiedToken } from '@/lib/auth';

// POST - Add new product (numberdetails)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { custId } = await params;
    const body = await request.json();
    const connection = await getDbConnection();

    const {
      number,
      type,
      name,
      startdate,
      ip,
      loginid,
      pwd,
      eid: rawEid,
      mac,
      invstatus,
      comments
    } = body;

    console.log('[POST numberdetails] rawEid received:', rawEid, 'type:', typeof rawEid);

    // Resolve eid: use provided value, or fall back to the first equipment in the DB
    let resolvedEid: number | null = (rawEid !== '' && rawEid !== undefined && rawEid !== null) ? Number(rawEid) : null;
    if (resolvedEid === null) {
      const [firstEquip] = await connection.execute<RowDataPacket[]>(
        `SELECT eid FROM equipments ORDER BY eid LIMIT 1`
      );
      const rows = firstEquip as RowDataPacket[];
      resolvedEid = rows.length > 0 ? rows[0].eid : null;
      console.log('[POST numberdetails] eid was empty, using fallback eid:', resolvedEid);
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO numberdetails (custid, number, type, name, startdate, ip, loginid, pwd, eid, mac, invstatus, comments, isdeleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [custId, number, type, name, startdate || null, ip, loginid, pwd, resolvedEid, mac, invstatus ? 1 : 0, comments]
    );

    return NextResponse.json({ message: 'Product added successfully' }, { status: 201 });

  } catch (error) {
    console.error('Database error (POST numberdetails):', error);
    return NextResponse.json({ error: 'Failed to add product', details: String(error) }, { status: 500 });
  }
}

// PATCH - Update product
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { custId } = await params;
    const body = await request.json();
    const connection = await getDbConnection();

    const {
      number, // original number (for WHERE clause)
      newNumber, // new number if changing
      type,
      name,
      startdate,
      ip,
      loginid,
      pwd,
      eid,
      mac,
      invstatus,
      comments
    } = body;

    let resolvedEid: number | null = (eid !== '' && eid !== undefined && eid !== null) ? Number(eid) : null;
    if (resolvedEid === null) {
      const [firstEquip] = await connection.execute<RowDataPacket[]>(
        `SELECT eid FROM equipments ORDER BY eid LIMIT 1`
      );
      const rows = firstEquip as RowDataPacket[];
      resolvedEid = rows.length > 0 ? rows[0].eid : null;
    }

    await connection.execute(
      `UPDATE numberdetails 
       SET number = ?, type = ?, name = ?, startdate = ?, ip = ?, loginid = ?, pwd = ?, eid = ?, mac = ?, invstatus = ?, comments = ?
       WHERE custid = ? AND number = ?`,
      [newNumber || number, type, name, startdate || null, ip, loginid, pwd, resolvedEid, mac, invstatus ? 1 : 0, comments, custId, number]
    );

    return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Database error (PATCH numberdetails):', error);
    return NextResponse.json({ error: 'Failed to update product', details: String(error) }, { status: 500 });
  }
}

// DELETE - Soft delete product (set isdeleted = 1)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { custId } = await params;
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    const restore = searchParams.get('restore') === 'true';

    if (!number) {
      return NextResponse.json({ error: 'Number is required' }, { status: 400 });
    }

    const connection = await getDbConnection();

    await connection.execute(
      `UPDATE numberdetails SET isdeleted = ? WHERE custid = ? AND number = ?`,
      [restore ? 0 : 1, custId, number]
    );

    return NextResponse.json({
      message: restore ? 'Product restored successfully' : 'Product deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Database error (DELETE numberdetails):', error);
    return NextResponse.json({ error: 'Failed to delete product', details: String(error) }, { status: 500 });
  }
}
