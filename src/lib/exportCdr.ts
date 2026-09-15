import { query } from "@/lib/mysql";

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export type ExportCustomer = {
  custid: number;
  custname: string;
};

function parseUtcDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getMonthTableName(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]}${date.getUTCFullYear()}`;
}

export function getMonthTableNamesBetween(startDate: string, endDate: string): string[] {
  const start = parseUtcDate(startDate);
  const end = parseUtcDate(endDate);
  if (!start || !end || start > end) return [];

  const tables: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= endCursor) {
    tables.push(getMonthTableName(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return tables;
}

export function normalizeExportDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = parseUtcDate(value);
  return parsed ? formatUtcDate(parsed) : null;
}

export async function listExportCustomers() {
  const rows = await query(
    `SELECT custid, custname
     FROM customer
     WHERE COALESCE(isSuspended, 0) = 0
     ORDER BY custname ASC`
  );
  return rows as ExportCustomer[];
}

export async function buildExportRows(params: {
  startDate: string;
  endDate: string;
  custids?: number[];
}) {
  const tableNames = getMonthTableNamesBetween(params.startDate, params.endDate);
  if (tableNames.length === 0) return [];

  const start = parseUtcDate(params.startDate);
  const end = parseUtcDate(params.endDate);
  if (!start || !end || start > end) return [];

  const startBound = `${params.startDate} 00:00:00`;
  const endBound = `${params.endDate} 23:59:59`;
  const customerClause = params.custids && params.custids.length > 0 ? ` AND custid IN (${params.custids.map(() => "?").join(",")})` : "";
  const customerParams = params.custids && params.custids.length > 0 ? params.custids : [];

  const existingTables: string[] = [];
  for (const tableName of tableNames) {
    const tableRows = (await query(`SHOW TABLES LIKE ?`, [tableName])) as any[];
    if (Array.isArray(tableRows) && tableRows.length > 0) {
      existingTables.push(tableName);
    }
  }

  if (existingTables.length === 0) return [];

  const unionSql = existingTables
    .map((tableName) => `SELECT * FROM \`${tableName}\` WHERE calldate >= ? AND calldate <= ?${customerClause}`)
    .join(" UNION ALL ");

  const sql = `${unionSql} ORDER BY calldate ASC`;
  const paramsList: Array<string | number> = [];
  for (const _ of existingTables) {
    paramsList.push(startBound, endBound, ...customerParams);
  }

  const rows = await query(sql, paramsList);
  return rows as Record<string, any>[];
}

export function rowsToCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);

  const formatCsvValue = (header: string, value: any) => {
    let text = "";
    if (value instanceof Date) {
      text = value.toISOString().replace("T", " ").slice(0, 19);
      if (header === "calldate") text += " UTC";
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const d = new Date(value);
      text = Number.isNaN(d.getTime()) ? value : d.toISOString().replace("T", " ").slice(0, 19);
      if (header === "calldate" && !text.endsWith(" UTC")) text += " UTC";
    } else if (typeof value === "string") {
      text = value;
    } else if (value == null) {
      text = "";
    } else {
      text = String(value);
    }
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => formatCsvValue(header, row[header])).join(","));
  }
  return lines.join("\n");
}
