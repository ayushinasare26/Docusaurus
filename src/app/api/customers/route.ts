import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";

const getBackendBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "http://localhost:8000"
  );
};

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const backendBaseUrl = getBackendBaseUrl();
    const backendUrl = new URL("/api/customers", backendBaseUrl);
    req.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const backendBaseUrl = getBackendBaseUrl();
    const backendUrl = new URL("/api/customers", backendBaseUrl);
    const body = await req.json();

    const response = await fetch(backendUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error saving customer:", error);
    return NextResponse.json({ error: error.message || "Failed to save customer" }, { status: 500 });
  }
}
