# Dr. Janak Appointment System - Copilot Instructions

## Project Overview
This is Dr. Janak's Appointment Management System built with:
- **Frontend**: React + Vite (hosted on GitHub Pages)
- **Backend**: Google Apps Script (API)
- **Database**: Google Sheets
- **PWA**: Progressive Web App support for mobile installation

## Architecture
- React frontend communicates with Google Apps Script via REST API
- Google Sheets stores appointments with two tabs: "Appointments" and "Config"
- Appointment columns: id, timestamp, patientName, phone, date, time, type, status, notes

## Development Guidelines
- Use lucide-react for icons
- Follow mobile-first responsive design
- Keep API calls in services/api.js
- Handle CORS properly in Google Apps Script
- Use fetch API for HTTP requests

## Project Structure
- `/src/App.jsx` - Main React application with routing
- `/src/services/api.js` - API integration layer
- `/Code.gs` - Google Apps Script backend
- `/vite.config.js` - Vite configuration with PWA plugin
- `/public/manifest.json` - PWA manifest
