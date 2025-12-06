# Quick Deploy to GitHub Pages (Securely)

## Step 1: Setup Environment Variables Locally

```bash
cd /Users/AC/Desktop/Dr_Janak_Appointment_App

# Create .env.local (copy from .env.example)
cp .env.example .env.local

# Edit .env.local and add your Google Apps Script URL
# VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_ID/exec

# This file is in .gitignore - it will NOT be pushed to GitHub
```

## Step 2: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Dr. Janak Appointment System"
```

## Step 3: Push to GitHub

```bash
# Replace OTHER_USERNAME with the account hosting the repo
git remote add origin https://github.com/OTHER_USERNAME/Dr-Janak-Appointments.git
git branch -M main
git push -u origin main
```

## Step 4: Add API URL as GitHub Secret

**IMPORTANT:** Your API URL needs to be accessible when GitHub Actions builds the app.

1. Go to your repository: `https://github.com/OTHER_USERNAME/Dr-Janak-Appointments`
2. Click **Settings** (top menu)
3. Click **Secrets and variables** > **Actions** (left sidebar)
4. Click **New repository secret**
5. Add:
   - **Name:** `VITE_GAS_API_URL`
   - **Value:** Your Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)
6. Click **Add secret**

The GitHub Actions workflow will automatically use this secret when building!

## Step 5: Enable GitHub Pages

1. Go to **Settings** > **Pages**
2. Under "Build and deployment":
   - **Source:** "GitHub Actions"
   - (the workflow will auto-deploy)
3. Wait 1-2 minutes for the first deployment

## Step 6: Access Your App

Your app will be available at:
```
https://OTHER_USERNAME.github.io/Dr-Janak-Appointments/
```

## Security Summary

✅ **Your API URL is secure:**
- Not visible in the GitHub repository
- Stored only in GitHub Secrets
- Used only during GitHub Actions build
- Never exposed in the frontend code

✅ **Local development:**
- Uses `.env.local` (ignored by git)
- Each developer can have their own API URL

---

**Testing:**
1. Visit your GitHub Pages URL
2. Select Nurse role
3. Add a test appointment
4. Check your Google Sheet - it should appear there!
5. Switch to Doctor role and view the appointment
