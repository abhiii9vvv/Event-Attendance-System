const express = require('express');
const router = express.Router();
const {
  getAllRecords,
  getAllSheetNames,
  getRecordsBySheet,
  getOrganizedCSVContent,
  isDuplicateSystemId,
  appendAttendance,
} = require('../services/googleSheets');

// ── POST /api/attendance  – Submit attendance ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, systemId, course, year, section, group, email } = req.body;

    // ── Field presence validation ─────────────────────────────────────────
    if (!name || !systemId || !course || !year || !section || !group || !email) {
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
    await appendAttendance({ name, systemId, course, year, section, group, email });

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
    const { course, year, section, group } = req.query;
    let records = await getAllRecords();

    if (course)   records = records.filter((r) => r['Course']  === course);
    if (year)     records = records.filter((r) => r['Year']    === year);
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

// ── GET /api/attendance/sheets  – Get all available course/section sheets ─────
router.get('/sheets/list', async (req, res) => {
  try {
    const allSheets = await getAllSheetNames();
    // Filter out the main "Attendance" sheet and any system sheets
    const classSheets = allSheets.filter(
      (name) => name !== 'Attendance' && !name.startsWith('Sheet')
    );
    const sorted = classSheets.sort();
    return res.json({ count: sorted.length, data: sorted });
  } catch (err) {
    const raw = err?.response?.data?.error;
    const detail = typeof raw === 'string' ? raw : raw?.message || err.message;
    console.error('[GET /api/attendance/sheets/list]', detail);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/attendance/sheets/:sheetName  – Get records from a specific sheet
router.get('/sheets/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const { group } = req.query;
    
    let records = await getRecordsBySheet(decodeURIComponent(sheetName));
    
    if (group) {
      records = records.filter((r) => r['Group'] === group);
    }

    return res.json({ count: records.length, data: records, sheet: sheetName });
  } catch (err) {
    const raw = err?.response?.data?.error;
    const detail = typeof raw === 'string' ? raw : raw?.message || err.message;
    console.error('[GET /api/attendance/sheets/:sheetName]', detail);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/attendance/export/csv  – Download organized CSV file ─────────────
router.get('/export/csv', async (req, res) => {
  try {
    const csvContent = await getOrganizedCSVContent();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `attendance_organized_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    const raw = err?.response?.data?.error;
    const detail = typeof raw === 'string' ? raw : raw?.message || err.message;
    console.error('[GET /api/attendance/export/csv]', detail);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
