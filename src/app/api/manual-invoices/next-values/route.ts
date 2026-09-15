import { NextRequest, NextResponse } from "next/server"
import { getVerifiedToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const tokenPayload = await getVerifiedToken()
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const custid = req.nextUrl.searchParams.get("custid")
    if (!custid) {
      return NextResponse.json({ error: "custid is required" }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const upstream = await fetch(`${backendUrl}/api/manual-invoices/next-values?custid=${encodeURIComponent(custid)}`, {
      headers: { cookie: req.headers.get("cookie") || "" },
      cache: "no-store",
    })

    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    })
  } catch (error: any) {
    console.error("Error generating next manual invoice values:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch manual invoice values" },
      { status: 500 },
    )
  }
}
