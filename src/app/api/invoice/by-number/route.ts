import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceno = searchParams.get("invoiceno");
    const custid = searchParams.get("custid");

    if (!invoiceno || !custid) {
      return NextResponse.json(
        { error: "invoiceno and custid parameters are required" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/invoice/by-number?invoiceno=${encodeURIComponent(invoiceno)}&custid=${encodeURIComponent(custid)}`;
    
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
