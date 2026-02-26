const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Attendance';

const HEADERS = [
  'Timestamp',
  'Name',
  'System ID',
  'Course',
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

// ── Initialize header row if sheet is empty ──────────────────────────────────
async function initializeHeaders() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:H1`,
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
    range: `${SHEET_NAME}!A:H`,
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

// ── Duplicate System ID check ─────────────────────────────────────────────────
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
    data.section,
    data.group,
    data.email,
    EVENT_NAME,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

module.exports = { getAllRecords, isDuplicateSystemId, appendAttendance };
