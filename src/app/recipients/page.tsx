"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Users,
  Upload,
  Search,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  parseSpreadsheetFile,
  autoSuggestColumnMapping,
  validateMappedRecipients,
  ParsedSpreadsheet,
  ValidatedRecipientRow,
} from "@/lib/spreadsheet-parser";

export interface RecipientRecord {
  id: string;
  name: string;
  email: string;
  event: string;
  date?: string;
  position?: string;
  status: "active" | "delivered" | "pending";
  createdAt: string;
  [key: string]: string | undefined;
}

const INITIAL_RECIPIENTS: RecipientRecord[] = [
  {
    id: "rec-1",
    name: "Rahidul Khan",
    email: "rahidul@example.com",
    event: "CodeCraft Hackathon 2026",
    date: "2026-09-05",
    position: "1st Place Winner",
    status: "active",
    createdAt: "2026-09-05",
  },
  {
    id: "rec-2",
    name: "Sarah Jenkins",
    email: "sarah.j@techcorp.io",
    event: "Global AI Summit",
    date: "2026-08-18",
    position: "Keynote Speaker",
    status: "active",
    createdAt: "2026-09-04",
  },
  {
    id: "rec-3",
    name: "Alex Morgan",
    email: "alex.m@devnetwork.org",
    event: "Full Stack Mastery Workshop",
    date: "2026-07-24",
    position: "Honor Graduate",
    status: "delivered",
    createdAt: "2026-09-03",
  },
  {
    id: "rec-4",
    name: "Elena Rostova",
    email: "elena.rostova@designhub.com",
    event: "UI/UX International Conference",
    date: "2026-06-12",
    position: "Panelist",
    status: "active",
    createdAt: "2026-09-02",
  },
];

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<RecipientRecord[]>(() => {
    if (typeof window === "undefined") return INITIAL_RECIPIENTS;
    try {
      const stored = localStorage.getItem("certimail_recipients");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_RECIPIENTS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedSheet, setParsedSheet] = useState<ParsedSpreadsheet | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{
    validRows: ValidatedRecipientRow[];
    invalidRows: ValidatedRecipientRow[];
  } | null>(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [formError, setFormError] = useState("");

  const saveRecipients = (newList: RecipientRecord[]) => {
    setRecipients(newList);
    try {
      localStorage.setItem("certimail_recipients", JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter & Search
  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecipients.length / pageSize) || 1;
  const paginatedRecipients = filteredRecipients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRecipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecipients.map((r) => r.id));
    }
  };

  const handleDeleteSingle = (id: string) => {
    const updated = recipients.filter((r) => r.id !== id);
    saveRecipients(updated);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected recipients?`)) {
      const updated = recipients.filter((r) => !selectedIds.includes(r.id));
      saveRecipients(updated);
      setSelectedIds([]);
    }
  };

  // -------------------------------------------------------------
  // SPREADSHEET IMPORT LOGIC
  // -------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseSpreadsheetFile(file);
      setParsedSheet(parsed);

      const standardVars = ["name", "email", "event", "date", "position"];
      const suggested = autoSuggestColumnMapping(parsed.headers, standardVars);
      setColumnMapping(suggested);

      const validated = validateMappedRecipients(parsed.rawRows, suggested);
      setValidationResult(validated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not parse spreadsheet.";
      alert(`Import error: ${msg}`);
    }
    e.target.value = "";
  };

  const handleMappingChange = (variableKey: string, columnHeader: string) => {
    if (!parsedSheet) return;
    const updated = { ...columnMapping, [variableKey]: columnHeader };
    setColumnMapping(updated);
    const validated = validateMappedRecipients(parsedSheet.rawRows, updated);
    setValidationResult(validated);
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const newRecords: RecipientRecord[] = validationResult.validRows.map(
      (row, idx) => ({
        id: `rec-imported-${Date.now()}-${idx}`,
        name: row.data["name"] || "Participant",
        email: row.data["email"] || "",
        event: row.data["event"] || "General Event",
        date: row.data["date"] || today,
        position: row.data["position"] || "",
        status: "active",
        createdAt: today,
      })
    );

    const merged = [...newRecords, ...recipients];
    saveRecipients(merged);

    setIsImportModalOpen(false);
    setParsedSheet(null);
    setValidationResult(null);
  };

  // -------------------------------------------------------------
  // MANUAL ADD LOGIC
  // -------------------------------------------------------------
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setFormError("A valid email address is required.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const record: RecipientRecord = {
      id: `rec-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      event: newEvent.trim() || "General Event",
      position: newPosition.trim(),
      date: today,
      status: "active",
      createdAt: today,
    };

    saveRecipients([record, ...recipients]);
    setNewName("");
    setNewEmail("");
    setNewEvent("");
    setNewPosition("");
    setFormError("");
    setIsAddModalOpen(false);
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Recipients
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage participant records, event rosters, and certificate variables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-800"
            >
              <Upload size={16} />
              Import CSV / Excel
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              <UserPlus size={16} />
              Add Recipient
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filter, Bulk Actions */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search recipients by name, email, or event..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Filter size={14} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/50"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Recipients Table */}
        {filteredRecipients.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-zinc-900/80 text-muted-foreground">
              <Users size={24} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {searchQuery ? "No matching recipients found" : "No recipients in directory"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria or filters."
                : "Import participants from an Excel spreadsheet or CSV to personalize and dispatch certificates."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                <Upload size={16} />
                Upload Spreadsheet
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-zinc-950/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length === paginatedRecipients.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Position / Rank</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {paginatedRecipients.map((r) => {
                    const isSelected = selectedIds.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`transition hover:bg-zinc-900/40 ${
                          isSelected ? "bg-zinc-900/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          {r.name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300">
                          {r.email}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {r.event}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {r.position || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              r.status === "delivered"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                                : "bg-zinc-800 text-zinc-300 border border-border"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                r.status === "delivered"
                                  ? "bg-emerald-400"
                                  : "bg-blue-400"
                              }`}
                            />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                          {r.createdAt}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteSingle(r.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-rose-950/50 hover:text-rose-400"
                            title="Delete recipient"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredRecipients.length)} of{" "}
                {filteredRecipients.length} recipients
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground disabled:opacity-30 hover:bg-zinc-800 hover:text-foreground"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono text-xs">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground disabled:opacity-30 hover:bg-zinc-800 hover:text-foreground"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* IMPORT SPREADSHEET MODAL                                */}
        {/* -------------------------------------------------------- */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={18} className="text-emerald-400" />
                  <h3 className="text-base font-semibold text-foreground">
                    Import Spreadsheet (.xlsx, .csv)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setParsedSheet(null);
                    setValidationResult(null);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!parsedSheet ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-zinc-950/30 p-8 text-center transition hover:border-zinc-600 hover:bg-zinc-900/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-zinc-900 text-muted-foreground">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Click to select an Excel or CSV file
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Supported formats: .xlsx, .xls, .csv
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-zinc-900/40 p-3">
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          {parsedSheet.fileName}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({parsedSheet.totalCount} total rows detected)
                        </span>
                      </div>
                      <label className="cursor-pointer text-xs text-blue-400 hover:underline">
                        Change File
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Column Mapping Table */}
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Map Columns to Certificate Variables
                      </h4>
                      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                        {[
                          { key: "name", label: "Recipient Name", required: true },
                          { key: "email", label: "Email Address", required: true },
                          { key: "event", label: "Event Name", required: false },
                          { key: "date", label: "Issued Date", required: false },
                          { key: "position", label: "Rank / Position", required: false },
                        ].map((v) => (
                          <div
                            key={v.key}
                            className="flex items-center justify-between gap-4 text-xs"
                          >
                            <span className="font-medium text-foreground">
                              {v.label} {v.required && <span className="text-rose-400">*</span>}
                            </span>
                            <select
                              value={columnMapping[v.key] || ""}
                              onChange={(e) =>
                                handleMappingChange(v.key, e.target.value)
                              }
                              className="w-48 rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none"
                            >
                              <option value="">-- Do Not Map --</option>
                              {parsedSheet.headers.map((h) => (
                                <option key={h} value={h}>
                                  Column: {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Validation Summary */}
                    {validationResult && (
                      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 size={15} />
                            {validationResult.validRows.length} Valid Rows
                          </span>
                          {validationResult.invalidRows.length > 0 && (
                            <span className="flex items-center gap-1 text-rose-400 font-medium">
                              <AlertCircle size={15} />
                              {validationResult.invalidRows.length} Invalid / Duplicate Rows
                            </span>
                          )}
                        </div>

                        {validationResult.invalidRows.length > 0 && (
                          <div className="max-h-32 overflow-y-auto rounded border border-rose-900/40 bg-rose-950/20 p-2 text-[11px] text-rose-300">
                            {validationResult.invalidRows.map((inv) => (
                              <div key={inv.index} className="py-0.5">
                                Row #{inv.index + 2}: {inv.errors.join(", ")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={!validationResult || validationResult.validRows.length === 0}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  Confirm & Import ({validationResult?.validRows.length || 0} Recipients)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* MANUAL ADD RECIPIENT MODAL                              */}
        {/* -------------------------------------------------------- */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Add Participant
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 p-2.5 text-xs text-rose-400">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddManual} className="space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahidul Khan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahidul@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">
                    Event / Program
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CodeCraft Hackathon 2026"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">
                    Position / Rank (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Place / Participant"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200"
                  >
                    Save Recipient
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
