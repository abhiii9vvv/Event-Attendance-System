import { useState, useEffect } from 'react';
import axios from 'axios';

const COURSES = ['B.Tech', 'M.Tech'];
const SECTIONS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

const COLUMNS = [
  { key: 'Timestamp',    label: 'Timestamp' },
  { key: 'Name',         label: 'Name' },
  { key: 'System ID',    label: 'System ID' },
  { key: 'Year',         label: 'Year' },
  { key: 'Group',        label: 'Group' },
  { key: 'Sharda Email', label: 'Email' },
];

// ── CSV export helper ─────────────────────────────────────────────────────────
function downloadClassCSV(records, sheetName) {
  const header = COLUMNS.map((c) => c.label).join(',');
  const rows = records.map((r) =>
    COLUMNS.map((c) => `"${(r[c.key] ?? '').replace(/"/g, '""')}"` ).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `attendance_${sheetName}_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available class sheets
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await axios.get('/api/attendance/sheets/list');
        setAvailableClasses(data.data ?? []);
        if (data.data?.length > 0) {
          setSelectedClass(data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching class sheets:', err);
        setError('Failed to load available classes.');
      }
    };
    fetchClasses();
  }, []);

  // Fetch records for selected class
  useEffect(() => {
    if (!selectedClass) return;

    const fetchRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(
          `/api/attendance/sheets/${encodeURIComponent(selectedClass)}`
        );
        setRecords(data.data ?? []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load attendance records.');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedClass]);

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Attendance Records</h2>
          <p className="text-sm text-slate-500">
            View and download attendance for your class
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2 sm:px-4"
          >
            {loading ? 'Loading…' : '⟳ Refresh'}
          </button>
          <button
            onClick={() => downloadClassCSV(records, selectedClass)}
            disabled={records.length === 0}
            className="btn-primary text-xs px-3 py-2 sm:px-4"
          >
            ↓ Download CSV
          </button>
        </div>
      </div>

      {/* Class selector */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="form-label mb-2">Select Your Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="form-input w-full sm:w-64"
        >
          <option value="">Choose a class...</option>
          {availableClasses.map((className) => (
            <option key={className} value={className}>
              {className.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result count */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing{' '}
          <span className="font-semibold text-navy-800">{records.length}</span>{' '}
          student{records.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" className="opacity-75" />
            </svg>
            Loading records…
          </div>
        ) : !selectedClass ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="mb-2 text-4xl">📋</span>
            <p className="text-sm">Please select a class to view attendance.</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="mb-2 text-4xl">📋</span>
            <p className="text-sm">No attendance records found for this class yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-400 tabular-nums">
                    {i + 1}
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3 text-slate-700"
                    >
                      {row[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs text-blue-700">
          <strong>📌 How to access your class sheet:</strong> Each class (Course_Section) gets its own independent sheet in the Google Sheets file. 
          You can access it directly from the Google Sheets link for quick reference or sharing with students.
        </p>
      </div>
    </div>
  );
}
