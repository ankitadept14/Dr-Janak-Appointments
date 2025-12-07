# Dr. Janak's Clinic - Appointment Management System

## 🎯 Quick Start

Your professional appointment management system is **ready to use**!

### Access the App
👉 **https://dr-janak-appointments.vercel.app**

---

## 🚀 One-Time Setup (IMPORTANT!)

### Step 1: Update Your Google Sheet
1. Open your Google Sheet (Dr. Janak Appointments)
2. Go to the **"Appointments"** tab
3. **Insert a new column between H and J** (after "status", before "notes")
4. Name it **"checkedIn"**
5. In all existing rows, add **"No"** in this column

**Column order should be:**
```
A:id | B:timestamp | C:patientName | D:phone | E:date | F:time | G:type | H:status | I:checkedIn | J:notes
```

### Step 2: Update Google Apps Script
1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete all code in Code.gs
4. Copy the latest **Code.gs** from this repository
5. Save (Ctrl+S)
6. Click **Deploy > Manage deployments**
7. Click the pencil icon to edit
8. Click **Deploy**

That's it! The app is now live.

---

## 🎨 Features Overview

### For Everyone:
- ✅ **Welcome Screen** - Choose your role (Nurse/Doctor)
- ✅ **Two Tabs** - "View Appointments" & "Book Appointment"
- ✅ **View All Appointments** - See complete list with today's summary
- ✅ **Book Appointments** - Create new appointments with:
  - Patient name
  - Phone (10 digits)
  - Date (DD-MM-YYYY format)
  - Time (dropdown with 15-min slots from 09:00-18:00)
  - New Patient checkbox
  - Notes

### For Nurse & Doctor:
- ✅ **Check-in Patients** - Click ✓ icon to mark as arrived
- ✅ **Reschedule** - Click edit icon to change date/time
- ✅ **Delete** (Nurse only) - Remove appointments

---

## 📋 What's Working

### ✅ Fully Functional:
- [x] Appointment Creation
- [x] Appointment Viewing
- [x] Check-in System (updates Google Sheet)
- [x] Rescheduling
- [x] Deletion
- [x] Time Selection (15-min intervals)
- [x] Date Formatting (DD-MM-YYYY)
- [x] Role-based Views (Nurse/Doctor)
- [x] Mobile Responsive
- [x] Professional UI with Animations
- [x] Error/Success Messages
- [x] Google Sheet Integration

---

## 📊 Data Format

### Dates:
- **Display**: DD-MM-YYYY (e.g., 07-12-2025)
- **Sheet**: YYYY-MM-DD (auto-converted)

### Times:
- **Format**: HH:MM (24-hour, e.g., 14:30)
- **Selection**: Dropdown (09:00 to 18:00, 15-min slots)

### Check-in:
- **Values**: "Yes" or "No"
- **Column**: I (checkedIn)

---

## 🎮 How to Use

### Nurse Role:
1. Click **"Nurse"** on welcome screen
2. **Book Tab**: Create new appointments
   - Fill in all fields
   - Select time from dropdown
   - Check "New Patient" if first-time
   - Click "Book Appointment"
3. **View Tab**: Manage appointments
   - See all appointments
   - Click ✓ to check in patient
   - Click ✏️ to reschedule
   - Click 🗑️ to delete

### Doctor Role:
1. Click **"Doctor"** on welcome screen
2. **Book Tab**: Create new appointments (same as Nurse)
3. **View Tab**: View appointments
   - See all appointments
   - Click ✓ to check in patient
   - Click ✏️ to reschedule
   - **Cannot delete** (read-only for safety)

---

## 🔄 Google Sheet Updates

When you perform actions in the app, your Google Sheet updates automatically:

| Action | Sheet Update |
|--------|--------------|
| Create Appointment | New row added |
| Check In Patient | `checkedIn` column → "Yes" |
| Uncheck In | `checkedIn` column → "No" |
| Reschedule | `date` & `time` columns updated |
| Delete | Row removed |

