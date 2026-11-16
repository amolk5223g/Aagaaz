import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import type { ImportSummary } from '../types';

export const StudentImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setError('Please select a valid CSV or XLSX spreadsheet file.');
      return;
    }

    setSelectedFile(file);

    // Simple text preview for CSV
    if (name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const parsed = lines.slice(1, 6).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = vals[i] || '';
            });
            return obj;
          });
          setPreviewRows(parsed);
        }
      };
      reader.readAsText(file);
    } else {
      setPreviewRows([{ File: file.name, Size: `${(file.size / 1024).toFixed(1)} KB`, Type: 'Excel Spreadsheet' }]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.importStudents(selectedFile);
      setSummary(res);
    } catch (err: any) {
      setError(err.message || 'Import failed. Check the spreadsheet format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!summary || summary.errors.length === 0) return;
    const header = 'Row,USN,Reason\n';
    const rows = summary.errors.map((e) => `"${e.row}","${e.usn}","${e.reason}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aagazz_import_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#FFD78A] text-lg font-serif">✦</span>
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
            Student Whitelist Management
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
          Import Eligible AI & DS Students
        </h1>
        <p className="text-xs text-[#B9ADA0] mt-1">
          Upload the official university roster before event registration begins.
          Only approved USNs will be permitted to register and claim digital food coupons.
        </p>
      </div>

      {/* File Dropzone */}
      <div className="glass-luxury rounded-2xl p-6 sm:p-8 border border-[#D9AC63]/30">
        <div className="border-2 border-dashed border-[#D9AC63]/40 hover:border-[#FFD78A] rounded-xl p-8 text-center flex flex-col items-center justify-center transition-colors bg-[#080604]/50">
          <div className="w-14 h-14 rounded-full bg-[#15100C] border border-[#D9AC63]/40 flex items-center justify-center text-[#FFD78A] mb-3 shadow-gold">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="font-serif text-lg font-bold text-[#F8F2E8] mb-1">
            Choose CSV or Excel Spreadsheet
          </h3>
          <p className="text-xs text-[#B9ADA0] max-w-md mb-4">
            Expected columns: <strong>USN</strong>, <strong>Student Name</strong>, <strong>Year</strong> (Department defaults to AI &amp; DS)
          </p>

          <label className="btn-gold-3d px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold cursor-pointer inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Select File From Computer</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-[#221F1B] border border-[#D9AC63]/30 text-xs text-[#FFD78A] font-mono flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview of Parsed Rows */}
        {previewRows.length > 0 && (
          <div className="mt-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD78A] block mb-2">
              File Preview (First Rows)
            </span>
            <div className="overflow-x-auto rounded-xl border border-[#D9AC63]/25 bg-[#080604]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#15100C] text-[#FFD78A] border-b border-[#D9AC63]/20">
                  <tr>
                    {Object.keys(previewRows[0]).map((key) => (
                      <th key={key} className="p-2.5 font-bold uppercase text-[10px] tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221F1B]">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#15100C]/50 text-[#F8F2E8]">
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="p-2.5 font-mono text-[11px]">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn-gold-3d w-full h-12 rounded-xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating and Storing Whitelist in Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONFIRM & IMPORT TO DATABASE</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Import Summary Results */}
      {summary && (
        <div className="glass-luxury rounded-2xl p-6 border border-[#D9AC63]/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#F8F2E8]">
              Import Results Summary
            </h2>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Completed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[#15100C] p-3 rounded-xl border border-[#D9AC63]/20">
              <span className="text-[10px] uppercase text-[#B9ADA0] font-semibold block">Total Rows</span>
              <span className="font-serif text-xl font-bold text-[#F8F2E8]">{summary.total_records}</span>
            </div>

            <div className="bg-[#15100C] p-3 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] uppercase text-emerald-400 font-semibold block">Successfully Added</span>
              <span className="font-serif text-xl font-bold text-emerald-400">{summary.imported_records}</span>
            </div>

            <div className="bg-[#15100C] p-3 rounded-xl border border-amber-500/30">
              <span className="text-[10px] uppercase text-amber-400 font-semibold block">Duplicates Skipped</span>
              <span className="font-serif text-xl font-bold text-amber-400">{summary.duplicate_records}</span>
            </div>

            <div className="bg-[#15100C] p-3 rounded-xl border border-red-500/30">
              <span className="text-[10px] uppercase text-red-400 font-semibold block">Invalid / Non-AI&DS</span>
              <span className="font-serif text-xl font-bold text-red-400">{summary.invalid_records}</span>
            </div>
          </div>

          {/* Error Details */}
          {summary.errors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#D9AC63]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Warnings ({summary.errors.length} rows)</span>
                </span>

                <button
                  onClick={downloadErrorReport}
                  className="text-xs text-[#FFD78A] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report (CSV)</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-red-950 bg-[#080604] p-2 text-xs divide-y divide-red-950/40">
                {summary.errors.map((err, i) => (
                  <div key={i} className="py-1.5 px-2 flex items-center justify-between">
                    <span className="text-[#B9ADA0]">Row {err.row} ({err.usn})</span>
                    <span className="text-red-300 font-mono text-[11px]">{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

