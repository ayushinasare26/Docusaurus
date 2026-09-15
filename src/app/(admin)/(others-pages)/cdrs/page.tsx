'use client';
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../layout';

// import axios from "axios";

interface UploadHistory {
  filename: string;
  file_type: string;
  uploaddate: string;
  record_count: number;
}

export default function CDRImportForm() {
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  // const [countOfRecords, setCountOfRecords] = useState<number>(0);
const setCountOfRecords = useState<number | null>(0)[1];

  // Gamma IPDC Upload State
  const [gammaFileType, setGammaFileType] = useState<string>('IPDC');
  const [gammaSelectedFile, setGammaSelectedFile] = useState<File | null>(null);
  const [gammaIsUploading, setGammaIsUploading] = useState<boolean>(false);
  const [gammaUploadResult, setGammaUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [gammaUploadHistory, setGammaUploadHistory] = useState<UploadHistory[]>([]);
  const gammaFileInputRef = useRef<HTMLInputElement>(null);
  const [gammaMonth, setGammaMonth] = useState<string>('');
  const [gammaYear, setGammaYear] = useState<string>('');

  // Generate years from current year back to 2000
  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  const months = [
    { value: '01', name: 'January', short: 'jan' },
    { value: '02', name: 'February', short: 'feb' },
    { value: '03', name: 'March', short: 'mar' },
    { value: '04', name: 'April', short: 'apr' },
    { value: '05', name: 'May', short: 'may' },
    { value: '06', name: 'June', short: 'jun' },
    { value: '07', name: 'July', short: 'jul' },
    { value: '08', name: 'August', short: 'aug' },
    { value: '09', name: 'September', short: 'sep' },
    { value: '10', name: 'October', short: 'oct' },
    { value: '11', name: 'November', short: 'nov' },
    { value: '12', name: 'December', short: 'dec' },
  ];

  // Fetch Gamma upload history on mount
  useEffect(() => {
    fetchGammaUploadHistory();
  }, []);

  const fetchGammaUploadHistory = async () => {
    try {
      const response = await fetch(`/api/gamma-ipdc/upload-history`);
      if (response.ok) {
        const data = await response.json();
        setGammaUploadHistory(data);
      }
    } catch (error) {
      console.error('Error fetching gamma upload history:', error);
    }
  };

  const handleGammaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setGammaUploadResult({ success: false, message: 'Please select a CSV file' });
        return;
      }
      setGammaSelectedFile(file);
      setGammaUploadResult(null);
    }
  };

  const handleGammaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gammaSelectedFile) {
      setGammaUploadResult({ success: false, message: 'Please select a file to upload' });
      return;
    }

    if (!gammaMonth || !gammaYear) {
      setGammaUploadResult({ success: false, message: 'Please select month and year' });
      return;
    }

    setGammaIsUploading(true);
    setGammaUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('uploadFile', gammaSelectedFile);
      formData.append('fileType', gammaFileType);
      formData.append('month', gammaMonth);
      formData.append('year', gammaYear);

      const response = await fetch(`/api/gamma-ipdc/upload-ipdc`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setGammaUploadResult({
          success: true,
          message: `${data.message} - ${data.rowsInserted} records inserted`,
        });
        setGammaSelectedFile(null);
        if (gammaFileInputRef.current) {
          gammaFileInputRef.current.value = '';
        }
        fetchGammaUploadHistory();
      } else {
        setGammaUploadResult({
          success: false,
          message: data.error || 'Upload failed',
        });
      }
    } catch (error) {
      console.error('Gamma upload error:', error);
      setGammaUploadResult({
        success: false,
        message: 'Failed to upload file. Please try again.',
      });
    } finally {
      setGammaIsUploading(false);
    }
  };

  const handleGammaCancel = () => {
    setGammaSelectedFile(null);
    setGammaUploadResult(null);
    if (gammaFileInputRef.current) {
      gammaFileInputRef.current.value = '';
    }
  };


  // const [recordCount, setRecordCount] = useState(null);

  // const handleFetchData = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!year || !month) return;

  //   setIsLoading(true);
  //   setError('');
  //   setProgressMessage('Fetching data...');

  //   try {
  //     const response = await fetch(`/api/db/get_count?month=${month}&year=${year}`);
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch data');
  //     }

  //     const data = await response.json();
  //     // FIX: Use the correct state setter function for the variable you want to display
  //     setCountOfRecords(data.count); 
  //     setProgressMessage(`Data fetched successfully! Count: ${data.count}`);
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     setError('Could not retrieve data from server');
  //     setCountOfRecords(null); // Reset count on error
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const [numbers, setNumbers] = useState("");

  // const handleSubmitforInternational = async () => {
  //   try {
  //     const didsArray = numbers.split(",").map(num => num.trim());

  //     const res = await axios.post(`http://localhost:8000/api/getInternationalCDRs?month=${month}&year=${year}`, {
  //       dids: didsArray
  //     });

  //     console.log("Count result:", res.data);
  //   } catch (err) {
  //     console.error("Error:", err);
  //   }
  // };


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!year || !month) return;

  //   const didsArray = numbers.split(",").map(num => num.trim());

  //   setIsLoading(true);
  //   setProgress(0);
  //   setProgressMessage('Initializing export...');
  //   setError('');

  //   try {

  //     const didsQuery = encodeURIComponent(JSON.stringify(didsArray));
  //     // Create an EventSource connection to listen for progress updates
  //     const eventSource = new EventSource(`/api/ssh-cdr?year=${year}&month=${month}&dids=${didsQuery}`);

  //     eventSource.onmessage = (event) => {
  //       const data = JSON.parse(event.data);

  //       if (data.progress) {
  //         setProgress(data.progress);
  //       }

  //       if (data.message) {
  //         setProgressMessage(data.message);
  //       }

  //       if (data.error) {
  //         setError(data.error);
  //         setIsLoading(false);
  //         eventSource.close();
  //       }

  //       if (data.downloadUrl) {
  //         setProgressMessage('Downloading file...');
  //         setProgress(100);

  //         // Trigger download
  //         const link = document.createElement('a');
  //         link.href = data.downloadUrl;
  //         link.download = `cdr_${year}-${month}.txt`;
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);

  //         eventSource.close();
  //         setIsLoading(false);
  //       }
  //     };

  //     eventSource.onerror = () => {
  //       setError('Connection to server was interrupted');
  //       setIsLoading(false);
  //       eventSource.close();
  //     };
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //     setError('Failed to start export process');
  //     setIsLoading(false);
  //   }
  // };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!year || !month) return;

  const didsArray = numbers.split(",").map(num => num.trim());

  setIsLoading(true);
  setProgress(0);
  setProgressMessage('Initializing export...');
  setError('');

  const startTime = Date.now();
  let completedSuccessfully = false;

  try {
    const didsQuery = didsArray.map(did => `dids=${encodeURIComponent(did)}`).join("&");
    const eventSource = new EventSource(`/api/ssh-cdr?year=${year}&month=${month}&${didsQuery}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.progress) setProgress(data.progress);
      if (data.message) setProgressMessage(data.message);
      
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        eventSource.close();
        return;
      }
      
      if (data.downloadUrl) {
        completedSuccessfully = true;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        setProgressMessage(`Complete! Download ready (took ${elapsed}s)`);
        setProgress(100);
        
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `cdr_${year}-${month}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        eventSource.close();
        setIsLoading(false);
        return;
      }
      console.log(data)
      // Close connection if we get a 'done' or 'complete' signal or success message
      if (data.status === 'complete' || data.done) {
        completedSuccessfully = true;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const msg = data.message || `Process complete (took ${elapsed}s)`;
        setProgressMessage(`${msg} (took ${elapsed}s)`);
        eventSource.close();
        setIsLoading(false);
        return;
      }
    };

    eventSource.onerror = () => {
      if (!completedSuccessfully) {
        setError('Connection to server was interrupted');
      }
      setIsLoading(false);
      eventSource.close();
    };
  } catch (error) {
    console.error('Export failed:', error);
    setError('Failed to start export process');
    setIsLoading(false);
  }
};


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (!month || !year) {
      setError("Please select both month and year before uploading file.");
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      console.log("Uploaded file:", file);
      opearateOnUploadedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!month || !year) {
      setError("Please select both month and year before uploading file.");
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      console.log("Dropped file:", file);
      opearateOnUploadedFile(file);
    }
  };

  async function opearateOnUploadedFile(file: File) {
    console.log("Selected file:", file);
    if (!month || !year) {
      setError("Please select both month and year before uploading file.");
      return;
    }
    const shortMonth = months.find(m => m.value === month)?.short;
    // Use FormData to send file and additional fields to the server
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", year);
    formData.append("month", shortMonth || month);

    const startTime = Date.now();

    try {
      setIsLoading(true);
      setProgressMessage('Uploading and processing file...');
      const res = await fetch('/api/cdrUpload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      console.log("Server response:", result);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        // const countOfRecords = result.processedLineCount || 0;
        setCountOfRecords(result.processedLineCount || 0);
        setProgressMessage(`Processing complete in ${elapsed}s. Downloading file...`);
        // Trigger download if a URL is returned
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `cdr_${year}-${month}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setProgress(100);
      setIsLoading(false);
    }
    catch (error: unknown) {
      console.error('File upload failed:', error);
      setError('Failed to upload file');
      setIsLoading(false);
    }
  }


  return (
   
      <div className="container mx-auto relative overflow-hidden">
        <p className="mb-6 text-md text-gray-700 font-medium overflow-hidden">
          You can process the monthly CDR here to generate the bills
        </p>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative overflow-hidden">
            {/* Left Column – Export Form */}
            <div className="pr-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                Import CDR Data
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dids" className="block text-sm font-medium text-gray-700 mb-2">
                    DIDs for International Call <span className="text-red-500">*</span>
                  </label>
                        <input
                          type="text"
                          placeholder="Enter DIDs (comma separated)"
                          value={numbers}
                          onChange={e => setNumbers(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm font-medium border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {isLoading ? 'Importing...' : 'Import CDR Data'}
                </button>
              </form>
            </div>

            {/* Divider with "or" */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <div className="h-40 w-px bg-gray-300"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 text-gray-500 font-medium rounded-full border border-gray-300">
                or
              </div>
            </div>

            {/* Mobile divider - only visible on small screens */}
            <div className="md:hidden flex items-center my-6 w-full">
              <div className="flex-grow h-px bg-gray-300"></div>
              <div className="px-4 text-gray-500 font-medium">or</div>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Right Column – File Upload */}
            <div className="pl-0 md:pl-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                Upload CDR File
              </h2>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition h-48"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 0V8m0 4h4m-4 0H8m2 10a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Drag and drop your CDR file here<br />
                  or click to upload from your computer
                </p>

                <input
                  id="fileUpload"
                  type="file"
                  accept=".csv,.cdr,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById('fileUpload')?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{progressMessage}</span>
                <span className="text-sm font-medium text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

      {/* Display the progress message or error */}
      {progressMessage && (
        <div className="mt-4 p-3 bg-blue-100 rounded-md border border-blue-300 text-sm text-blue-700">
          {progressMessage}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-100 rounded-md border border-red-300 text-sm text-red-700">
          Error: {error}
        </div>
      )}


        </div>

        {/* Gamma CDR IPDC Upload Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            Gamma CDR Upload (IPDC)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Upload Form */}
            <div>
              <form onSubmit={handleGammaUpload} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gammaYear}
                      onChange={(e) => setGammaYear(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gammaMonth}
                      onChange={(e) => setGammaMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gammaFileType}
                    onChange={(e) => setGammaFileType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="IPDC">IPDC</option>
                    <option value="IDA">IDA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {gammaFileType} CSV File <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={gammaFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleGammaFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      cursor-pointer"
                  />
                  {gammaSelectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {gammaSelectedFile.name} ({(gammaSelectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                {gammaUploadResult && (
                  <div
                    className={`p-3 rounded-md text-sm font-medium border ${
                      gammaUploadResult.success
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {gammaUploadResult.message}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={gammaIsUploading || !gammaSelectedFile}
                    className={`py-2 px-6 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      gammaIsUploading || !gammaSelectedFile
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {gammaIsUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGammaCancel}
                    className="py-2 px-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Upload History */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Uploads</h3>
              {gammaUploadHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                  No upload history found
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gammaUploadHistory.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 truncate max-w-[150px]" title={item.filename}>
                            {item.filename}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {item.file_type}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {item.uploaddate}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {item.record_count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

<div>

{/* <div>      
      <button
        onClick={handleSubmitforInternational}
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
</div> */}

    </div>


        {/* <div>
          <span>data = {countOfRecords}</span>
        </div> */}
      </div>
  );

}