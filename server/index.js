require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, same-origin on Vercel)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })
);
app.options('*', cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (_req, res) => res.json({
  status: 'OK',
  time: new Date(),
  env: {
    SPREADSHEET_ID: !!process.env.SPREADSHEET_ID,
    SHEET_NAME: !!process.env.SHEET_NAME,
    GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
  }
}));

// ── Start (local dev only) ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅  Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
