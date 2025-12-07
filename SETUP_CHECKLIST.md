# ✅ Dr. Janak Appointment System - Setup Checklist

## 🎯 Before You Start

- [ ] You have access to your Google Sheet (Dr. Janak Appointments)
- [ ] You have access to Google Apps Script (Extensions > Apps Script)
- [ ] You have a Vercel account (auto-deployment is already configured)

---

## 📋 Step-by-Step Setup

### ✅ STEP 1: Update Google Sheet (5 minutes)

**Location:** Open your Google Sheet → "Appointments" tab

1. [ ] Click on column I header (between H "status" and J "notes")
2. [ ] Right-click → "Insert 1 left"
3. [ ] In cell I1, type: **checkedIn**
4. [ ] For all existing data rows in column I, enter: **No**

**Result:** You should have columns A through J with "checkedIn" in position I

**Verification:**
```
A:id | B:timestamp | C:patientName | D:phone | E:date | F:time | G:type | H:status | I:checkedIn | J:notes
```

---

### ✅ STEP 2: Update Google Apps Script (10 minutes)

**Location:** Google Sheet → Extensions > Apps Script

1. [ ] Open your existing Google Apps Script project
2. [ ] Open the file "Code.gs"
3. [ ] **Select ALL code** (Ctrl+A or Cmd+A)
4. [ ] **Delete everything**
5. [ ] Open this repository's `Code.gs` file
6. [ ] **Copy ALL code** from it
7. [ ] **Paste into your script editor**
8. [ ] **Save** (Ctrl+S or Cmd+S)
9. [ ] Click **Deploy** button
10. [ ] Choose "Manage deployments" (pencil icon)
11. [ ] Edit the "New deployment"
12. [ ] Click **Deploy**
13. [ ] Done! Your Google Apps Script is updated.

---

### ✅ STEP 3: Clear Browser Cache (2 minutes)

1. [ ] Go to https://dr-janak-appointments.vercel.app
2. [ ] Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. [ ] Or: Ctrl+Click refresh button to force clear cache

---

### ✅ STEP 4: Test the System (15 minutes)

#### Welcome Screen:
- [ ] App loads with "Dr. Janak's Clinic" header
- [ ] Two buttons visible: "Nurse" and "Doctor"
- [ ] Smooth animations visible

#### Nurse Role Testing:
- [ ] Click "Nurse"
- [ ] Two tabs visible: "View Appointments" and "Book Appointment"
- [ ] "View Appointments" tab shows your appointments
- [ ] Today's summary shows count

#### Book Appointment Test:
- [ ] Click "Book Appointment" tab
- [ ] Fill in:
  - [ ] Patient Name: "John Doe"
  - [ ] Phone: "9876543210"
  - [ ] Date: "07-12-2025" (DD-MM-YYYY format)
  - [ ] Time: Select from dropdown (should show 09:00 to 18:00)
  - [ ] Check "New Patient"
  - [ ] Click "Book Appointment"
- [ ] Success message appears
- [ ] New appointment appears in Google Sheet

#### Check-in Test:
- [ ] Go to "View Appointments"
- [ ] Find your newly created appointment
- [ ] Click the ✓ (checkmark) icon
- [ ] Patient should show "Checked In" badge
- [ ] Google Sheet column I should change to "Yes"

#### Reschedule Test:
- [ ] Click ✏️ (edit) icon on an appointment
- [ ] Modal dialog appears
- [ ] Change date to "08-12-2025"
- [ ] Change time to "14:30"
- [ ] Click "Reschedule"
- [ ] Google Sheet should update date/time

#### Doctor Role Testing:
- [ ] Go back to welcome (click "Home")
- [ ] Click "Doctor"
- [ ] Same features as Nurse
- [ ] Cannot see delete button (expected for safety)

#### Mobile Testing:
- [ ] Open in phone browser
- [ ] All buttons should be touch-friendly
- [ ] Layout should stack vertically
- [ ] Functionality should work same as desktop

---

## 🐛 If Something Doesn't Work

### App not loading:
1. [ ] Clear browser cache completely
2. [ ] Check you're using correct URL: https://dr-janak-appointments.vercel.app
3. [ ] Try different browser
4. [ ] Check browser console for errors (F12)

