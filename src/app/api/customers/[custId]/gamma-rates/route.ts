import { NextResponse } from 'next/server';
import getDbConnection from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST - Add new Gamma rate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const body = await request.json();
    const connection = await getDbConnection();

    const { groupcode, charges } = body;

    await connection.execute<ResultSetHeader>(
      `INSERT INTO customerratesgamma (custid, groupcode, charges) VALUES (?, ?, ?)`,
      [custId, groupcode, charges || 0]
    );

    return NextResponse.json({ message: 'Gamma rate added successfully' }, { status: 201 });

  } catch (error) {
    console.error('Database error (POST gamma rate):', error);
    return NextResponse.json({ error: 'Failed to add Gamma rate', details: String(error) }, { status: 500 });
  }
}

// DELETE - Delete Gamma rate
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
      `DELETE FROM customerratesgamma WHERE crid = ? AND custid = ?`,
      [crid, custId]
    );

    return NextResponse.json({ message: 'Gamma rate deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Database error (DELETE gamma rate):', error);
    return NextResponse.json({ error: 'Failed to delete Gamma rate', details: String(error) }, { status: 500 });
  }
}
