// import { NextResponse } from 'next/server';
// import fs from 'fs';
// import path from 'path';
// import cdrOperations from '@/lib/cdrOperations';

// export async function POST(request: Request) {
//   try {
//     // Parse the multipart/form-data from the request.
//     const formData = await request.formData();
//     const fileField = formData.get('file');
//     const year = formData.get('year') as string;
//     const month = formData.get('month') as string;

//     if (!fileField || !year || !month) {
//       return NextResponse.json(
//         { error: 'Missing file, year or month' },
//         { status: 400 }
//       );
//     }

//     // The uploaded file comes in as a Web File.
//     if (!(fileField instanceof File)) {
//       return NextResponse.json(
//         { error: 'Invalid file upload' },
//         { status: 400 }
//       );
//     }
//     const fileData = await fileField.arrayBuffer();
//     // Create a temporary uploads directory if needed.
//     const uploadsDir = path.join(process.cwd(), 'uploads');
//     if (!fs.existsSync(uploadsDir)) {
//       fs.mkdirSync(uploadsDir, { recursive: true });
//     }
//     // Use the original file name (or generate a unique name if desired).
//     const originalName = (fileField as File).name;
//     const tempFilePath = path.join(uploadsDir, originalName);
//     fs.writeFileSync(tempFilePath, Buffer.from(fileData));

//     // Process the uploaded file.
//     // cdrOperations expects the file path, year, and a short month string (e.g. "oct")
//     // and writes an output file (e.g. "output_cdr_2023-10.txt") in process.cwd().
//     const processedFileDetails = await cdrOperations(tempFilePath, year, month);

//     // Remove the temporary uploaded file.
//     fs.unlinkSync(tempFilePath);

//     // Move the generated output file to the public folder so it can be downloaded.
//     const publicDir = path.join(process.cwd(), 'public/cdrOutputs');
//     if (!fs.existsSync(publicDir)) {
//       fs.mkdirSync(publicDir, { recursive: true });
//     }
//     const oldPath = path.join(process.cwd(), processedFileDetails.fileName);
//     const newPath = path.join(publicDir, processedFileDetails.fileName);
//     fs.renameSync(oldPath, newPath);

//     // The file will now be served as a static asset.
//     const downloadUrl = `/cdrOutputs/${processedFileDetails.fileName}`;
//     const processedLineCount = processedFileDetails.linesProcessed;

//     return NextResponse.json({ downloadUrl, processedLineCount });
//   } catch (error: any) {
//     console.error('Error in cdrUpload API:', error);
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import cdrOperations from '@/lib/cdrOperations';
import { getVerifiedToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Authenticate
    const tokenPayload = await getVerifiedToken();
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the multipart/form-data from the request.
    const formData = await request.formData();
    const fileField = formData.get('file');
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;

    if (!fileField || !year || !month) {
      return NextResponse.json(
        { error: 'Missing file, year or month' },
        { status: 400 }
      );
    }

    // The uploaded file comes in as a Web File.
    if (!(fileField instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file upload' },
        { status: 400 }
      );
    }
    const fileData = await fileField.arrayBuffer();
    // Create a temporary uploads directory if needed.
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Use the original file name (or generate a unique name if desired).
    const originalName = (fileField as File).name;
    const tempFilePath = path.join(uploadsDir, originalName);
    fs.writeFileSync(tempFilePath, Buffer.from(fileData));

    // Process the uploaded file.
    // cdrOperations expects the file path, year, and a short month string (e.g. "oct")
    // and writes an output file (e.g. "output_cdr_2023-10.txt") in process.cwd().
    const processedFileDetails = await cdrOperations(tempFilePath, year, month);

    // Remove the temporary uploaded file.
    fs.unlinkSync(tempFilePath);

    // Move the generated output file to the public folder so it can be downloaded.
    const publicDir = path.join(process.cwd(), 'public/cdrOutputs');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const oldPath = path.join(process.cwd(), processedFileDetails.fileName);
    const newPath = path.join(publicDir, processedFileDetails.fileName);
    fs.renameSync(oldPath, newPath);

    // The file will now be served as a static asset.
    const downloadUrl = `/cdrOutputs/${processedFileDetails.fileName}`;
    const processedLineCount = processedFileDetails.linesProcessed;

    return NextResponse.json({ downloadUrl, processedLineCount });
  } catch (error: unknown) { // Fix: Replace 'any' with 'unknown'
    console.error('Error in cdrUpload API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}