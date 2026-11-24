import React, { useState } from 'react';
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
    <>
      <header className="head"><h1>Import the list</h1></header>
      <p className="lead">
        Upload the AI &amp; DS roster before registration opens. Only these USNs can claim a coupon.
      </p>

      <label className="drop">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="sr-only" />
        <b>{selectedFile ? selectedFile.name : 'Choose a CSV or Excel file'}</b>
        <span>
          {selectedFile
            ? `${(selectedFile.size / 1024).toFixed(1)} KB. Click to choose a different file.`
            : 'Columns: USN, Student Name, Year. Department defaults to AI & DS.'}
        </span>
      </label>

      {error && <p className="note note--bad" role="alert">{error}</p>}

      {previewRows.length > 0 && (
        <section>
          <h2>First rows</h2>
          <div className="scroll">
            <table className="ledger">
              <thead><tr>{Object.keys(previewRows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx}>{Object.values(row).map((val: any, vIdx) => <td key={vIdx}>{val}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleUpload} disabled={loading} className="btn btn--red">{loading ? 'Importing' : 'Import students'}</button>
        </section>
      )}

      {summary && (
        <section>
          <h2>Imported {summary.imported_records} of {summary.total_records}</h2>
          <table className="ledger ledger--sum">
            <tbody>
              <tr><td>Rows in the file</td><td className="num big">{summary.total_records}</td></tr>
              <tr><td>Added</td><td className="num big good">{summary.imported_records}</td></tr>
              <tr><td>Skipped, already listed</td><td className="num big">{summary.duplicate_records}</td></tr>
              <tr><td>Rejected, invalid or not AI &amp; DS</td><td className="num big bad">{summary.invalid_records}</td></tr>
            </tbody>
          </table>

          {summary.errors.length > 0 && (
            <>
              <div className="head head--sub">
                <h2>Rows to fix ({summary.errors.length})</h2>
                <button onClick={downloadErrorReport} className="btn">Download as CSV</button>
              </div>
              <div className="scroll scroll--short">
                <table className="ledger">
                  <thead><tr><th>Row</th><th>USN</th><th>Reason</th></tr></thead>
                  <tbody>
                    {summary.errors.map((err, i) => (
                      <tr key={i}><td>{err.row}</td><td className="code">{err.usn}</td><td>{err.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
};
