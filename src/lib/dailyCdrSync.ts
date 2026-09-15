import { Client, type ConnectConfig } from "ssh2";
import { query } from "@/lib/mysql";

export type SyncTriggerType = "Manual" | "Cron";

export interface DailyCdrInputDid {
  did: string;
}

export interface DailyCdrSyncResult {
  totalRecords: number;
  insertedRecords: number;
  ignoredRecords: number;
  executionTimeMs: number;
  status: "Success" | "Failed";
  errorMessage: string | null;
  targetDate: string;
}

interface CronLogRow {
  id: number;
}

interface ParsedCdrRow {
  calldate: string;
  targetDate: string;
  tenant: string | null;
  did: string | number | null;
  cli: string | null;
  callsource: string | null;
  calldestination: string | null;
  calllocation: string | null;
  callduration: number;
  channel: string | null;
  rawPayload: string;
  dedupeKey: string;
}

interface RateLookupRow {
  dialprefix?: string | null;
  destinationplace?: string | null;
  type?: string | null;
}

const SSH_CONFIG: ConnectConfig = {
  host: (process.env.SSH_BICOM_HOST || process.env.PBXWARE_SSH_HOST || process.env.SSH_HOST || "").trim(),
  port: process.env.SSH_PORT ? Number(process.env.SSH_PORT.trim()) : (process.env.PBXWARE_SSH_PORT ? Number(process.env.PBXWARE_SSH_PORT.trim()) : 22),
  username: (process.env.SSH_USER || process.env.PBXWARE_SSH_USERNAME || process.env.SSH_USERNAME || "").trim(),
  password: (process.env.SSH_PASSWORD || process.env.PBXWARE_SSH_PASSWORD || process.env.PBXWARE_SSH_PASS || "").trim(),
  tryKeyboard: true,
  readyTimeout: 120000,
  keepaliveInterval: 10000,
  keepaliveCountMax: 3,
};

const PBXWARE_MYSQL_WRAPPER = process.env.PBXWARE_MYSQL_WRAPPER || "/opt/pbxware/sh/mysql";
const PBXWARE_MYSQL_USER = process.env.PBXWARE_MYSQL_USER || "root";
const PBXWARE_MYSQL_PASSWORD = process.env.PBXWARE_MYSQL_PASSWORD || "";
const PBXWARE_MYSQL_DATABASE = process.env.PBXWARE_MYSQL_DATABASE || "pbxware";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapDailyCdrSupport() {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.all([
      query(`
        CREATE TABLE IF NOT EXISTS input_dids (
          id INT NOT NULL AUTO_INCREMENT,
          did VARCHAR(50) NOT NULL,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY did (did)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `),
      query(`
        CREATE TABLE IF NOT EXISTS cdr_cron_logs (
          id INT NOT NULL AUTO_INCREMENT,
          executed_at DATETIME NOT NULL,
          target_date DATE NOT NULL,
          status ENUM('Success','Failed') NOT NULL,
          total_records INT DEFAULT '0',
          inserted_records INT DEFAULT '0',
          ignored_records INT DEFAULT '0',
          execution_time_ms INT DEFAULT '0',
          error_message TEXT,
          trigger_type ENUM('Manual','Cron') NOT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `),
    ]).then(() => undefined).catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

void bootstrapDailyCdrSupport();

function getYesterdayUtcDate(): Date {
  const now = new Date();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(utcMidnight - 24 * 60 * 60 * 1000);
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeTargetDate(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || formatUtcDate(date) !== trimmed) return null;
  return trimmed;
}

function formatTargetDate(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeTargetDate(value) ?? null;
  }
  if (value instanceof Date) {
    return formatUtcDate(value);
  }
  return null;
}

function getDailyTableName(targetDate: string): string {
  const [year, month] = targetDate.split("-");
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIndex = Number(month) - 1;
  const monthName = monthIndex >= 0 && monthIndex < monthNames.length ? monthNames[monthIndex] : "jan";
  return `${monthName}${year}`;
}

function escapeSqlLikeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "''");
}

function extractRowsFromBatchOutput(stdout: string): string[][] {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: string[][] = [];
  for (const line of lines) {
    if (line.startsWith("Warning") || line.startsWith("mysql:")) continue;
    if (line.includes("rows in set")) continue;
    rows.push(line.split("\t"));
  }
  return rows;
}

function isHeaderRow(columns: string[]): boolean {
  return columns[0] === "callid" || columns[1] === "channel" || columns[10] === "calldate";
}

function safeInt(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDid(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "\\N" || trimmed.toUpperCase() === "NULL") return null;
  let normalized = trimmed.replace(/\\/g, "");
  if (normalized.startsWith("+")) normalized = normalized.slice(1);
  if (normalized.startsWith("00")) normalized = normalized.slice(2);
  if (normalized.startsWith("0")) normalized = normalized.slice(1);
  normalized = normalized.replace(/\D/g, "");
  return normalized || null;
}

function normalizeNullable(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "\\N" || trimmed.toUpperCase() === "NULL") return null;
  return trimmed;
}

function normalizeDestination(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "0" || trimmed === "\\N" || trimmed.toUpperCase() === "NULL") return null;
  let normalized = trimmed.replace(/\\/g, "");
  if (normalized.startsWith("+")) normalized = normalized.slice(1);
  else if (normalized.startsWith("00")) normalized = normalized.slice(2);
  else if (normalized.startsWith("0")) normalized = `44${normalized.slice(1)}`;
  return normalized || null;
}

function normalizeTenant(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "\\N" || trimmed.toUpperCase() === "NULL") return null;
  return trimmed.startsWith("9") ? `1${trimmed.slice(1)}` : trimmed;
}

function buildCustId(tenant: string | null): string {
  if (!tenant) return "274101100";
  const normalizedTenant = tenant.startsWith("9") ? `1${tenant.slice(1)}` : tenant;
  return `274101${normalizedTenant.replace(/\D/g, "") || "100"}`;
}

function formatCli(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw || raw.toUpperCase() === "NULL") return "<>";
  const start = raw.indexOf("<");
  const end = raw.lastIndexOf(">");
  if (start >= 0 && end > start) {
    return raw.substring(start, end + 1);
  }
  return `<${raw.replace(/^"+|"+$/g, "")}>`;
}

function normalizeRatePrefix(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.split("*", 1)[0].replace(/^\+/, "");
}

function getRateLabel(destination: string, rateRows: RateLookupRow[]): string {
  let best: RateLookupRow | null = null;
  for (const row of rateRows) {
    const prefix = normalizeRatePrefix(row.dialprefix);
    if (!prefix) continue;
    if (destination.startsWith(prefix) && (!best || prefix.length > normalizeRatePrefix(best.dialprefix).length)) {
      best = row;
    }
  }
  return String(best?.destinationplace || "Unknown").trim() || "Unknown";
}

