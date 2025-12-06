# Dr. Janak Appointment System

A Progressive Web App (PWA) for managing Dr. Janak's clinic appointments with a React frontend and Google Apps Script backend.

## Features

- 📱 **Progressive Web App** - Install on mobile devices (Android/iOS)
- 👨‍⚕️ **Dr. Janak Dashboard** - Timeline view of appointments
- 👩‍⚕️ **Nurse Dashboard** - Add and manage patient appointments
- ✅ **Check-in System** - Mark patients as checked in
- 🔄 **Real-time Updates** - Sync with Google Sheets
- 📊 **Patient Tracking** - Automatic New/Old patient classification

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Icons**: Lucide React
- **Hosting**: GitHub Pages

## Setup Instructions

### 1. Google Apps Script Setup

1. Create a new Google Sheet with two tabs:
   - `Appointments` (with columns: id, timestamp, patientName, phone, date, time, type, status, notes)
   - `Config` (for future configuration)

2. Open Google Apps Script editor (Extensions > Apps Script)

3. Copy the contents of `Code.gs` to the script editor

4. Update `SPREADSHEET_ID` with your Google Sheet ID

5. Run `initializeSpreadsheet()` function once to set up headers

6. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the Web App URL

### 2. Frontend Setup

1. Install Node.js (if not already installed)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `src/services/api.js`:
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your deployed Web App URL

4. Update `vite.config.js`:
   - Change `base` to match your GitHub repository name (e.g., `/your-repo-name/`)

### 3. Development

Run the development server:
```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install -D gh-pages
   ```

2. Update `package.json` with your repository:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## PWA Installation

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Follow the prompts

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

## Project Structure

```
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── services/
│   │   └── api.js            # API service layer
│   ├── App.jsx               # Main application
│   ├── App.css               # Styles
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── Code.gs                   # Google Apps Script backend
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── index.html                # HTML template
```

## Usage

### Nurse Dashboard
- Add new patient appointments
- View today's appointments
- Check in patients
- Add notes for appointments

### Doctor Dashboard
- View appointment timeline
- Filter by date
- See patient status (Scheduled/Checked-In)
- Read appointment notes

## API Endpoints

### GET Requests
- `GET /` - Fetch all appointments
- `GET /?date=YYYY-MM-DD` - Fetch appointments for specific date

### POST Requests
- Create: `{ action: 'create', patientName, phone, date, time, notes }`
- Update: `{ action: 'update', id, status, notes }`
- Delete: `{ action: 'delete', id }`

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
