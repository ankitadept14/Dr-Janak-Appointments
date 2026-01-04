# 🔧 Fix: Setup Environment Variables in Vercel

## Problem
The app is getting HTTP 500 error because Vercel doesn't have the `VITE_GAS_API_URL` environment variable set.

## Solution (2 minutes)

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com
2. Sign in with your GitHub account
3. Click on your "Dr-Janak-Appointments" project

### Step 2: Add Environment Variable
1. Click **Settings** (in top menu)
2. Click **Environment Variables** (in left sidebar)
3. Click **Add New**
4. Fill in:
   - **Name**: `VITE_GAS_API_URL`
   - **Value**: `https://script.google.com/macros/s/AKfycbxfD1Wp6mPph1qiWxdttqJp4nBbAKP8dK-63rcH9jQORZrCFT6Tn6oiLpnVqLyhUnFs/exec`
   - **Environments**: Select all (Development, Preview, Production)

5. Click **Save**

### Step 3: Redeploy
1. Click on the project name to go back to deployments
2. Find the last deployment 
3. Click the "..." menu → "Redeploy"
4. Click "Redeploy" again to confirm

### Step 4: Wait for Deployment
- Vercel will redeploy in about 1-2 minutes
- You should see a green checkmark when it's done

### Step 5: Test
1. Go to: https://dr-janak-appointments.vercel.app
2. Hard refresh (Ctrl+Shift+R)
3. The app should now work without errors!

---

## Troubleshooting

**Still getting 500 error?**
1. Check that environment variable is set correctly (copy-paste the entire URL)
2. Hard refresh browser (Ctrl+Shift+R)
3. Check Vercel deployment status (should be "Ready")
4. Open browser console (F12) to see exact error

**Can't find Settings in Vercel?**
1. Make sure you're in the right project
2. Click the project name, then click "Settings" tab
3. Look for "Environment Variables" in the left sidebar

---

## Your Google Apps Script URL:
```
https://script.google.com/macros/s/AKfycbxfD1Wp6mPph1qiWxdttqJp4nBbAKP8dK-63rcH9jQORZrCFT6Tn6oiLpnVqLyhUnFs/exec
```

Copy this exactly to Vercel environment variables.

---

**Once this is done, your app will work!** ✅
