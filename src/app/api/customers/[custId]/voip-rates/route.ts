import { NextResponse } from 'next/server';
import getDbConnection from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST - Add new VOIP rate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const body = await request.json();
    const connection = await getDbConnection();

    const { groupcode, charges, mobilecharges } = body;

    await connection.execute<ResultSetHeader>(
      `INSERT INTO customerratesvoip (custid, groupcode, charges, mobilecharges) VALUES (?, ?, ?, ?)`,
      [custId, groupcode, charges || 0, mobilecharges || 0]
    );

    return NextResponse.json({ message: 'VOIP rate added successfully' }, { status: 201 });

  } catch (error) {
    console.error('Database error (POST voip rate):', error);
    return NextResponse.json({ error: 'Failed to add VOIP rate', details: String(error) }, { status: 500 });
  }
}

// DELETE - Delete VOIP rate
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const { searchParams } = new URL(request.url);
    const crid = searchParams.get('crid');
    
    if (!crid) {
      return NextResponse.json({ error: 'Rate ID (crid) is required' }, { status: 400 });
    }

    const connection = await getDbConnection();

    await connection.execute(
      `DELETE FROM customerratesvoip WHERE crid = ? AND custid = ?`,
      [crid, custId]
    );

    return NextResponse.json({ message: 'VOIP rate deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Database error (DELETE voip rate):', error);
    return NextResponse.json({ error: 'Failed to delete VOIP rate', details: String(error) }, { status: 500 });
  }
}
