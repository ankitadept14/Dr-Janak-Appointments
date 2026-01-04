# Dr. Janak Appointment System

Live app: https://dr-janak-appointments.vercel.app

Modern appointment system with role-based access, double-booking protection, patient master, and Google Sheets/GAS backend.

## Features
- Secure login with roles: **nurse**, **doctor**, **head-doctor**
- Nurse booking with doctor selection, patient search (3+ chars), WhatsApp links, notes editing
- Doctor dashboard: calendar + upcoming appointments, can create appointments
- Head doctor: sees all doctors, patient master table, staff management, create appointments
- Statuses: Scheduled, Arrived, NotComing, Completed
- Double-booking prevention (same doctor + date + time unless status = NotComing)
- Time slots: 08:00–20:00 (15-minute intervals)
- Date handling: UI shows DD-MM-YYYY; backend stores YYYY-MM-DD; native calendar pickers everywhere

## Stack
- React + Vite (frontend on Vercel)
- Google Apps Script Web App (backend) + Google Sheets (Appointments, Patients, Users)
- Vercel serverless proxy (`/api/proxy`) hiding the GAS URL

## Environment
- Set `VITE_GAS_API_URL` in Vercel project settings to your deployed Google Apps Script Web App URL.
- `.env.example` is kept as a template; `.env.local` is removed.

## Deployment
- Frontend: pushed to `main` → Vercel auto-builds using `vercel.json`.
- Backend: update `Code.gs` in Apps Script and re-deploy the Web App (execute as you, accessible to anyone with link).

## Data Model (Google Sheets)
- **Appointments**: id, timestamp, patientName, phone, date (YYYY-MM-DD), time, doctor, status, notes, createdBy/createdAt, updatedBy/updatedAt/updatedField; double-booking guard.
- **Patients**: id, name, phone, gender, dob (DD-MM-YYYY), googleDocLink, totalAppointments, lastAppointment, upcomingAppointment, age (calculated).
- **Users**: id, password, role, doctorName (for doctors), status (active/inactive).

## Key Files
- `Code.gs` – Google Apps Script backend
- `src/App.jsx` – React app with dashboards
- `src/services/api.js` – API + date utilities
- `src/App.css` – Styling
- `api/proxy.js` – Vercel proxy
- `PROJECT_NOTES.md` – essential operations reference
