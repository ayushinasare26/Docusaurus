import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";

// Interface for transformed package option
interface PackageOption {
  value: number;
  label: string;
  type: "basic" | "package";
}

export async function GET(_req: NextRequest) {
  try {
    // Define basic product types
    const basicTypes: PackageOption[] = [
      { value: 0, label: "Others", type: "basic" },
      { value: 1, label: "DID", type: "basic" },
      { value: 2, label: "Access Number", type: "basic" },
      { value: 3, label: "PSTN Line", type: "basic" }
    ];

    // Fetch package options from MySQL
    const packageRows: any = await query(
      'SELECT packageid, packagename FROM packages WHERE packagename IS NOT NULL AND isdeleted = 0 ORDER BY packagename'
    );

    const packageTypes: PackageOption[] = packageRows.map((row: any) => ({
      value: row.packageid,
      label: row.packagename,
      type: "package"
    }));

    // Combine basic types with package types
    const allOptions: PackageOption[] = [...basicTypes, ...packageTypes];

    return NextResponse.json(allOptions, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error: any) {
    console.error('Error in packageOptions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package options' },
      { status: 500 }
    );
  }
}