function parseLegacyCdrRow(columns: string[], kind: "Inbound" | "International"): ParsedCdrRow | null {
  if (columns.length < 12 || isHeaderRow(columns)) return null;

  const rawTenant = normalizeNullable(columns[1]);
  const tenant = normalizeTenant(columns[1]);
  const cli = formatCli(columns[2]);
  const rawCallSource = normalizeNullable(columns[3]);
  const rawCallDestination = normalizeNullable(columns[4]);
  const calldate = normalizeNullable(columns[10]);
  if (!calldate) {
    if (kind === "Inbound") console.log("Inbound skip: missing calldate", columns.join("\t"));
    return null;
  }

  if (!rawCallDestination) {
    if (kind === "Inbound") console.log("Inbound skip: missing destination", columns.join("\t"));
    return null;
  }
  if (rawCallDestination === "0" || rawCallDestination === "\\N") {
    if (kind === "Inbound") console.log("Inbound skip: destination zero/null", columns.join("\t"));
    return null;
  }
  if (kind === "Inbound" && rawCallDestination.length <= 5) {
    console.log("Inbound skip: destination too short", rawCallDestination, columns.join("\t"));
    return null;
  }
  if (kind === "International" && rawCallDestination.length <= 3) {
    return null;
  }

  let calldestination = rawCallDestination.replace(/\\/g, "").trim();
  if (calldestination.startsWith("+")) calldestination = calldestination.slice(1);
  if (calldestination.startsWith("00")) calldestination = calldestination.slice(2);
  if (calldestination.startsWith("0")) calldestination = `44${calldestination.slice(1)}`;
  if (!calldestination) return null;

  if (calldestination.length < 5 && tenant && calldestination.startsWith(tenant)) {
    if (kind === "Inbound") console.log("Inbound skip: destination matches tenant short form", calldestination, tenant, columns.join("\t"));
    return null;
  }

  const callsource = rawCallSource ?? rawTenant ?? tenant;
  if (!callsource) {
    if (kind === "Inbound") console.log("Inbound skip: missing callsource", columns.join("\t"));
    return null;
  }

  const channel = normalizeNullable(columns[6]);
  const did = kind === "Inbound" ? (normalizeDid(columns[4]) ?? "0") : "0";
  const targetDate = calldate.slice(0, 10);
  const dedupeKey = [calldate, channel ?? "", calldestination, String(safeInt(columns[11])), String(did)].join("|");

  return {
    calldate,
    targetDate,
    tenant: rawTenant ?? tenant,
    did,
    cli,
    callsource,
    calldestination,
    calllocation: "Unknown",
    callduration: safeInt(columns[11]),
    channel,
    rawPayload: columns.join("\t"),
    dedupeKey,
  };
}

function parseInboundRow(columns: string[]): ParsedCdrRow | null {
  return parseLegacyCdrRow(columns, "Inbound");
}

function parseInternationalRow(columns: string[]): ParsedCdrRow | null {
  return parseLegacyCdrRow(columns, "International");
}

function buildInboundCommand(targetDate: string, dids: string[]) {
  const didClause = dids.length > 0
    ? ` AND did IN (${dids.map((did) => `'${escapeSqlLikeValue(did)}'`).join(", ")})`
    : "";
  return `${PBXWARE_MYSQL_WRAPPER} ${PBXWARE_MYSQL_DATABASE} -B -q -e "SELECT * FROM cdr WHERE calldate >= '${targetDate} 00:00:00' AND calldate <= '${targetDate} 23:59:59' AND disposition = 'ANSWERED' AND tenant <> '899'${didClause}"`;
}

function buildIntlCommand(targetDate: string) {
  return `${PBXWARE_MYSQL_WRAPPER} ${PBXWARE_MYSQL_DATABASE} -B -q -e "SELECT * FROM cdr WHERE calldate >= '${targetDate} 00:00:00' AND calldate <= '${targetDate} 23:59:59' AND disposition = 'Answered' AND tenant <> '900' AND (dstchannel LIKE '%SIPGW-%' OR dstchannel LIKE '%Pilvo_Out%')"`;
}

async function fetchRemoteRows(client: Client, command: string, label: string) {
  console.log(`Executing ${label} Query...`);
  const stdout = await execRemote(client, command);
  const rawRows = extractRowsFromBatchOutput(stdout);
  console.log(`${label} Raw Rows Received:`, rawRows.length);
  return rawRows;
}

function openSshConnection(): Promise<Client> {
  return new Promise((resolve, reject) => {
    if (!SSH_CONFIG.host || !SSH_CONFIG.username) {
      reject(new Error("Missing PBXware SSH configuration"));
      return;
    }

    const client = new Client();
    client
      .on("ready", () => resolve(client))
      .on("error", reject)
      .on("keyboard-interactive", (name, instructions, lang, prompts, finish) => {
        const responses = prompts.map(() => SSH_CONFIG.password || "");
        finish(responses);
      })
      .connect(SSH_CONFIG);
  });
}

