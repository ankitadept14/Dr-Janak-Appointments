# Setup Guide for Dr. Janak Appointment System

## Quick Start Checklist

### ✅ Step 1: Install Node.js
Before proceeding, you need Node.js installed on your system.

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/
```

**Verify installation:**
```bash
node --version
npm --version
```

### ✅ Step 2: Install Dependencies
```bash
cd /Users/AC/Desktop/Dr_Janak_Appointment_App
npm install
```

### ✅ Step 3: Configure Google Apps Script

1. **Create Google Sheet:**
   - Go to https://sheets.google.com
   - Create a new spreadsheet
   - Name it "Dr. Janak Appointments"
   - **IMPORTANT: Do NOT close this spreadsheet** - you'll create the script from within it

2. **Set up Apps Script (FROM WITHIN THE SPREADSHEET):**
   - **While in the "Dr. Janak Appointments" spreadsheet**, go to: Extensions > Apps Script
   - This creates a "container-bound" script that ONLY has access to this one spreadsheet
   - Delete any existing code in the editor
   - Copy the entire content from `Code.gs` file
   - Name your project (top-left): "Dr. Janak Appointment API"
   - Save the project (Ctrl+S or Cmd+S)
   - **The script is now bound ONLY to "Dr. Janak Appointments" spreadsheet**

3. **Initialize and Authorize the spreadsheet:**
   - Select `initializeSpreadsheet` from the function dropdown
   - Click the "Run" button (▶️)
   - **Authorization Steps:**
     - Click "Review permissions"
     - Choose your Google account (ankitc26@gmail.com)
     - You should see: "This will allow Dr. Janak Appointment API to: See, edit, create, and delete only the specific Google Drive files you use with this app"
     - Click "Advanced" if you see unverified warning
     - Click "Go to Dr. Janak Appointment API (unsafe)"
     - Click "Allow"
   - Check your sheet - it should now have headers in the Appointments tab
   - **If you see "access to all sheets"**: You created it wrong. Remove permissions at https://myaccount.google.com/permissions and recreate from within the sheet
4. **Deploy as Web App:**
   - Click "Deploy" > "New deployment"
   - Click the gear icon next to "Select type" > Choose "Web app"
   - Settings:
     - Description: "Dr. Janak Appointment API v1"
     - Execute as: "Me (ankitc26@gmail.com)"
     - Who has access: "Anyone"
   - Click "Deploy"
   - **You should NOT see the unverified app warning now** (since you already authorized in step 3)
   - Copy the Web App URL (it looks like: https://script.google.com/macros/s/.../exec)
   - Click "Done"

### ✅ Step 4: Configure Frontend API (Securely)

**IMPORTANT: Never commit your API URL to GitHub!**

1. **Create a `.env.local` file** in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. **Open `.env.local`** and add your Web App URL:
   ```
   VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

3. **`.env.local` is automatically ignored by git** (see `.gitignore`)
   - Your API URL will NOT be visible in GitHub
   - Other developers can copy `.env.example` and add their own URL

4. **For GitHub Pages deployment:**
   - Add the API URL as a GitHub Actions secret
   - Or use a public API key from your Google Apps Script (advanced)

### ✅ Step 5: Test Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**If you see CORS error on localhost:**
The app uses a CORS proxy (cors-anywhere.herokuapp.com) for localhost development. If the proxy is blocked:
1. Visit https://cors-anywhere.herokuapp.com/corsdemo
2. Click "Request temporary access to the demo server"
3. Then reload your app

(The CORS proxy is NOT used when deployed to GitHub Pages - direct CORS works there)

**Test the app:**
1. Select "Nurse" role
2. Try adding a test appointment
3. Check if it appears in your Google Sheet
4. Try checking in the patient
5. Switch to "Doctor" role and view the appointment

### ✅ Step 6: Create App Icons (Optional for PWA)

You need two icon files in the `public` folder:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Quick way to create icons:**
1. Use any image editor or online tool like Canva
2. Create a simple icon with medical theme (stethoscope, cross, etc.)
3. Export in two sizes: 192x192 and 512x512
4. Save them in the `public` folder

**Or use a placeholder:**
You can use any square image temporarily and resize it.

### ✅ Step 7: Deploy to GitHub Pages

1. **Create GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub:**
   ```bash
   # Replace with your GitHub username and repo name
   git remote add origin https://github.com/YOUR_USERNAME/Dr_Janak_Appointment_App.git
   git branch -M main
   git push -u origin main
   ```

3. **Update vite.config.js:**
   - Change the `base` property to match your repo name:
     ```javascript
     base: '/Dr_Janak_Appointment_App/'
     ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Settings > Pages
   - Source: Deploy from branch
   - Branch: gh-pages
   - Click Save

Your app will be available at:
`https://YOUR_USERNAME.github.io/Dr_Janak_Appointment_App/`

### ✅ Step 8: Install as PWA

**On Android (Chrome):**
1. Open your deployed app URL
2. Tap the three-dot menu
3. Select "Add to Home screen"
4. Tap "Add"

**On iOS (Safari):**
1. Open your deployed app URL
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

## Troubleshooting

### Problem: "This app wants access to all your Google Sheets"
- **Solution**: Make sure you created the script FROM WITHIN the spreadsheet (Extensions > Apps Script)
- Do NOT create a standalone Apps Script project
- The script must be "container-bound" to the specific spreadsheet
- If you created it standalone, delete it and recreate from within the sheet

### How to Remove/Revoke Permissions:
1. Go to https://myaccount.google.com/permissions
2. Find "Dr. Janak Appointment API" or "Untitled project" in the list
3. Click on it and select "Remove Access"
4. Then follow the setup steps again to authorize it correctly (from within the spreadsheet)

### Problem: "Failed to connect to server. Please check your API configuration"
**Steps to debug:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages with the API URL
4. Check if the URL is correct: `https://script.google.com/macros/s/YOUR_ID/exec`
5. Make sure the Apps Script is deployed as a Web App
6. Verify "Who has access" is set to "Anyone"
7. Try opening the Web App URL directly in browser - you should see `{"success":true,"appointments":[]}`
8. If deployment URL doesn't work, redeploy the Web App

### Problem: PWA not installing
- Ensure you're using HTTPS (GitHub Pages provides this)
- Check that manifest.json is accessible
- Verify icon files exist and are valid PNG files
- Clear browser cache and try again

### Problem: Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Make sure Node.js version is 16 or higher

## Next Steps

1. Test all features thoroughly
2. Customize colors and branding in `App.css`
3. Add more features as needed
4. Set up proper authentication if required
5. Consider backup/export functionality

## Need Help?

- Check the README.md for detailed documentation
- Review the code comments in each file
- Test with sample data before real patient information
- Consider data privacy and HIPAA compliance for production use

---

**Important Security Note:**
This app is designed for demonstration purposes. For production use with real patient data, implement proper authentication, encryption, and compliance with healthcare regulations (HIPAA, GDPR, etc.).
