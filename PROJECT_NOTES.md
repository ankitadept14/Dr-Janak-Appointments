# Project Notes (Essentials)

This document keeps the critical operational details in one place.

## Stack & Hosting
- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Google Apps Script Web App (Code.gs)
- **Database**: Google Sheets (Appointments, Patients, Users tabs)
- **Proxy**: `/api/proxy` on Vercel forwards to the GAS URL (hidden via env var)

## Environment Variables
- `VITE_GAS_API_URL` – the deployed Google Apps Script Web App URL.
  - Set in Vercel project settings (no local `.env.local` needed).
  - `.env.example` remains as a template.

## Data & Business Rules
- **Appointments**: prevent double-booking (same doctor + date + time unless status = NotComing). Audit fields recorded (createdBy, createdAt, updatedBy, updatedAt, updatedField).
- **Patients**: master data + age calculation; search triggers at 3+ characters; can auto-create when booking.
- **Users**: roles = `nurse`, `doctor`, `head-doctor`; users can be deactivated via `status` field.
- **Status values**: Scheduled, Arrived, NotComing, Completed.
- **Time slots**: 08:00–20:00, 15-minute intervals.
- **Date formats**: UI shows `DD-MM-YYYY`; backend stores `YYYY-MM-DD`; HTML5 date inputs use `YYYY-MM-DD`.

## Deployment & Operations
- Deploy frontend via Vercel (auto-build from main). Ensure `vercel.json` stays.
- Deploy backend by updating `Code.gs` in Apps Script and re-deploying the Web App (execute as you, accessible to anyone with link).
- No local dev required; `dist/` and `.env.local` have been removed.

## Key Files
- `Code.gs` – Google Apps Script backend
- `src/App.jsx` – React app with role-based dashboards
- `src/services/api.js` – API layer + date utils
- `src/App.css` – Styling
- `api/proxy.js` – Vercel serverless proxy
- `vercel.json` – Vercel configuration

## Testing Checklist
- Login with nurse/doctor/head-doctor
- Patient search (3+ chars), select, and book
- Double-booking guard blocks conflicting slots
- Status transitions (Scheduled → Arrived / NotComing)
- Notes editable; WhatsApp links working
- Head doctor: patient master + staff management + appointment creation
- Date pickers use native calendars