function execRemote(client: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.exec(command, { pty: false }, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      stream.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      stream.on("close", (code: number) => {
        if (code !== 0 && !stdout.trim()) {
          reject(new Error(stderr.trim() || `Remote command failed with code ${code}`));
          return;
        }
        resolve(stdout);
      });
    });
  });
}

async function fetchInputDids(): Promise<string[]> {
  const rows = (await query("SELECT did FROM input_dids ORDER BY did ASC")) as DailyCdrInputDid[];
  return rows.map((row) => String(row.did).trim()).filter(Boolean);
}

async function insertCronLog(targetDate: string, triggerType: SyncTriggerType): Promise<number> {
  const result = (await query(
    `INSERT INTO cdr_cron_logs (executed_at, target_date, status, total_records, inserted_records, ignored_records, execution_time_ms, error_message, trigger_type)
     VALUES (NOW(), ?, 'Failed', 0, 0, 0, 0, NULL, ?)`,
    [targetDate, triggerType]
  )) as any;
  return Number(result.insertId);
}

async function updateCronLog(
  id: number,
  result: Pick<DailyCdrSyncResult, "status" | "totalRecords" | "insertedRecords" | "ignoredRecords" | "executionTimeMs" | "errorMessage">
) {
  await query(
    `UPDATE cdr_cron_logs
     SET status = ?, total_records = ?, inserted_records = ?, ignored_records = ?, execution_time_ms = ?, error_message = ?
     WHERE id = ?`,
    [result.status, result.totalRecords, result.insertedRecords, result.ignoredRecords, result.executionTimeMs, result.errorMessage, id]
  );
}

async function insertDailyCdrRows(rows: ParsedCdrRow[], targetDate: string) {
  if (rows.length === 0) return 0;
  const tableName = getDailyTableName(targetDate);

  await query(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`callid\` bigint(20) NOT NULL AUTO_INCREMENT,
      \`channel\` varchar(100),
      \`cli\` varchar(100),
      \`callsource\` varchar(100) NOT NULL,
      \`calldestination\` varchar(100) NOT NULL,
      \`calllocation\` varchar(100) NOT NULL,
      \`calldate\` datetime NOT NULL,
      \`callduration\` int(4) NOT NULL,
      \`surcharge\` float NOT NULL DEFAULT 0,
      \`callcharges\` float NOT NULL,
      \`custid\` int(10) NOT NULL,
      \`estatus\` enum('ON','OFF') NOT NULL,
      \`did\` bigint(20),
      \`incall\` tinyint(1) NOT NULL DEFAULT '0',
      \`providerid\` int(10) NOT NULL,
      \`calltype\` varchar(1) NOT NULL,
      \`gcountrycode\` varchar(8) NOT NULL,
      \`gcitycode\` varchar(8) NOT NULL,
      \`file_type\` varchar(70) NOT NULL,
      \`isgamma\` int(1) NOT NULL DEFAULT '0',
      PRIMARY KEY (\`callid\`),
      UNIQUE KEY \`unique_call_fingerprint\` (\`calldate\`, \`channel\`, \`calldestination\`, \`callduration\`, \`did\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1
  `);

  await query(
    `ALTER TABLE \`${tableName}\` MODIFY COLUMN callid BIGINT(20) NOT NULL AUTO_INCREMENT`
  );

  const beforeRows = (await query(`SELECT COUNT(*) AS count FROM \`${tableName}\``)) as any[];
  const beforeCount = Number(beforeRows?.[0]?.count ?? 0);

  const insertSql = `
    INSERT IGNORE INTO \`${tableName}\`
      (\`callid\`, \`channel\`, \`cli\`, \`callsource\`, \`calldestination\`, \`calllocation\`, \`calldate\`, \`callduration\`, \`surcharge\`, \`callcharges\`, \`custid\`, \`estatus\`, \`did\`, \`incall\`, \`providerid\`, \`calltype\`, \`gcountrycode\`, \`gcitycode\`, \`file_type\`, \`isgamma\`)
    VALUES ?
  `;
  const rateRows = (await query(
    `SELECT dialprefix, destinationplace, type FROM allrates WHERE dialprefix IS NOT NULL AND dialprefix <> '' ORDER BY LENGTH(SUBSTRING_INDEX(dialprefix, '*', 1)) DESC`
  )) as RateLookupRow[];

  const fingerprintCounts = new Map<string, number>();
  const rowsForInsert = rows.map((row) => [
    null,
    row.channel,
    row.cli,
    row.callsource ?? "",
    row.calldestination ?? "",
    row.calldestination ? getRateLabel(row.calldestination, rateRows) : (row.calllocation ?? "Unknown"),
    row.calldate,
    row.callduration,
    0,
    0,
    buildCustId(row.tenant),
    "ON",
    row.did,
    0,
    0,
    "",
    "",
    "",
    "",
    0,
  ]);
  if (rowsForInsert.some((values) => values.length !== 20)) {
    throw new Error("Daily CDR insert row mapping is invalid");
  }

  for (const row of rows) {
    fingerprintCounts.set(row.dedupeKey, (fingerprintCounts.get(row.dedupeKey) ?? 0) + 1);
  }
  const duplicateFingerprints = [...fingerprintCounts.entries()].filter(([, count]) => count > 1);
  if (duplicateFingerprints.length > 0) {
    console.log("Duplicate daily fingerprints detected (calldate|channel|calldestination|callduration|did):", duplicateFingerprints.slice(0, 20));
    for (const [fingerprint] of duplicateFingerprints.slice(0, 5)) {
      const matched = rows.filter((row) => row.dedupeKey === fingerprint).slice(0, 2);
      console.log("Duplicate fingerprint rows:", fingerprint, matched);
    }
  }

  await query(insertSql, [rowsForInsert]);

  const afterRows = (await query(`SELECT COUNT(*) AS count FROM \`${tableName}\``)) as any[];
  const afterCount = Number(afterRows?.[0]?.count ?? beforeCount);

  return Math.max(0, afterCount - beforeCount);
}

