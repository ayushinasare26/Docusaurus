// lib/cdrOperations.ts
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export default async function cdrOperations(filePath: string, year: string, month: string) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const tableName = `${month}${year}`;
    console.log(`Table Name: ${tableName}`);
    
    const outputTemplate = `INSERT INTO \`pgsl_dev\`.\`${tableName}\` (\`callid\`, \`cli\`, \`callsource\`, \`calldestination\`, \`calllocation\`, \`calldate\`, \`callduration\`, \`callcharges\`, \`custid\`, \`estatus\`, \`channel\`, \`DID\`) VALUES (null,`;
    const outputFileName = `output_cdr_${year}-${month}.txt`;
    const outputFilePath = path.join(process.cwd(), outputFileName);
    const stream = fs.createWriteStream(outputFilePath);

    let linesProcessed = 0;
    for await (const line of rl) {
      if (!line.trim()) continue; // skip empty lines

      const arrayOfParams = line.split('|');

      // Process tenant to generate custId
      let tenant = arrayOfParams[1].trim();
      if (tenant.startsWith('9')) {
        tenant = tenant.trim().replace('9', '1');
    }
      const custId = `274101${tenant}`;

      // Extract and validate CLI field
      const cli = arrayOfParams[2].trim().substring(arrayOfParams[2].indexOf("<") - 1, arrayOfParams[2].lastIndexOf(">") + 1);
      
      const callSource = arrayOfParams[3].trim();

      let callDst = arrayOfParams[4].trim();
      // Skip record if call destination is not valid.
      if (callDst === '0' || callDst === '\N' || callDst.length <= 5) {
         continue;
      }
      
      // Normalize call destination
      callDst = callDst.replace(/\\/g, '').trim();
      if (callDst.startsWith('+')) {
        callDst = callDst.slice(1);
      } else if (callDst.startsWith('00')) {
        callDst = callDst.slice(2);
      } else if (callDst.startsWith('0')) {
        callDst = '44' + callDst.slice(1);
      }

      const callLocation = "unknown";

      // Format call date from expected format "2023-07-01 01:19:57"
      const callDate = arrayOfParams[10].trim().substring(0, 10).replace(/-/g, '/') + " " + arrayOfParams[10].trim().substring(12, 20).replace(/:/g, '-');

      const callDuration = arrayOfParams[11].trim();
      const callCharges = '0';
      const estatus = 'ON';
      const channel = arrayOfParams[6].trim();
      const did = 0;
      
      const finalOutput = outputTemplate +
        `"${cli}",'${callSource}','${callDst}','${callLocation}','${callDate}','${callDuration}','${callCharges}','${custId}','${estatus}','${channel}',${did});\n`;
      
      stream.write(finalOutput);
      // console.log('Processed line output:', finalOutput);
      linesProcessed++;
    }
    
    // Close the stream and wait until all data is flushed.
    stream.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    console.log(`File written to ${outputFileName} with ${linesProcessed} records processed`);

    const processedFileDetails = {
      fileName: outputFileName? outputFileName : "output_cdr.txt",
      linesProcessed: linesProcessed? linesProcessed : 0,
    }
    
    return processedFileDetails;
  } catch (err) {
    console.error("Error processing CDR operations:", err);
    throw err;
  }
}