---

## 🎨 Design & UI

- **Colors**: Purple-blue gradient (#667eea)
- **Fonts**: Inter (modern sans-serif)
- **Animations**: Smooth transitions
- **Responsive**: Mobile, tablet, desktop
- **Dark Mode**: Ready to implement
- **PWA**: Installable on phones

---

## 📱 Mobile Support

✅ Fully responsive
✅ Touch-friendly buttons
✅ Works on iOS and Android
✅ Can be installed as app (PWA)
✅ Offline capability

---

## ⚡ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Hosting**: Vercel
- **Icons**: Lucide React
- **Deployment**: GitHub → Vercel (auto-deploy)

---

## 🐛 Troubleshooting

### App not showing data?
- [ ] Check "checkedIn" column exists in sheet
- [ ] Refresh browser (Ctrl+Shift+R)
- [ ] Check browser console (F12) for errors
- [ ] Verify Google Apps Script is deployed

### Dates not formatting correctly?
- [ ] Use DD-MM-YYYY format (e.g., 07-12-2025)
- [ ] Don't type manually - select from calendar if available

### Can't select time?
- [ ] Click the Time dropdown
- [ ] Select from 15-minute intervals (09:00 to 18:00)

### Check-in not saving?
- [ ] Ensure Code.gs has "checkedIn" field
- [ ] Verify column I exists in sheet
- [ ] Try refreshing the app

### Nothing showing on screen?
- [ ] Clear browser cache
- [ ] Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Check network tab in DevTools
- [ ] Verify proxy is working

---

## 📝 File Structure

```
Your System:
├── React Frontend (Vercel)
│   ├── Welcome Screen
│   ├── Nurse Dashboard
│   ├── Doctor Dashboard
│   └── Professional UI
│
├── Google Apps Script Backend
│   ├── Create appointments
│   ├── Read appointments
│   ├── Update appointments
│   └── Delete appointments
│
└── Google Sheet Database
    ├── Appointments tab
    └── Config tab (optional)
```

---

## 🔐 Security

- ✅ Deployed on Vercel (secure HTTPS)
- ✅ CORS-protected API calls
- ✅ Google Apps Script authentication
- ✅ No sensitive data stored in browser

---

## 📞 Support & Customization

### To Customize:
Edit these files in repository:
- `src/App.jsx` - Change logic/features
- `src/App.css` - Change colors/design
- `src/services/api.js` - Change API functions
- `Code.gs` - Change backend logic

All changes auto-deploy to Vercel when you push to GitHub.

---

## ✅ Verification Checklist

Before going live:
- [ ] Google Sheet has "checkedIn" column (I)
- [ ] Google Apps Script is updated & deployed
- [ ] App loads at https://dr-janak-appointments.vercel.app
- [ ] Can view appointments
- [ ] Can book appointment
- [ ] Can check in patient (✓)
- [ ] Can reschedule (✏️)
- [ ] Check-in updates Google Sheet
- [ ] App is responsive on phone

---

## 🎓 Learning Resources

To understand the code:
- React docs: https://react.dev
- Google Apps Script: https://developers.google.com/apps-script
- Vite: https://vitejs.dev
- Vercel: https://vercel.com/docs

---

## 🎉 You're All Set!

Your professional appointment management system is:
- ✅ Built
- ✅ Deployed
- ✅ Live
- ✅ Ready to use

**Open the app**: https://dr-janak-appointments.vercel.app

---

## 📚 Documentation

For detailed info, see:
- `FINAL_SYSTEM_OVERVIEW.md` - Complete feature list
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guide
- `Code.gs` - Backend code with comments
- `src/App.jsx` - Frontend code with comments

---

**Version**: 2.0 (Professional)
**Last Updated**: December 7, 2025
**Status**: Production Ready 🚀

Enjoy your new appointment system!
