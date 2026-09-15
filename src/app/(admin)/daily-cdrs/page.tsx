"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

type DidRow = {
  id: number;
  did: string;
  created_at: string;
};

type CronLogRow = {
  id: number;
  executed_at: string;
  target_date: string;
  status: "Success" | "Failed";
  total_records: number;
  inserted_records: number;
  ignored_records: number;
  execution_time_ms: number;
  trigger_type: "Manual" | "Cron";
  error_message: string | null;
};

const PAGE_SIZE = 10;

function statusClass(status: CronLogRow["status"]) {
  switch (status) {
    case "Success":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20";
    case "Failed":
      return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20";
  }
}

function friendlyDidError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("duplicate entry") || lower.includes("input_dids.did")) {
    return "One or more DIDs already exist in the list.";
  }
  if (lower.includes("did is required")) {
    return "Enter at least one DID.";
  }
  return "Unable to save DID(s). Please check the values and try again.";
}

function friendlySyncError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("timed out")) {
    return "Sync started too slowly. Please try again.";
  }
  return "Sync failed. Please try again.";
}

export default function DailyCdrsPage() {
  const [dids, setDids] = useState<DidRow[]>([]);
  const [didInput, setDidInput] = useState("");
  const [didLoading, setDidLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [cronLogs, setCronLogs] = useState<CronLogRow[]>([]);
  const [cronPage, setCronPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DidRow | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const loadDids = async () => {
    const res = await fetch("/api/input-dids");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load DIDs");
    setDids(json.dids || []);
  };

  const loadCronLogs = async (page: number) => {
    const res = await fetch(`/api/cron-logs?page=${page}&limit=${PAGE_SIZE}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load cron logs");
    setCronLogs(json.logs || []);
    setHasMoreLogs((json.logs || []).length === PAGE_SIZE);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadDids(), loadCronLogs(1)]);
      } catch (err: any) {
        setError(err.message || "Failed to initialize page");
      }
    })();
  }, []);

  const handleAddDid = async () => {
    const parsedDids = didInput
      .split(",")
      .map((did) => did.trim())
      .filter(Boolean);
    if (!parsedDids.length) {
      setError("Enter at least one DID.");
      return;
    }
    setDidLoading(true);
    setError("");
    setSuccess("");
    try {
      for (const did of parsedDids) {
        const res = await fetch("/api/input-dids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ did }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to add DID");
      }
      setDidInput("");
      setSuccess(parsedDids.length === 1 ? "DID added successfully." : "DIDs added successfully.");
      await loadDids();
    } catch (err: any) {
      setError(friendlyDidError(err.message || ""));
    } finally {
      setDidLoading(false);
    }
  };

  const handleDeleteDid = async () => {
    if (!deleteTarget) return;
    setDidLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/input-dids?did=${encodeURIComponent(deleteTarget.did)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete DID");
      setSuccess(json.message || "DID deleted");
      setDeleteTarget(null);
      await loadDids();
    } catch (err: any) {
      setError("Unable to delete DID. Please try again.");
    } finally {
      setDidLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/sync-daily-cdrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_type: "Manual" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setSuccess("Yesterday's CDRs synced successfully");
      await loadCronLogs(cronPage);
    } catch (err: any) {
      setError(friendlySyncError(err.message || ""));
    } finally {
      setSyncLoading(false);
    }
  };

  const goPrev = async () => {
    if (cronPage <= 1) return;
    const nextPage = cronPage - 1;
    setCronPage(nextPage);
    await loadCronLogs(nextPage);
  };

  const goNext = async () => {
    if (!hasMoreLogs) return;
    const nextPage = cronPage + 1;
    setCronPage(nextPage);
    await loadCronLogs(nextPage);
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8">
      {(error || success) && (
        <div className="flex items-start gap-3 rounded-[16px] border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
          <div className="flex-1">
            <span className={error ? "text-red-600 dark:text-red-300" : "text-indigo-700 dark:text-indigo-200"}>
              {error || success}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
            className="text-indigo-500 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-indigo-500/10 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white/90">Add DID</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter one or more DIDs, separated by commas.</p>
            </div>
            <Button onClick={handleSync} disabled={syncLoading} className="h-11 shrink-0 bg-indigo-600 px-5 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500">
              <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
              {syncLoading ? "Syncing..." : "Sync Yesterday's CDRs"}
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={didInput}
              onChange={(e) => setDidInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDid();
                }
              }}
              placeholder="Enter one or more DIDs"
              className="h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200"
            />
            <Button onClick={handleAddDid} disabled={didLoading} className="h-12 bg-indigo-600 px-5 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500">
              <Plus className="h-4 w-4" />
              Add DID
            </Button>
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-indigo-500/10 dark:bg-white/[0.03]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white/90">International DID List</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active filters used by the daily sync.</p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{dids.length} total</span>
          </div>

          <div className="mt-6 max-h-[420px] overflow-auto rounded-[16px] border border-slate-200 dark:border-indigo-500/10">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-indigo-50/95 backdrop-blur dark:bg-indigo-500/10">
                <TableRow>
                  <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                    DID
                  </TableCell>
                  <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                    Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-4 text-right text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dids.map((did) => (
                  <TableRow key={did.id} className="border-t border-slate-100 hover:bg-slate-50/60 dark:border-white/[0.05] dark:hover:bg-white/[0.03]">
                    <TableCell className="px-5 py-4 text-[15px] font-medium text-slate-900 dark:text-gray-200">{did.did}</TableCell>
                    <TableCell className="px-5 py-4 text-[13px] text-slate-500 dark:text-gray-400">
                      {new Date(did.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(did)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {dids.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-sm text-slate-500 dark:text-gray-400" isHeader={false}>
                      No DIDs configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-indigo-500/10 dark:bg-white/[0.03]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white/90">Daily Sync History</h2>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">10 records / page</div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[16px] border border-slate-200 dark:border-indigo-500/10">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-indigo-500/10">
              <TableRow>
                <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Date Executed
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Target Date
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-right text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Total Records
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-right text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  New Inserted
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-right text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Duplicates Ignored
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Trigger Type
                </TableCell>
                <TableCell isHeader className="px-5 py-4 text-left text-[13px] font-medium text-indigo-700 dark:text-indigo-200">
                  Error Msg
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronLogs.map((log) => (
                <TableRow key={log.id} className="h-14 border-t border-slate-100 odd:bg-slate-50/30 hover:bg-indigo-50/40 dark:border-white/[0.05] dark:odd:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                  <TableCell className="px-5 py-4 text-[14px] text-slate-900 dark:text-gray-200">
                    {new Date(log.executed_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-[14px] text-slate-700 dark:text-gray-200">{log.target_date}</TableCell>
                  <TableCell className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset ${statusClass(log.status)}`}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right font-mono text-[14px] tabular-nums text-slate-700 dark:text-gray-200">{log.total_records}</TableCell>
                  <TableCell className="px-5 py-4 text-right font-mono text-[14px] tabular-nums text-slate-700 dark:text-gray-200">{log.inserted_records}</TableCell>
                  <TableCell className="px-5 py-4 text-right font-mono text-[14px] tabular-nums text-slate-700 dark:text-gray-200">{log.ignored_records}</TableCell>
                  <TableCell className="px-5 py-4 text-[14px] text-slate-700 dark:text-gray-200">{log.trigger_type}</TableCell>
                  <TableCell className="px-5 py-4 text-[14px] text-slate-500 dark:text-gray-400">
                    {log.error_message || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {cronLogs.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-10 text-sm text-slate-500 dark:text-gray-400" isHeader={false}>
                    No cron logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-gray-400">Page {cronPage}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goPrev} disabled={cronPage === 1} className="h-11 border-slate-200 px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" onClick={goNext} disabled={!hasMoreLogs} className="h-11 border-slate-200 px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Delete DID</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete DID <span className="font-medium">{deleteTarget?.did}</span>?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={didLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDid} disabled={didLoading}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