export async function runDailyCdrSync(triggerType: SyncTriggerType, targetDateOverride?: string): Promise<DailyCdrSyncResult> {
  const startedAt = Date.now();
  const targetDate = normalizeTargetDate(targetDateOverride) ?? formatUtcDate(getYesterdayUtcDate());
  const cronLogId = await insertCronLog(targetDate, triggerType);

  let client: Client | null = null;
  try {
    const dids = await fetchInputDids();
    client = await openSshConnection();

    const inboundCmd = buildInboundCommand(targetDate, dids);
    const inboundRaw = await fetchRemoteRows(client, inboundCmd, "Inbound");
    const inboundParsed = inboundRaw.map(parseInboundRow).filter((row): row is ParsedCdrRow => Boolean(row));
    console.log("Inbound Valid Rows Parsed:", inboundParsed.length);

    const intlCmd = buildIntlCommand(targetDate);
    const intlRaw = await fetchRemoteRows(client, intlCmd, "Intl");
    const intlParsed = intlRaw.map(parseInternationalRow).filter((row): row is ParsedCdrRow => Boolean(row));
    console.log("Intl Valid Rows Parsed:", intlParsed.length);

    const parsed = [...inboundParsed, ...intlParsed];
    const insertedRecords = await insertDailyCdrRows(parsed, targetDate);
    const ignoredRecords = Math.max(0, parsed.length - insertedRecords);
    const executionTimeMs = Date.now() - startedAt;

    const result: DailyCdrSyncResult = {
      totalRecords: parsed.length,
      insertedRecords,
      ignoredRecords,
      executionTimeMs,
      status: "Success",
      errorMessage: null,
      targetDate,
    };

    await updateCronLog(cronLogId, result);
    return result;
  } catch (error: any) {
    const executionTimeMs = Date.now() - startedAt;
    const errorMessage = error?.message || "Failed to sync daily CDRs";
    await updateCronLog(cronLogId, {
      status: "Failed",
      totalRecords: 0,
      insertedRecords: 0,
      ignoredRecords: 0,
      executionTimeMs,
      errorMessage,
    });
    throw error;
  } finally {
    if (client) client.end();
  }
}

