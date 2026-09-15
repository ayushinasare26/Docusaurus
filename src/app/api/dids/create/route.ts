import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getVerifiedToken } from '@/lib/auth';

function isNumericString(value: string) {
  return /^[0-9]+$/.test(value);
}

export async function POST(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      didno,
      custid,
      allocateddate,
      purchasedate,
      type,
      provider,
      location,
      terminationno,
      in_ll_callcharge,
      in_m_callcharge,
      didlocation,
      countryid,
    } = body || {};

    if (!didno || !isNumericString(String(didno))) {
      return NextResponse.json({ error: 'DID number is required and must be numeric' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'DID type is required' }, { status: 400 });
    }

    if (location === undefined || location === null) {
      return NextResponse.json({ error: 'Location type is required' }, { status: 400 });
    }

    if (!countryid) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    }

    const existing = await query('SELECT didno FROM dids WHERE didno = ?', [String(didno)]);
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'DID number already exists' }, { status: 409 });
    }

    const sql = `
      INSERT INTO dids (
        didno, custid, allocateddate, purchasedate, type,
        provider, location, terminationno, in_ll_callcharge,
        in_m_callcharge, didlocation, countryid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      String(didno),
      Number(custid ?? 0),
      allocateddate || null,
      purchasedate || null,
      Number(type),
      provider || null,
      Number(location),
      terminationno || null,
      in_ll_callcharge ?? 0,
      in_m_callcharge ?? 0,
      didlocation || null,
      Number(countryid),
    ]);

    return NextResponse.json({ message: 'DID created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating DID:', error);
    return NextResponse.json({ error: error.message || 'Failed to create DID' }, { status: 500 });
  }
}
