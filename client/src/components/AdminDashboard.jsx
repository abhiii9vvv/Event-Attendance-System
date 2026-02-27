import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const COURSES = ['B.Tech', 'M.Tech'];
const SECTIONS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const GROUPS = ['G1', 'G2'];
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const COLUMNS = [
  { key: 'Timestamp',    label: 'Timestamp' },
  { key: 'Name',         label: 'Name' },
  { key: 'System ID',    label: 'System ID' },
  { key: 'Course',       label: 'Course' },
  { key: 'Section',      label: 'Section' },
  { key: 'Group',        label: 'Group' },
  { key: 'Sharda Email', label: 'Email' },
  { key: 'Event Name',   label: 'Event' },
];

// ── CSV export helper ─────────────────────────────────────────────────────────
function downloadCSV(records) {
  const header = COLUMNS.map((c) => c.label).join(',');
  const rows = records.map((r) =>
    COLUMNS.map((c) => `"${(r[c.key] ?? '').replace(/"/g, '""')}"` ).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
// ── Organized CSV export by Course & Section ────────────────────────────
function downloadOrganizedCSV(records) {
  // Group records by Course and Section
  const grouped = {};
  records.forEach((record) => {
    const course = record['Course'] || 'Unknown Course';
    const section = record['Section'] || 'Unknown Section';
    const key = `${course}_${section}`;
    
    if (!grouped[key]) {
      grouped[key] = { course, section, records: [] };
    }
    grouped[key].records.push(record);
  });

  // Create a zip-like CSV with organized sections
  const allContent = [];
  const dateStr = new Date().toISOString().slice(0, 10);

  Object.values(grouped).forEach((group, idx) => {
    // Add section header
    if (idx > 0) allContent.push(''); // blank line between sections
    allContent.push(`Course,${group.course}`);
    allContent.push(`Section,${group.section}`);
    allContent.push(`Records,${group.records.length}`);
    allContent.push('');

    // Add headers
    const header = COLUMNS.map((c) => c.label).join(',');
    allContent.push(header);

    // Add rows
    group.records.forEach((r) => {
      const row = COLUMNS.map((c) => `"${(r[c.key] ?? '').replace(/"/g, '""')}"` ).join(',');
      allContent.push(row);
    });

    allContent.push('');
  });

  const blob = new Blob([allContent.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_organized_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Download individual file for each Course/Section ────────────────────
function downloadIndividualFiles(records) {
  // Group records by Course and Section
  const grouped = {};
  records.forEach((record) => {
    const course = record['Course'] || 'Unknown';
    const section = record['Section'] || 'Unknown';
    const key = `${course}_${section}`;
    
    if (!grouped[key]) {
      grouped[key] = { course, section, records: [] };
    }
    grouped[key].records.push(record);
  });

  const dateStr = new Date().toISOString().slice(0, 10);

  // Download each group as separate file
  Object.values(grouped).forEach((group) => {
    const header = COLUMNS.map((c) => c.label).join(',');
    const rows = group.records.map((r) =>
      COLUMNS.map((c) => `"${(r[c.key] ?? '').replace(/"/g, '""')}"` ).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename: remove/replace invalid characters
    const safeCourse = group.course.replace(/[/\\?*:|"<>]/g, '');
    const safeSection = group.section.replace(/[/\\?*:|"<>]/g, '');
    a.download = `attendance_${safeCourse}_${safeSection}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onAuth();
    } else {
      setErr('Incorrect password. Please try again.');
      setPw('');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 rounded-full bg-blue-50 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-700 border border-blue-200">
        Admin Access
      </div>
      <h2 className="mb-2 text-2xl font-bold text-navy-900">Admin Dashboard</h2>
      <p className="mb-8 text-sm text-slate-500">Enter admin password to view attendance records.</p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <label className="form-label" htmlFor="admin-pw">
          Password
        </label>
        <input
          id="admin-pw"
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(''); }}
          placeholder="Enter admin password"
          className={`form-input mt-1 mb-4 ${err ? 'input-error' : ''}`}
          autoFocus
        />
        {err && <p className="mb-3 text-xs text-red-600">{err}</p>}
        <button type="submit" className="btn-primary w-full">
          Unlock Dashboard
        </button>
      </form>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [filters, setFilters] = useState({ course: '', section: '', group: '' });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch records from API ─────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.course)  params.course  = filters.course;
      if (filters.section) params.section = filters.section;
      if (filters.group)   params.group   = filters.group;

      const { data } = await axios.get('/api/attendance', { params });
      setRecords(data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Re-fetch whenever filters change (after auth)
  useEffect(() => {
    if (authed) fetchRecords();
  }, [authed, fetchRecords]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () =>
    setFilters({ course: '', section: '', group: '' });

  // ── Auth gate ──────────────────────────────────────────────────────────
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  // ── Dashboard UI ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Attendance Dashboard</h2>
          <p className="text-sm text-slate-500">
            Emerging Trends in AI, Security &amp; Image Analysis
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2 sm:px-4"
          >
            {loading ? 'Loading…' : '⟳ Refresh'}
          </button>
          <div className="relative group">
            <button
              disabled={records.length === 0}
              className="btn-primary text-xs px-3 py-2 sm:px-4 flex items-center gap-1"
            >
              ↓ Export
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => downloadCSV(records)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 whitespace-nowrap"
              >
                All Records (Single CSV)
              </button>
              <button
                onClick={() => downloadOrganizedCSV(records)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 whitespace-nowrap border-t border-slate-200"
              >
                Organized by Course/Section
              </button>
              <button
                onClick={() => downloadIndividualFiles(records)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 whitespace-nowrap border-t border-slate-200"
              >
                Separate Files per Class
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Filter Records
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Course */}
          <div>
            <label className="form-label text-xs">Course</label>
            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              className="form-input text-sm"
            >
              <option value="">All Courses</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="form-label text-xs">Section</label>
            <select
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              className="form-input text-sm"
            >
              <option value="">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="form-label text-xs">Group</label>
            <select
              name="group"
              value={filters.group}
              onChange={handleFilterChange}
              className="form-input text-sm"
            >
              <option value="">All Groups</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Clear */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Result count ───────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing{' '}
          <span className="font-semibold text-navy-800">{records.length}</span>{' '}
          record{records.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" className="opacity-75" />
            </svg>
            Loading attendance records…
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="mb-2 text-4xl">📋</span>
            <p className="text-sm">No records found for the selected filters.</p>
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
                      {col.key === 'Event Name' ? (
                        <span className="inline-block max-w-xs truncate" title={row[col.key]}>
                          {row[col.key]}
                        </span>
                      ) : (
                        row[col.key] || '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