export async function listCronLogs(limit: number, offset: number) {
  const rows = await query(
    `SELECT id, executed_at, target_date, status, total_records, inserted_records, ignored_records, execution_time_ms, error_message, trigger_type
     FROM cdr_cron_logs
     ORDER BY executed_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows as any[];
}

export async function listInputDids() {
  const rows = await query(`SELECT id, did, created_at FROM input_dids ORDER BY did ASC`);
  return rows as any[];
}

export async function getMissingDailySyncDates() {
  const rows = await query(`
    WITH RECURSIVE day_window AS (
      SELECT CAST(DATE_SUB(UTC_DATE(), INTERVAL 30 DAY) AS DATE) AS target_date
      UNION ALL
      SELECT DATE_ADD(target_date, INTERVAL 1 DAY)
      FROM day_window
      WHERE target_date < DATE_SUB(UTC_DATE(), INTERVAL 1 DAY)
    )
    SELECT w.target_date
    FROM day_window w
    LEFT JOIN cdr_cron_logs l
      ON w.target_date = l.target_date
      AND l.status = 'Success'
    WHERE l.target_date IS NULL
    ORDER BY w.target_date ASC
  `);
  return rows as Array<{ target_date: string }>;
}

async function hasSuccessfulDailySync(targetDate: string): Promise<boolean> {
  const rows = (await query(
    `SELECT 1 AS ok
     FROM cdr_cron_logs
     WHERE target_date = ?
       AND status = 'Success'
     LIMIT 1`,
    [targetDate]
  )) as Array<{ ok?: number }>;
  return rows.length > 0;
}

export async function addInputDid(did: string) {
  await query(`INSERT INTO input_dids (did) VALUES (?)`, [did]);
}

export async function deleteInputDid(did: string) {
  await query(`DELETE FROM input_dids WHERE did = ?`, [did]);
}

export async function runDailyCdrSyncBatch(triggerType: SyncTriggerType) {
  const missingDates = await getMissingDailySyncDates();
  const results: Array<{
    targetDate: string;
    status: DailyCdrSyncResult["status"];
    totalRecords: number;
    insertedRecords: number;
    ignoredRecords: number;
    executionTimeMs: number;
    errorMessage: string | null;
  }> = [];

  for (const row of missingDates) {
    const targetDate = formatTargetDate(row.target_date);
    if (!targetDate) {
      results.push({
        targetDate: String(row.target_date),
        status: "Failed",
        totalRecords: 0,
        insertedRecords: 0,
        ignoredRecords: 0,
        executionTimeMs: 0,
        errorMessage: "Invalid target date from gap analysis",
      });
      continue;
    }

    if (await hasSuccessfulDailySync(targetDate)) {
      results.push({
        targetDate,
        status: "Success",
        totalRecords: 0,
        insertedRecords: 0,
        ignoredRecords: 0,
        executionTimeMs: 0,
        errorMessage: null,
      });
      continue;
    }

    try {
      const result = await runDailyCdrSync(triggerType, targetDate);
      results.push({
        targetDate,
        status: result.status,
        totalRecords: result.totalRecords,
        insertedRecords: result.insertedRecords,
        ignoredRecords: result.ignoredRecords,
        executionTimeMs: result.executionTimeMs,
        errorMessage: result.errorMessage,
      });
    } catch (error: any) {
      results.push({
        targetDate,
        status: "Failed",
        totalRecords: 0,
        insertedRecords: 0,
        ignoredRecords: 0,
        executionTimeMs: 0,
        errorMessage: error?.message || "Failed to sync daily CDRs",
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}
