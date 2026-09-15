import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getVerifiedToken } from '@/lib/auth';

type ColumnInfo = { Field: string };

const ID_CANDIDATES = ['countryid', 'country_id', 'id'];
const NAME_CANDIDATES = ['countryname', 'country_name', 'name', 'country'];
const CODE_CANDIDATES = ['countrycode', 'country_code', 'code', 'iso', 'iso2', 'iso3'];

export async function GET(_req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tableName = 'countries';
    const columns = await query(`SHOW COLUMNS FROM ${tableName}`) as ColumnInfo[];
    const fieldNames = columns.map((c) => c.Field.toLowerCase());

    const idField = ID_CANDIDATES.find((c) => fieldNames.includes(c));
    const nameField = NAME_CANDIDATES.find((c) => fieldNames.includes(c));
    const codeField = CODE_CANDIDATES.find((c) => fieldNames.includes(c));

    if (!idField || !nameField) {
      return NextResponse.json({ error: 'Countries table missing required columns' }, { status: 500 });
    }

    const selectFields = [
      `${idField} as id`,
      `${nameField} as name`,
      codeField ? `${codeField} as code` : null,
    ].filter(Boolean).join(', ');

    const rows = await query(`SELECT ${selectFields} FROM ${tableName} ORDER BY name ASC`);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch countries' }, { status: 500 });
  }
}
