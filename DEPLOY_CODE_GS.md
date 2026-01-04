# 🚀 Deploy Updated Code.gs to Google Apps Script

## CRITICAL: You must do this to make login work!

### Step 1: Open Google Apps Script
1. Go to your Google Sheet
2. Click **Extensions** → **Apps Script**

### Step 2: Replace Code.gs
1. In the Apps Script editor, select all text in Code.gs (Ctrl+A / Cmd+A)
2. Delete it
3. Open the Code.gs file from this project
4. Copy ALL the code
5. Paste it into the Apps Script editor
6. Click **Save** (disk icon)

### Step 3: Run Initialization (First Time Only)
1. In the Apps Script editor, find the function dropdown (top toolbar)
2. Select `initializeSpreadsheet`
3. Click **Run** (▶️ play button)
4. If prompted, click **Review permissions** → Select your Google account → **Allow**
5. Wait for "Execution completed" message

### Step 4: Verify Sheets Were Created
Go back to your Google Sheet and verify these 3 sheets exist:
- ✅ **Appointments** (13 columns)
- ✅ **Patients** (10 columns)
- ✅ **Users** (5 columns)

### Step 5: Add a User Manually
1. Go to the **Users** sheet
2. In Row 2 (first data row), enter:
   - **id**: `janak`
   - **password**: `password123` (or your preferred password)
   - **role**: `head-doctor` (exactly lowercase with hyphen)
   - **doctorName**: `Dr. Janak`
   - **status**: `active` (exactly lowercase)

Example:
```
Row 1: id | password | role | doctorName | status
Row 2: janak | password123 | head-doctor | Dr. Janak | active
```

### Step 6: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Fill in:
   - **Description**: "v2 - Login + Roles + Patient Master"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. Copy the **Web app URL** (it should match your existing one)

### Step 7: Test Directly
1. Open the Web app URL in a new browser tab
2. Add `?action=read&type=login&id=janak&password=password123` to the URL
3. You should see JSON response with `success: true`

Example:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=read&type=login&id=janak&password=password123
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "janak",
    "role": "head-doctor",
    "doctorName": "Dr. Janak"
  }
}
```

---

## ✅ Once this is done, refresh your Vercel app and login should work!

---

## Troubleshooting

**"Users sheet not found" error:**
- Re-run `initializeSpreadsheet()` function

**"Invalid ID or password" error:**
- Double-check the Users sheet has the exact values (case-sensitive!)
- Make sure there are no extra spaces

**"Permission denied" error:**
- Re-deploy with "Execute as: Me" and "Who has access: Anyone"
