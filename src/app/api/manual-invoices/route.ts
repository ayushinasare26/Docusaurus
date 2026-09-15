import { NextRequest, NextResponse } from "next/server"
import { getVerifiedToken } from "@/lib/auth"

type ManualInvoiceItemPayload = {
  detail: string
  unitPrice: string | number
  ourPrice: string | number
  qty: string | number
}

type PrevInvoiceRow = {
  total: number | null
}

type PaymentSumRow = {
  received: number | null
}

const parseNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function GET(request: NextRequest) {
  const tokenPayload = await getVerifiedToken()
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const upstream = await fetch(`${backendUrl}/api/manual-invoices`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  })
}

export async function POST(req: NextRequest) {
  const tokenPayload = await getVerifiedToken()
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const upstream = await fetch(`${backendUrl}/api/manual-invoices`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body: await req.text(),
  })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  })
}
