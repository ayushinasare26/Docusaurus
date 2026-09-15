import { NextResponse } from 'next/server';
import getDbConnection from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET single customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const connection = await getDbConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM customer WHERE custid = ?',
      [custId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });

  } catch (error) {
    console.error('Database error (GET single customer):', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// UPDATE customer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const body = await request.json();
    const connection = await getDbConnection();

    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'custname', 'addressline1', 'addressline2', 'addressline3',
      'city', 'pincode', 'invemailto', 'invemailcc', 'coremailto', 'coremailcc',
      'contactmain1', 'contactmain2', 'contactperson1', 'contactno1',
      'contactperson2', 'contactno2', 'contactperson3', 'contactno3',
      'contactperson4', 'contactno4', 'isdeleted', 'discount', 'comments',
      'creditlimit', 'overlimitmessage', 'isdistributor', 'isSuspended',
      'providerid', 'ddtrefno', 'vat', 'rental_comission', 'call_comission'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(custId);

    const query = `UPDATE customer SET ${updates.join(', ')} WHERE custid = ?`;
    await connection.execute(query, values);

    return NextResponse.json({ message: 'Customer updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Database error (PATCH customer):', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE (soft delete) customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params;
    const connection = await getDbConnection();

    // Soft delete by setting isdeleted = 1
    await connection.execute(
      'UPDATE customer SET isdeleted = 1 WHERE custid = ?',
      [custId]
    );

    return NextResponse.json({ message: 'Customer deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Database error (DELETE customer):', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
