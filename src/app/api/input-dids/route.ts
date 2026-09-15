import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken } from "@/lib/auth";
import { addInputDid, deleteInputDid, listInputDids } from "@/lib/dailyCdrSync";

export async function GET() {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dids = await listInputDids();
    return NextResponse.json({ dids });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch DIDs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { did } = await req.json();
    if (!did || !String(did).trim()) {
      return NextResponse.json({ error: "DID is required" }, { status: 400 });
    }

    await addInputDid(String(did).trim());
    return NextResponse.json({ message: "DID added successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add DID" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const tokenPayload = await getVerifiedToken();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const did = searchParams.get("did");
    if (!did) {
      return NextResponse.json({ error: "DID is required" }, { status: 400 });
    }

    await deleteInputDid(did);
    return NextResponse.json({ message: "DID deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete DID" }, { status: 500 });
  }
}
