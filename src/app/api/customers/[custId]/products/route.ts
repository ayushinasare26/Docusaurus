import { NextResponse } from 'next/server';
import getDbConnection from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getVerifiedToken } from '@/lib/auth';

export async function GET(
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
    const connection = await getDbConnection();

    // Get customer info
    const [customerInfo] = await connection.execute<RowDataPacket[]>(
      `SELECT custid, custname FROM customer WHERE custid = ?`,
      [custId]
    );

    // Fetch DIDs for this customer (matching intranet query)
    const [dids] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        a.didno, 
        a.allocateddate, 
        a.purchasedate, 
        b.prodname, 
        a.location,
        a.isdeleted
      FROM dids a
      LEFT JOIN products b ON a.type = b.prodid
      WHERE a.custid = ?
      ORDER BY a.didno`,
      [custId]
    );

    // Fetch products/phones from numberdetails (matching intranet query)
    const [products] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        a.custid, 
        a.number, 
        a.startdate, 
        d.prodname, 
        a.name, 
        a.ip, 
        a.loginid, 
        a.pwd, 
        c.manfname, 
        b.ename, 
        a.mac, 
        a.isdeleted,
        a.invstatus,
        a.comments,
        a.type,
        a.eid
      FROM numberdetails a
      LEFT JOIN equipments b ON a.eid = b.eid
      LEFT JOIN manufacturers c ON b.manfid = c.manfid
      LEFT JOIN products d ON a.type = d.prodid
      WHERE a.custid = ?
      ORDER BY a.number ASC`,
      [custId]
    );

    // Fetch custom VOIP rates
    const [voipRates] = await connection.execute<RowDataPacket[]>(
      `SELECT crid, groupcode, charges, mobilecharges 
       FROM customerratesvoip 
       WHERE custid = ?`,
      [custId]
    );

    // Fetch custom Gamma rates
    const [gammaRates] = await connection.execute<RowDataPacket[]>(
      `SELECT crid, groupcode, charges 
       FROM customerratesgamma 
       WHERE custid = ?`,
      [custId]
    );

    // Fetch available products for dropdown
    const [availableProducts] = await connection.execute<RowDataPacket[]>(
      `SELECT prodid, prodname FROM products WHERE type <> 1 AND NOT isdeleted ORDER BY prodname`
    );

    // Fetch available equipments for dropdown
    const [availableEquipments] = await connection.execute<RowDataPacket[]>(
      `SELECT eid, ename FROM equipments ORDER BY eid`
    );

    // Fetch available VOIP group codes
    const [voipGroupCodes] = await connection.execute<RowDataPacket[]>(
      `SELECT DISTINCT groupcode FROM allrates WHERE groupcode IS NOT NULL AND groupcode != '' ORDER BY groupcode`
    );

    // Fetch available Gamma group codes (ChargeCode is the unique identifier in gamma_rates)
    const [gammaGroupCodes] = await connection.execute<RowDataPacket[]>(
      `SELECT DISTINCT ChargeCode, Destination FROM gamma_rates WHERE ChargeCode IS NOT NULL ORDER BY ChargeCode`
    );

    return NextResponse.json({
      customer: customerInfo.length > 0 ? customerInfo[0] : null,
      dids: dids,
      products: products,
      voipRates: voipRates,
      gammaRates: gammaRates,
      availableProducts: availableProducts,
      availableEquipments: availableEquipments,
      voipGroupCodes: voipGroupCodes,
      gammaGroupCodes: gammaGroupCodes
    }, { status: 200 });

  } catch (error) {
    console.error('Database error (GET customer products):', error);
    return NextResponse.json({ error: 'Failed to fetch customer products', details: String(error) }, { status: 500 });
  }
}
