import { useState } from 'react';
import axios from 'axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const COURSES = ['B.Tech', 'M.Tech'];
const SECTIONS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A–Z
const GROUPS = ['G1', 'G2'];
const EVENT = 'Emerging Trends in AI, Security & Image Analysis';

const INITIAL_FORM = {
  name: '',
  systemId: '',
  course: '',
  section: '',
  group: '',
  email: '',
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        className="opacity-75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AttendanceForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear individual field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.systemId.trim()) {
      errs.systemId = 'System ID is required.';
    } else if (!/^\d+$/.test(form.systemId.trim())) {
      errs.systemId = 'System ID must be a number.';
    }
    if (!form.course) errs.course = 'Please select a course.';
    if (!form.section) errs.section = 'Please select a section.';
    if (!form.group) errs.group = 'Please select a group.';
    if (!form.email.trim()) {
      errs.email = 'Sharda email is required.';
    } else if (!/(sharda\.ac\.in)$/.test(form.email.toLowerCase())) {
      errs.email = 'Email must be a valid Sharda email (@sharda.ac.in or @ug.sharda.ac.in)';
    }
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/attendance', {
        name: form.name.trim(),
        systemId: form.systemId.trim(),
        course: form.course,
        section: form.section,
        group: form.group,
        email: form.email.trim().toLowerCase(),
      });
      setStatus({ type: 'success', message: data.message });
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      const msg =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center">
      {/* Event badge */}
      <div className="mb-4 sm:mb-6 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-700 border border-blue-200 text-center">
        Event Attendance
      </div>

      <h1 className="mb-1 text-xl sm:text-2xl font-bold text-navy-900 text-center px-2">
        {EVENT}
      </h1>
      <p className="mb-6 sm:mb-8 text-sm text-slate-500 text-center">
        Fill in your details below to mark your attendance.
      </p>

      {/* ── Status Alerts ─────────────────────────────────────────────── */}
      {status && (
        <div
          className={`mb-6 w-full max-w-lg rounded-lg border px-4 py-3.5 text-sm font-medium flex items-start gap-3 ${
            status.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          <span className="mt-0.5 text-lg leading-none">
            {status.type === 'success' ? '✅' : '❌'}
          </span>
          <span>{status.message}</span>
        </div>
      )}

      {/* ── Form Card ──────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-lg"
      >
        {/* Name */}
        <div className="mb-5">
          <label htmlFor="name" className="form-label">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        {/* System ID */}
        <div className="mb-5">
          <label htmlFor="systemId" className="form-label">
            System ID <span className="text-red-500">*</span>
          </label>
          <input
            id="systemId"
            name="systemId"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 2200123456"
            value={form.systemId}
            onChange={handleChange}
            className={`form-input ${errors.systemId ? 'input-error' : ''}`}
          />
          {errors.systemId && (
            <p className="mt-1 text-xs text-red-600">{errors.systemId}</p>
          )}
        </div>

        {/* Course & Section — row */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Course */}
          <div>
            <label htmlFor="course" className="form-label">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              id="course"
              name="course"
              value={form.course}
              onChange={handleChange}
              className={`form-input ${errors.course ? 'input-error' : ''}`}
            >
              <option value="">Select</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.course && (
              <p className="mt-1 text-xs text-red-600">{errors.course}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label htmlFor="section" className="form-label">
              Section <span className="text-red-500">*</span>
            </label>
            <select
              id="section"
              name="section"
              value={form.section}
              onChange={handleChange}
              className={`form-input ${errors.section ? 'input-error' : ''}`}
            >
              <option value="">Select</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.section && (
              <p className="mt-1 text-xs text-red-600">{errors.section}</p>
            )}
          </div>
        </div>

        {/* Group */}
        <div className="mb-5">
          <label className="form-label">
            Group <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex gap-4">
            {GROUPS.map((g) => (
              <label
                key={g}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition ${
                  form.group === g
                    ? 'border-navy-700 bg-navy-50 text-navy-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="group"
                  value={g}
                  checked={form.group === g}
                  onChange={handleChange}
                  className="sr-only"
                />
                {g}
              </label>
            ))}
          </div>
          {errors.group && (
            <p className="mt-1 text-xs text-red-600">{errors.group}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-7">
          <label htmlFor="email" className="form-label">
            Sharda Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="yourname@ug.sharda.ac.in"
            value={form.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? (
            <>
              <Spinner />
              Submitting…
            </>
          ) : (
            'Submit Attendance'
          )}
        </button>
      </form>
    </div>
  );
}
