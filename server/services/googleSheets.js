const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Attendance';

const HEADERS = [
  'Timestamp',
  'Name',
  'System ID',
  'Course',
  'Year',
  'Section',
  'Group',
  'Sharda Email',
  'Event Name',
];

const EVENT_NAME = 'Emerging Trends in AI, Security & Image Analysis';

// ── Auth ─────────────────────────────────────────────────────────────────────
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      // Handle escaped newlines from .env files
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ── Get all sheet names in the spreadsheet ───────────────────────────────────
async function getAllSheetNames() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  return res.data.sheets?.map((s) => s.properties.title) ?? [];
}

// ── Create a new sheet if it doesn't exist ───────────────────────────────────
async function createSheetIfNotExists(sheetName) {
  const existingNames = await getAllSheetNames();
  if (existingNames.includes(sheetName)) {
    return; // Sheet already exists
  }

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  });

  // Add headers to the new sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
}

// ── Initialize header row if sheet is empty ──────────────────────────────────
async function initializeHeaders() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:I1`,
  });

  const existing = res.data.values?.[0] ?? [];
  if (existing.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

// ── Fetch all data rows (excludes header) ────────────────────────────────────
async function getAllRecords() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
  });

  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];

  // Map each row to an object using HEADERS
  return rows.slice(1).map((row) =>
    HEADERS.reduce((obj, key, i) => {
      obj[key] = row[i] ?? '';
      return obj;
    }, {})
  );
}

// ── Fetch records from a specific sheet (Course_Section) ────────────────────
async function getRecordsBySheet(sheetName) {
  const sheets = await getSheetsClient();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:I`,
    });

    const rows = res.data.values ?? [];
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row) =>
      HEADERS.reduce((obj, key, i) => {
        obj[key] = row[i] ?? '';
        return obj;
      }, {})
    );
  } catch (err) {
    console.error(`Error fetching records from sheet "${sheetName}":`, err.message);
    return [];
  }
}

// ── Duplicate System ID check (across all sheets) ────────────────────────────
async function isDuplicateSystemId(systemId) {
  const records = await getAllRecords();
  return records.some((r) => r['System ID'] === String(systemId));
}

// ── Append a new attendance row ───────────────────────────────────────────────
async function appendAttendance(data) {
  await initializeHeaders();
  const sheets = await getSheetsClient();

  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const row = [
    timestamp,
    data.name,
    String(data.systemId),
    data.course,
    data.year,
    data.section,
    data.group,
    data.email,
    EVENT_NAME,
  ];

  // Append to main sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  // Also append to course_section specific sheet
  const courseSheetName = `${data.course}_${data.section}`;
  await createSheetIfNotExists(courseSheetName);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${courseSheetName}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

// ── Get all records grouped by course and section for CSV export ──────────────
async function getRecordsGroupedByClass() {
  const records = await getAllRecords();
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

  return Object.values(grouped).sort((a, b) => {
    if (a.course !== b.course) return a.course.localeCompare(b.course);
    return a.section.localeCompare(b.section);
  });
}

// ── Export organized CSV data with section headers ─────────────────────────────
async function getOrganizedCSVContent() {
  const grouped = await getRecordsGroupedByClass();
  const csvLines = [];

  grouped.forEach((group, idx) => {
    if (idx > 0) csvLines.push(''); // Blank line between sections
    
    // Section header
    csvLines.push(`COURSE,${group.course}`);
    csvLines.push(`SECTION,${group.section}`);
    csvLines.push(`TOTAL STUDENTS,${group.records.length}`);
    csvLines.push(''); // Blank before data

    // Headers
    const headers = HEADERS.map((h) => `"${h}"`).join(',');
    csvLines.push(headers);

    // Data rows
    group.records.forEach((record) => {
      const row = HEADERS.map((key) => {
        const value = record[key] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
      csvLines.push(row);
    });
  });

  return csvLines.join('\n');
}

module.exports = {
  getAllRecords,
  getRecordsBySheet,
  getAllSheetNames,
  getRecordsGroupedByClass,
  getOrganizedCSVContent,
  isDuplicateSystemId,
  appendAttendance,
};
