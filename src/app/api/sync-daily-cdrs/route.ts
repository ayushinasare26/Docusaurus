import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";
import { runDailyCdrSync, runDailyCdrSyncBatch } from "@/lib/dailyCdrSync";

export const runtime = "nodejs";
export const maxDuration = 1800;

function hasCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";
  return Boolean(expected) && auth === expected;
}

export async function POST(req: NextRequest) {
  const allowedBySecret = hasCronSecret(req);
  const tokenPayload = allowedBySecret ? true : await getVerifiedToken();

  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const triggerType = body?.trigger_type === "Cron" || body?.triggerType === "Cron" ? "Cron" : "Manual";
    const targetDate = typeof body?.targetDate === "string" ? body.targetDate : undefined;
    if (triggerType === "Cron" && !targetDate) {
      const results = await runDailyCdrSyncBatch("Cron");
      return NextResponse.json({ message: "Daily CDR smart sync completed", results });
    }

    const result = await runDailyCdrSync(triggerType, targetDate);
    return NextResponse.json({ message: "Daily CDR sync completed", result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync daily CDRs" },
      { status: 500 }
    );
  }
}