### No appointments showing:
1. [ ] Verify "checkedIn" column exists in sheet (column I)
2. [ ] Refresh app (Ctrl+Shift+R)
3. [ ] Check that your sheet has data in correct format

### Dates not showing as DD-MM-YYYY:
1. [ ] Hard refresh browser (Ctrl+Shift+R)
2. [ ] Clear browser cache
3. [ ] Check that dates in sheet are in YYYY-MM-DD format (they convert automatically)

### Check-in not saving:
1. [ ] Verify you updated Google Apps Script with latest Code.gs
2. [ ] Check "checkedIn" column exists
3. [ ] Try refreshing the app

### Can't book appointment:
1. [ ] Fill ALL required fields (marked with *)
2. [ ] Phone must be exactly 10 digits
3. [ ] Date must be DD-MM-YYYY format
4. [ ] Time must be selected from dropdown
5. [ ] Check browser console for error messages

---

## 📊 Data Verification

After setup, verify in Google Sheet:

- [ ] Column I header is "checkedIn"
- [ ] When you check in a patient, column I changes to "Yes"
- [ ] When you reschedule, columns E and F update
- [ ] New bookings add rows automatically
- [ ] Dates are stored as YYYY-MM-DD in sheet
- [ ] Times are stored as HH:MM in sheet

---

## ✨ Features to Try

Once setup is complete, test these features:

- [ ] Book appointment with all fields
- [ ] Check in patient (✓ icon)
- [ ] Uncheck patient (click ✓ again)
- [ ] Reschedule appointment (✏️ icon)
- [ ] Delete appointment (🗑️ icon - Nurse only)
- [ ] View appointments list
- [ ] See today's count
- [ ] Switch between tabs
- [ ] Switch between roles (Nurse/Doctor)
- [ ] Responsive design on mobile

---

## 📱 Mobile Installation (Optional)

To install as app on phone:

**iPhone:**
1. Open app in Safari
2. Tap share button (square with arrow)
3. Tap "Add to Home Screen"
4. Give it a name (e.g., "Dr. Janak")
5. Tap "Add"
6. App appears on home screen

**Android:**
1. Open app in Chrome
2. Tap menu (⋮)
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install"
5. App appears on home screen

---

## 🎯 Deployment Verification

✅ **Vercel Auto-Deployment:**
- Your GitHub repo is connected to Vercel
- Every time you push code, it auto-deploys
- Visit: https://dr-janak-appointments.vercel.app

✅ **Production URL:**
- Main: https://dr-janak-appointments.vercel.app
- This is your live production URL

✅ **Status:**
- Check Vercel dashboard for deployment status
- Usually deploys in 1-2 minutes

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ App loads without errors
✅ Welcome screen appears
✅ Can select Nurse or Doctor
✅ Can view appointments
✅ Can book new appointment
✅ New appointment appears in Google Sheet
✅ Can check in patient
✅ Google Sheet updates when checking in
✅ Can reschedule appointment
✅ Google Sheet updates when rescheduling
✅ Mobile layout is responsive
✅ No errors in browser console

---

## 📞 Final Checklist

Before declaring ready:

- [ ] Google Sheet updated with "checkedIn" column
- [ ] Google Apps Script updated and deployed
- [ ] Browser cache cleared
- [ ] App loads at correct URL
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Check-in updates Google Sheet
- [ ] Reschedule updates Google Sheet
- [ ] Date format is DD-MM-YYYY
- [ ] Time format is HH:MM
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Documentation reviewed

---

## 🎓 Next Steps

1. **Complete this checklist** ✅
2. **Test all features** ✅
3. **Share app URL with staff** ✅
4. **Train users** ✅
5. **Go live!** 🚀

---

## 📞 Support Resources

- **README.md** - Quick start guide
- **DEPLOYMENT_INSTRUCTIONS.md** - Detailed setup
- **FINAL_SYSTEM_OVERVIEW.md** - Complete features
- **Code.gs** - Commented backend code
- **src/App.jsx** - Commented React component

---

## 🎉 You're Ready!

Your professional appointment system is complete and live.

**App URL:** https://dr-janak-appointments.vercel.app

**Date Created:** December 7, 2025
**Status:** Production Ready ✅
**Version:** 2.0 (Professional)

Good luck with your new appointment system! 🚀
