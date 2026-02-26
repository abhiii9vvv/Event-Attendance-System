require('dotenv').config();
const express = require('express');
const cors = require('cors');

const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/attendance', attendanceRoutes);

app.get('/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// ── Start (local dev only) ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅  Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
