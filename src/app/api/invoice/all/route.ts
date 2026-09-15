import { NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    if (!month) {
      return NextResponse.json(
        { error: "month parameter is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/invoice/all?month=${encodeURIComponent(month)}&limit=${limit}&offset=${offset}`;

    const response = await fetch(backendUrl);

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
