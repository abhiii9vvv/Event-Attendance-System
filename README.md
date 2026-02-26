# Event Attendance System
**Emerging Trends in AI, Security & Image Analysis — Sharda University**

A full-stack attendance web app where students submit their details via a form and data is stored in Google Sheets. Teachers access a password-protected admin dashboard to filter and export records.

---

## Tech Stack

| Layer      | Technology                         |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite 5 + Tailwind CSS    |
| Backend    | Node.js + Express                   |
| Database   | Google Sheets (via Sheets API v4)   |
| Auth       | Google Service Account              |

---

## Project Structure

```
Attendance Taker/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttendanceForm.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env                 # VITE_ADMIN_PASSWORD
│   └── package.json
├── server/                  # Express backend
│   ├── routes/
│   │   └── attendance.js
│   ├── services/
│   │   └── googleSheets.js
│   ├── index.js
│   ├── .env                 # Google credentials
│   └── package.json
└── README.md
```

---

## Setup Guide

### 1 — Google Sheets & Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Enable **Google Sheets API** from *APIs & Services → Library*.
3. Create a **Service Account**: *APIs & Services → Credentials → Create Credentials → Service Account*.
4. Give it any name, then click **Done**.
5. Open the service account → **Keys** tab → **Add Key → Create new key → JSON**.
6. Download the JSON file. Open it — you will copy values from it into `server/.env`.
7. Create a new **Google Sheet** and name the first tab `Attendance`.
8. Share the sheet with the service account email (`client_email` in the JSON) with **Editor** access.
9. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/<<SPREADSHEET_ID>>/edit
   ```

### 2 — Configure Environment Variables

Edit **`server/.env`**:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

SPREADSHEET_ID=paste_your_spreadsheet_id

SHEET_NAME=Attendance

GOOGLE_PROJECT_ID=       # from JSON: project_id
GOOGLE_PRIVATE_KEY_ID=   # from JSON: private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=     # from JSON: client_email
GOOGLE_CLIENT_ID=        # from JSON: client_id
```

> **Tip:** Copy the `private_key` value exactly as it appears in the JSON file (with literal `\n` characters). Wrap it in double quotes.

Edit **`client/.env`**:

```env
VITE_ADMIN_PASSWORD=your_secure_password
```

### 3 — Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4 — Run Locally

Open **two terminals**:

```bash
# Terminal 1 – Backend
cd server
npm run dev        # starts on http://localhost:5000

# Terminal 2 – Frontend
cd client
npm run dev        # starts on http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

---

## Google Sheet Column Layout

The sheet is auto-initialized on first submission:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Name | System ID | Course | Section | Group | Sharda Email | Event Name |

---

## Routes

### Frontend

| Path     | Description              |
|----------|--------------------------|
| `/`      | Student attendance form  |
| `/admin` | Password-protected admin dashboard |

### API

| Method | Endpoint          | Description                         |
|--------|-------------------|-------------------------------------|
| POST   | `/api/attendance` | Submit attendance (duplicate check) |
| GET    | `/api/attendance` | Fetch records (supports `?course=&section=&group=`) |
| GET    | `/health`         | Health check                        |

---

## Deployment

### Backend — Render.com (free tier)

1. Push `server/` to a GitHub repo (or a sub-folder with a root `package.json`).
2. Create a new **Web Service** on [render.com](https://render.com).
3. Set **Root Directory** to `server`.
4. Build command: `npm install` | Start command: `node index.js`
5. Add all `server/.env` values as **Environment Variables** in the Render dashboard.
6. Note your Render URL (e.g. `https://attendance-api.onrender.com`).

### Frontend — Vercel

1. Push `client/` to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add environment variable `VITE_ADMIN_PASSWORD`.
5. In `client/vite.config.js`, update the proxy target to your Render URL for production builds, **or** update the Axios base URL in components using `import.meta.env.VITE_API_URL`.

> **Quick production API URL fix:** In both components, instead of `/api/attendance`, use:
> ```js
> const API = import.meta.env.VITE_API_URL || '';
> axios.post(`${API}/api/attendance`, data)
> ```
> Then set `VITE_API_URL=https://your-render-url.onrender.com` in Vercel.

---

## Security Notes

- **Admin password** is stored in a client-side env variable — sufficient for internal/event use. For production, move authentication to the backend with JWT.
- Never commit `server/.env` containing real credentials to version control. Add it to `.gitignore`.
- The Google private key must only live on the server.

---

## .gitignore

Add this at the repository root:

```
server/.env
client/.env
node_modules/
dist/
```
