const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/authMiddleware');
const { validate, attendanceSchema } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const {
  getAllRecords,
  getAllSheetNames,
  getRecordsBySheet,
  getOrganizedCSVContent,
  isDuplicateSystemId,
  appendAttendance,
} = require('../services/googleSheets');

/**
 * POST /api/attendance
 * Submit attendance for an event
 * Body: { name, systemId, course, year, section, group, email }
 */
router.post('/', validate(attendanceSchema), async (req, res, next) => {
  try {
    const { name, systemId, course, year, section, group, email } = req.body;

    // ── Duplicate System ID check ──────────────────────────────────────────
    const duplicate = await isDuplicateSystemId(systemId);
    if (duplicate) {
      return next(
        new AppError(
          `System ID ${systemId} has already been registered for this event.`,
          409
        )
      );
    }

    // ── Persist to Google Sheets ───────────────────────────────────────────
    await appendAttendance({ name, systemId, course, year, section, group, email });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Attendance submitted successfully!',
        systemId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message || 'Server error';
    console.error('[POST /api/attendance]', detail);
    next(new AppError(detail || 'Failed to submit attendance.', 500));
  }
});

/**
 * GET /api/attendance
 * Fetch & filter attendance records (ADMIN ONLY)
 * Query params: course, year, section, group
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 */
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { course, year, section, group } = req.query;
    let records = await getAllRecords();

    // Apply filters
    if (course) records = records.filter((r) => r['Course'] === course);
    if (year) records = records.filter((r) => r['Year'] === year);
    if (section) records = records.filter((r) => r['Section'] === section);
    if (group) records = records.filter((r) => r['Group'] === group);

    return res.json({
      success: true,
      data: records,
      count: records.length,
      filters: {
        course: course || null,
        year: year || null,
        section: section || null,
        group: group || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message || 'Server error';
    console.error('[GET /api/attendance]', detail);
    next(new AppError(detail || 'Failed to fetch records.', 500));
  }
});

/**
 * GET /api/attendance/sheets/list
 * Get all available course/section sheets (ADMIN ONLY)
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 */
router.get('/sheets/list', adminAuth, async (req, res, next) => {
  try {
    const allSheets = await getAllSheetNames();
    const classSheets = allSheets.filter(
      (name) => name !== 'Attendance' && !name.startsWith('Sheet')
    );
    const sorted = classSheets.sort();

    return res.json({
      success: true,
      data: sorted,
      count: sorted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message || 'Server error';
    console.error('[GET /api/attendance/sheets/list]', detail);
    next(new AppError(detail || 'Failed to fetch sheets.', 500));
  }
});

/**
 * GET /api/attendance/sheets/:sheetName
 * Get records from a specific sheet (ADMIN ONLY)
 * Query params: group
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 */
router.get('/sheets/:sheetName', adminAuth, async (req, res, next) => {
  try {
    const { sheetName } = req.params;
    const { group } = req.query;

    let records = await getRecordsBySheet(decodeURIComponent(sheetName));

    if (group) {
      records = records.filter((r) => r['Group'] === group);
    }

    return res.json({
      success: true,
      data: records,
      count: records.length,
      sheet: sheetName,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message || 'Server error';
    console.error('[GET /api/attendance/sheets/:sheetName]', detail);
    next(new AppError(detail || 'Failed to fetch sheet data.', 500));
  }
});

/**
 * GET /api/attendance/export/csv
 * Download organized CSV file (ADMIN ONLY)
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 */
router.get('/export/csv', adminAuth, async (req, res, next) => {
  try {
    const csvContent = await getOrganizedCSVContent();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `attendance_organized_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message || 'Server error';
    console.error('[GET /api/attendance/export/csv]', detail);
    next(new AppError(detail || 'Failed to export CSV.', 500));
  }
});

module.exports = router;
