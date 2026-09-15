"use client";

import React, { useState, useEffect } from 'react';
import { usePageHeading } from '@/context/PageHeadingContext';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { Upload, FileSpreadsheet, RefreshCw, Clock, Database, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ALLRATES_PAGE_SIZE = 10;

function extractHeadersFromText(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headerLine = lines[0];
  return headerLine.split(',').map(h => h.replace(/^\s+|\s+$/g, '').replace(/^"|"$/g, ''));
}

function formatRate(value: any) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? `£${num.toFixed(4)}` : '£0.0000';
}

const ALLRATES_COLUMNS = [
  { key: 'srno', label: 'SR No', align: 'text-start' },
  { key: 'groupcode', label: 'Group Code', align: 'text-start' },
  { key: 'dialprefix', label: 'Dial Prefix', align: 'text-start' },
  { key: 'destinationplace', label: 'Destination Place', align: 'text-start' },
  { key: 'buying', label: 'Buying', align: 'text-end' },
  { key: 'stndcharges', label: 'Standard Charges', align: 'text-end' },
  { key: 'defaultrates', label: 'Default Rates', align: 'text-end' },
  { key: 'conncharges', label: 'Conn Charges', align: 'text-end' },
  { key: 'uk-mobile-5p', label: 'UK Mobile 5p', align: 'text-end' },
  { key: 'onthehill', label: 'On The Hill', align: 'text-end' },
  { key: 'dsg', label: 'DSG', align: 'text-end' },
  { key: 'dsg-client', label: 'DSG Client', align: 'text-end' },
  { key: 'tka', label: 'TKA', align: 'text-end' },
  { key: 'smart', label: 'Smart', align: 'text-end' },
  { key: 'type', label: 'Type', align: 'text-start' },
] as const;

