import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const backendUrl = `${backendBaseUrl}/api/logs${params ? "?" + params : ""}`;

  const backendRes = await fetch(backendUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}