const express = require('express');
const router = express.Router();
const {
  getAllRecords,
  isDuplicateSystemId,
  appendAttendance,
} = require('../services/googleSheets');

// ── POST /api/attendance  – Submit attendance ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, systemId, course, section, group, email } = req.body;

    // ── Field presence validation ─────────────────────────────────────────
    if (!name || !systemId || !course || !section || !group || !email) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // ── Email domain validation ───────────────────────────────────────────
    if (!/(sharda\.ac\.in)$/.test(email.toLowerCase())) {
      return res
        .status(400)
        .json({ error: 'Email must be a valid Sharda email (@sharda.ac.in or @ug.sharda.ac.in)' });
    }

    // ── Duplicate System ID check ─────────────────────────────────────────
    const duplicate = await isDuplicateSystemId(systemId);
    if (duplicate) {
      return res.status(409).json({
        error: `System ID ${systemId} has already been registered for this event.`,
      });
    }

    // ── Persist to Google Sheets ──────────────────────────────────────────
    await appendAttendance({ name, systemId, course, section, group, email });

    return res
      .status(201)
      .json({ message: 'Attendance submitted successfully!' });
  } catch (err) {
    const raw = err?.response?.data?.error;
    const detail = typeof raw === 'string' ? raw : raw?.message || err.message;
    console.error('[POST /api/attendance]', detail);
    return res.status(500).json({ error: detail || 'Server error. Please try again.' });
  }
});

// ── GET /api/attendance  – Fetch & filter records (admin) ────────────────────
router.get('/', async (req, res) => {
  try {
    const { course, section, group } = req.query;
    let records = await getAllRecords();

    if (course)   records = records.filter((r) => r['Course']  === course);
    if (section)  records = records.filter((r) => r['Section'] === section);
    if (group)    records = records.filter((r) => r['Group']   === group);

    return res.json({ count: records.length, data: records });
  } catch (err) {
    const raw = err?.response?.data?.error;
    const detail = typeof raw === 'string' ? raw : raw?.message || err.message;
    console.error('[GET /api/attendance]', detail);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