export default function RateComparisonPage() {
  const { setHeading } = usePageHeading();
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [headers1, setHeaders1] = useState<string[]>([]);
  const [headers2, setHeaders2] = useState<string[]>([]);

  const [map1, setMap1] = useState({ country: '', code: '', rate: '' });
  const [map2, setMap2] = useState({ country: '', code: '', rate: '' });

  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [allrates, setAllrates] = useState<any[]>([]);
  const [allratesTotal, setAllratesTotal] = useState(0);
  const [allratesPage, setAllratesPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'allrates'>('results');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPushingToAllrates, setIsPushingToAllrates] = useState(false);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ stndcharges: '', defaultrates: '', conncharges: '' });
  const [isSavingRate, setIsSavingRate] = useState(false);

  useEffect(() => {
    fetchLatestResults();
    fetchAllrates('', 1);
    fetchLastUpdated();
  }, [setHeading]);

  useEffect(() => {
    if (activeTab === 'allrates') {
      fetchAllrates(searchTerm, 1);
    }
  }, [activeTab, searchTerm]);

  async function fetchLatestResults() {
    try {
      const res = await fetch(`/api/rate-comparison/latest-results`);
      const j = await res.json();
      setLatestResults(j.results || []);
    } catch (err) {
      console.error('latest-results fetch failed', err);
    }
  }

  async function fetchAllrates(search = '', page = 1) {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(ALLRATES_PAGE_SIZE));
      params.set('offset', String((page - 1) * ALLRATES_PAGE_SIZE));
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`/api/allrates?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch allrates (${res.status})`);
      }
      const j = await res.json();
      setAllrates(j.results || []);
      setAllratesTotal(typeof j.total === 'number' ? j.total : (j.results || []).length);
      setAllratesPage(page);
      setEditingRateId(null);
    } catch (err) {
      console.error('allrates fetch failed', err);
      setStatus('Failed to load allrates data');
    }
  }

  async function fetchLastUpdated() {
    try {
      const res = await fetch(`/api/rate-comparison/last-updated`);
      const j = await res.json();
      setLastUpdated(j);
    } catch (err) {
      console.error('last-updated fetch failed', err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, which: number) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const headers = extractHeadersFromText(text);
    if (which === 1) {
      setFile1(file);
      setHeaders1(headers);
      setMap1({ country: headers[0] || '', code: headers[1] || '', rate: headers[2] || '' });
    } else {
      setFile2(file);
      setHeaders2(headers);
      setMap2({ country: headers[0] || '', code: headers[1] || '', rate: headers[2] || '' });
    }
  }

  const selectClassName = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  function renderSelect(headers: string[], value: string, onChange: (v: string) => void, label: string) {
    return (
      <div>
        <label className={labelClassName}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className={selectClassName}>
          <option value="">-- select column --</option>
          {headers.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file1 || !file2) {
      setStatus('Please select both files');
      return;
    }
    if (!map1.country || !map1.code || !map1.rate || !map2.country || !map2.code || !map2.rate) {
      setStatus('Please map all three columns for both files');
      return;
    }

    setStatus('Processing...');
    setIsProcessing(true);

    try {
      const form = new FormData();
      form.append('file1', file1);
      form.append('file2', file2);
      const columns = { 
        file1: { country: map1.country, code: map1.code, rate: map1.rate }, 
        file2: { country: map2.country, code: map2.code, rate: map2.rate } 
      };
      form.append('columns', JSON.stringify(columns));

      const resp = await fetch(`/api/rate-comparison/compare-rates`, {
        method: 'POST',
        body: form,
        credentials: 'include'
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setStatus('Server error: ' + txt);
        setIsProcessing(false);
        return;
      }

      await fetchLatestResults();
      await fetchLastUpdated();

      setStatus('Comparison completed successfully!');
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      setStatus('Upload failed: ' + (err as Error).message);
      setIsProcessing(false);
    }
  }

  async function handlePushToAllrates() {
    if (latestResults.length === 0) {
      setStatus('No comparison results found. Run comparison first.');
      return;
    }

    setIsPushingToAllrates(true);
    setStatus('Pushing comparison results to allrates...');

    try {
      const resp = await fetch(`/api/rate-comparison/push-to-allrates`, {
        method: 'POST',
      });

      const data = await resp.json();
      if (!resp.ok) {
        setStatus(`Push failed: ${data?.error || 'Unknown error'}`);
        setIsPushingToAllrates(false);
        return;
      }

      await fetchAllrates(searchTerm, 1);
      setStatus(`Successfully pushed ${data?.pushed ?? 0} rates to allrates`);
      setActiveTab('allrates');
    } catch (err) {
      console.error(err);
      setStatus('Push failed: ' + (err as Error).message);
    } finally {
      setIsPushingToAllrates(false);
    }
  }

  const filteredResults = latestResults.filter(r => 
    !searchTerm || 
    r.Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.DestinationPlace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function beginEditRate(row: any) {
    setEditingRateId(Number(row.srno));
    setEditValues({
      stndcharges: String(row.stndcharges ?? 0),
      defaultrates: String(row.defaultrates ?? 0),
      conncharges: String(row.conncharges ?? 0),
    });
  }

  function cancelEditRate() {
    setEditingRateId(null);
    setEditValues({ stndcharges: '', defaultrates: '', conncharges: '' });
  }

  async function saveRateRow(srno: number) {
    const stndcharges = Number(editValues.stndcharges);
    const defaultrates = Number(editValues.defaultrates);
    const conncharges = Number(editValues.conncharges);

    if (![stndcharges, defaultrates, conncharges].every(Number.isFinite)) {
      setStatus('Please enter valid numeric values for all three editable columns');
      return;
    }

    setIsSavingRate(true);
    try {
      const res = await fetch(`/api/allrates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srno, stndcharges, defaultrates, conncharges }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || 'Failed to update row');
        return;
      }

      setAllrates((prev) => prev.map((row) => (
        Number(row.srno) === srno
          ? {
            ...row,
            stndcharges,
            defaultrates,
            conncharges,
          }
          : row
      )));
      setStatus('Row updated successfully');
      cancelEditRate();
    } catch (err) {
      console.error('Failed to save allrates row:', err);
      setStatus('Failed to update row');
    } finally {
      setIsSavingRate(false);
    }
  }

  const allratesTotalPages = Math.ceil(allratesTotal / ALLRATES_PAGE_SIZE);
  const allratesIndexOfFirstItem = allratesTotal > 0 ? ((allratesPage - 1) * ALLRATES_PAGE_SIZE) + 1 : 0;
  const allratesIndexOfLastItem = Math.min(allratesPage * ALLRATES_PAGE_SIZE, allratesTotal);

  function goToAllratesPage(page: number) {
    if (page < 1 || page > allratesTotalPages) return;
    fetchAllrates(searchTerm, page);
  }

  const tabs = [
    { id: 'results' as const, label: 'Comparison Results', icon: <TrendingUp className="h-4 w-4" />, count: latestResults.length },
    { id: 'allrates' as const, label: 'All Rates (DB)', icon: <Database className="h-4 w-4" />, count: allratesTotal },
  ];

  return (
    <div className="space-y-6">

      {/* Upload Section */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Upload Rate Files
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload two CSV files to compare rates and update the database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File 1 */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-5 hover:border-indigo-400 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="h-8 w-8 text-indigo-500" />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">File 1</h3>
                  {file1 && <p className="text-sm text-gray-500 dark:text-gray-400">{file1.name}</p>}
                </div>
              </div>
              
              <input 
                type="file" 
                accept=".csv,text/csv" 
                onChange={e => handleFileChange(e, 1)} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-400"
              />
              
              {headers1.length > 0 && (
                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Column Mapping</p>
                  {renderSelect(headers1, map1.country, v => setMap1(prev => ({ ...prev, country: v })), 'Country')}
                  {renderSelect(headers1, map1.code, v => setMap1(prev => ({ ...prev, code: v })), 'Code')}
                  {renderSelect(headers1, map1.rate, v => setMap1(prev => ({ ...prev, rate: v })), 'Rate')}
                </div>
              )}
            </div>

            {/* File 2 */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-5 hover:border-indigo-400 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">File 2</h3>
                  {file2 && <p className="text-sm text-gray-500 dark:text-gray-400">{file2.name}</p>}
                </div>
              </div>
              
              <input 
                type="file" 
                accept=".csv,text/csv" 
                onChange={e => handleFileChange(e, 2)} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-500/10 dark:file:text-green-400"
              />
              
              {headers2.length > 0 && (
                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Column Mapping</p>
                  {renderSelect(headers2, map2.country, v => setMap2(prev => ({ ...prev, country: v })), 'Country')}
                  {renderSelect(headers2, map2.code, v => setMap2(prev => ({ ...prev, code: v })), 'Code')}
                  {renderSelect(headers2, map2.rate, v => setMap2(prev => ({ ...prev, rate: v })), 'Rate')}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button 
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run Comparison
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePushToAllrates}
              disabled={isPushingToAllrates || latestResults.length === 0}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPushingToAllrates ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Push to Allrates
                </>
              )}
            </button>
            
            {status && (
              <Badge color={status.includes('error') || status.includes('failed') ? 'error' : status.includes('success') ? 'success' : 'warning'}>
                {status}
              </Badge>
            )}
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.id 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                  }`}>
                    {tab.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'allrates' ? 'Search allrates (dial prefix/destination)...' : 'Search comparison results...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        {activeTab === 'results' && (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Code
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Destination
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-end text-theme-sm dark:text-gray-400">
                    Rate (pence)
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-end text-theme-sm dark:text-gray-400">
                    Extra (pence)
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredResults.length > 0 ? (
                  filteredResults.map((r, i) => (
                    <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="font-mono text-sm font-medium text-gray-800 dark:text-white/90">{r.Code}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{r.DestinationPlace}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-end">
                        <span className="text-gray-600 dark:text-gray-300">{r.Rate_more_expensive_vendor_pence}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-end">
                        <Badge color={parseFloat(r.Extra_pence_added_pence) > 0 ? 'success' : parseFloat(r.Extra_pence_added_pence) < 0 ? 'error' : 'light'}>
                          {r.Extra_pence_added_pence}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={4} className="text-center py-8">
                      <span className="text-gray-500 dark:text-gray-400">No comparison results yet. Upload files to compare.</span>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Allrates Table */}
        {activeTab === 'allrates' && (
          <div>
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {ALLRATES_COLUMNS.map((column) => (
                      <TableCell
                        key={column.key}
                        isHeader
                        className={`whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-theme-sm dark:text-gray-400 ${column.align}`}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {allrates.length > 0 ? (
                    allrates.map((r, i) => (
                      <TableRow key={r.srno || `${r.dialprefix || 'rate'}-${i}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        {ALLRATES_COLUMNS.map((column) => (
                          <TableCell key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.align}`}>
                            {column.key === 'stndcharges' ? (
                              editingRateId === Number(r.srno) ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={editValues.stndcharges}
                                  onChange={(e) => setEditValues((prev) => ({ ...prev, stndcharges: e.target.value }))}
                                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm text-black focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />
                              ) : (
                                <span className="font-medium text-black dark:text-white">{formatRate(r.stndcharges)}</span>
                              )
                            ) : column.key === 'defaultrates' ? (
                              editingRateId === Number(r.srno) ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={editValues.defaultrates}
                                  onChange={(e) => setEditValues((prev) => ({ ...prev, defaultrates: e.target.value }))}
                                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm text-black focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />
                              ) : (
                                <span className="text-black dark:text-white">{formatRate(r.defaultrates)}</span>
                              )
                            ) : column.key === 'conncharges' ? (
                              editingRateId === Number(r.srno) ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={editValues.conncharges}
                                  onChange={(e) => setEditValues((prev) => ({ ...prev, conncharges: e.target.value }))}
                                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm text-black focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />
                              ) : (
                                <span className="text-black dark:text-white">{formatRate(r.conncharges)}</span>
                              )
                            ) : column.key === 'buying' ? (
                              <span className="text-black dark:text-white">{formatRate(r.buying)}</span>
                            ) : column.key === 'srno' ? (
                              <span className="font-mono text-sm font-medium text-black dark:text-white">{r.srno ?? '-'}</span>
                            ) : column.key === 'groupcode' ? (
                              <span className="font-mono text-sm font-medium text-black dark:text-white">{r.groupcode || '-'}</span>
                            ) : column.key === 'dialprefix' ? (
                              <span className="font-mono text-sm font-medium text-black dark:text-white">{r.dialprefix || '-'}</span>
                            ) : column.key === 'destinationplace' ? (
                              <span className="text-black dark:text-white">{r.destinationplace || '-'}</span>
                            ) : column.key === 'uk-mobile-5p' ? (
                              <span className="text-black dark:text-white">{formatRate(r['uk-mobile-5p'])}</span>
                            ) : column.key === 'onthehill' ? (
                              <span className="text-black dark:text-white">{formatRate(r.onthehill)}</span>
                            ) : column.key === 'dsg' ? (
                              <span className="text-black dark:text-white">{formatRate(r.dsg)}</span>
                            ) : column.key === 'dsg-client' ? (
                              <span className="text-black dark:text-white">{formatRate(r['dsg-client'])}</span>
                            ) : column.key === 'tka' ? (
                              <span className="text-black dark:text-white">{formatRate(r.tka)}</span>
                            ) : column.key === 'smart' ? (
                              <span className="text-black dark:text-white">{formatRate(r.smart)}</span>
                            ) : column.key === 'type' ? (
                              <span className="text-black dark:text-white">{r.type || '-'}</span>
                            ) : null}
                          </TableCell>
                        ))}
                        <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                          {editingRateId === Number(r.srno) ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => saveRateRow(Number(r.srno))}
                                disabled={isSavingRate}
                                className="inline-flex items-center rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isSavingRate ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditRate}
                                disabled={isSavingRate}
                                className="inline-flex items-center rounded bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => beginEditRate(r)}
                              className="inline-flex items-center rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                              Edit
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <td colSpan={ALLRATES_COLUMNS.length + 1} className="text-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">No rates found in the database</span>
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium">{allratesIndexOfFirstItem}</span> to <span className="font-medium">{allratesIndexOfLastItem}</span> of <span className="font-medium">{allratesTotal}</span> results
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => goToAllratesPage(allratesPage - 1)}
                  disabled={allratesPage === 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, allratesTotalPages) }, (_, i) => {
                  let pageNum;
                  if (allratesTotalPages <= 5) {
                    pageNum = i + 1;
                  } else if (allratesPage <= 3) {
                    pageNum = i + 1;
                  } else if (allratesPage >= allratesTotalPages - 2) {
                    pageNum = allratesTotalPages - 4 + i;
                  } else {
                    pageNum = allratesPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToAllratesPage(pageNum)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded ${allratesPage === pageNum
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'border border-gray-200 bg-white text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToAllratesPage(allratesPage + 1)}
                  disabled={allratesPage === allratesTotalPages || allratesTotalPages === 0}
                  className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
