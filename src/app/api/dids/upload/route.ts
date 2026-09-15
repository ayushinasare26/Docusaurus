import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const backendUrl = `${backendBaseUrl}/api/upload`;

  // Forward the file upload as-is to the backend
  const formData = await req.formData();

  // Convert FormData to fetch-compatible body
  const backendRes = await fetch(backendUrl, {
    method: "POST",
    body: formData,
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}