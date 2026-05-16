"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { useBulkCreateInvitationsMutation } from "@/store/invitationApi";
import type { RsvpStatus } from "@/lib/types";

interface ParsedRow {
  name: string;
  plusOne: number;
}

interface BulkResult {
  created: { row: number; name: string; id: string }[];
  failed: { row: number; name: string; error: string }[];
  summary: { total: number; createdCount: number; failedCount: number };
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { rows, errors: ["File is empty"] };

  // Detect header
  const first = parseCsvLine(lines[0]!);
  const hasHeader = first.some((c) => c.toLowerCase() === "name");
  let nameIdx = 0;
  let plusOneIdx = 1;

  if (hasHeader) {
    nameIdx = first.findIndex((c) => c.toLowerCase() === "name");
    plusOneIdx = first.findIndex((c) => /^(plus[\s_]?one|plusones?|guests?)$/i.test(c));
  }

  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line, i) => {
    const cols = parseCsvLine(line);
    const rowNum = i + (hasHeader ? 2 : 1);
    const name = (cols[nameIdx] ?? "").trim();
    if (!name) {
      errors.push(`Row ${rowNum}: missing name`);
      return;
    }
    const rawPlus = plusOneIdx >= 0 ? (cols[plusOneIdx] ?? "").trim() : "";
    let plusOne = 0;
    if (rawPlus !== "") {
      const n = parseInt(rawPlus, 10);
      if (Number.isNaN(n) || n < 0) {
        errors.push(`Row ${rowNum}: invalid plusOne "${rawPlus}"`);
        return;
      }
      plusOne = n;
    }
    rows.push({ name, plusOne });
  });

  return { rows, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ",") {
        result.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [eventDate, setEventDate] = useState("2026-05-23T14:00");
  const [venue, setVenue] = useState("Canary World, Lagos, Nigeria");
  const [status, setStatus] = useState<RsvpStatus>("pending");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<BulkResult | null>(null);

  const [bulkCreate, { isLoading: isSubmitting }] = useBulkCreateInvitationsMutation();

  const handleFile = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    const { rows: parsed, errors } = parseCsv(text);
    setRows(parsed);
    setParseErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) {
      alert("No valid rows to upload. Please choose a CSV file.");
      return;
    }
    try {
      const res = await bulkCreate({ eventDate, venue, status, rows }).unwrap();
      setResult(res);
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Failed to upload. Please try again.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 sm:p-6" style={{ backgroundColor: "#FFF9F4" }}>
      <div className="max-w-3xl mx-auto bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Upload Invites</h1>
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-1">CSV format</p>
          <p>
            One row per guest. Columns: <code className="px-1 bg-white rounded">name</code> (required),{" "}
            <code className="px-1 bg-white rounded">plusOne</code> (optional, number).
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Header row is optional. Wrap names containing commas in double quotes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">Event Date &amp; Time</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(192,122,84)]"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(192,122,84)]"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RsvpStatus)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(192,122,84)]"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[rgb(192,122,84)] file:text-white hover:file:opacity-90"
            />
            {fileName && (
              <p className="mt-2 text-sm text-gray-600">
                {fileName} — {rows.length} valid row{rows.length === 1 ? "" : "s"}
                {parseErrors.length > 0 && `, ${parseErrors.length} issue${parseErrors.length === 1 ? "" : "s"}`}
              </p>
            )}
          </div>

          {parseErrors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-2">CSV issues (these rows will be skipped):</p>
              <ul className="text-sm text-amber-800 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {rows.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                Preview ({rows.length} row{rows.length === 1 ? "" : "s"})
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Plus One</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2 text-gray-900">{r.name}</td>
                        <td className="px-4 py-2 text-gray-700">{r.plusOne}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="attendly"
              type="submit"
              disabled={isSubmitting || rows.length === 0}
              loading={isSubmitting}
            >
              {isSubmitting ? "Uploading..." : `Upload ${rows.length} invite${rows.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </form>

        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                Created {result.summary.createdCount} of {result.summary.total} invitation{result.summary.total === 1 ? "" : "s"}.
              </p>
            </div>

            {result.failed.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-2">
                  {result.failed.length} row{result.failed.length === 1 ? "" : "s"} failed:
                </p>
                <ul className="text-sm text-red-800 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.failed.map((f, i) => (
                    <li key={i}>
                      Row {f.row} ({f.name || "no name"}): {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="secondary" onClick={() => router.push("/admin")}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
