import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import AttendanceForm from './components/AttendanceForm';
import AdminDashboard from './components/AdminDashboard';

const EVENT = 'Emerging Trends in AI, Security & Image Analysis';

export default function App() {
  return (
    <BrowserRouter>
      {/* ── Top Navigation ─────────────────────────────────────────────── */}
      <header className="bg-navy-900 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold text-base sm:h-10 sm:w-10 sm:text-lg">
              SU
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-300">
                Sharda University
              </p>
              <p className="hidden sm:block text-sm font-semibold text-white leading-tight max-w-xs truncate">
                {EVENT}
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-xs sm:px-4 sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="sm:hidden">Attend</span>
              <span className="hidden sm:inline">Mark Attendance</span>
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-xs sm:px-4 sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Routes>
          <Route path="/" element={<AttendanceForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Sharda University. Event Attendance System.</p>
        <p className="mt-1">
          Developed by{' '}
          <span className="font-medium text-navy-700">Abhinav Tiwary</span>
        </p>
      </footer>
    </BrowserRouter>
  );
}
