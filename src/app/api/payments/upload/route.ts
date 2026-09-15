import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|txt|xls|xlsx)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV, TXT, XLS, or XLSX file." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Create FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendUrl = `${BACKEND_URL}/api/payments/upload`;
    console.log('Calling backend URL:', backendUrl);

    // Forward to backend
    const response = await fetch(backendUrl, {
      method: "POST",
      body: backendFormData,
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', response.headers);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // If not JSON, get text to see what backend returned
      const text = await response.text();
      console.log('Backend response text:', text);
      throw new Error(`Backend returned non-JSON response: ${text}`);
    }

    console.log('Backend result:', result);

    if (!response.ok) {
      throw new Error(result.error || result.message || `Backend responded with status: ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Payment file uploaded successfully",
      data: result.data || null,
      inserted: result.inserted || 0
    });

  } catch (error) {
    console.error("Payment upload error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to upload payment file",
        success: false 
      },
      { status: 500 }
    );
  }
}