# Pre-Deployment Checklist

## ✅ Security Verification

- [ ] `.env.local` exists in project root
- [ ] `.env.local` contains `VITE_GAS_API_URL=https://script.google.com/...`
- [ ] Verified `.env.local` is in `.gitignore` 
- [ ] Run `git status` - `.env.local` should NOT appear
- [ ] No API URL in `src/services/api.js` source code
- [ ] `Code.gs` does not expose sensitive information

## ✅ Local Testing

- [ ] Ran `npm install` successfully
- [ ] Ran `npm run dev` successfully
- [ ] App loads at `http://localhost:5173`
- [ ] Can select Nurse role
- [ ] Can add appointment (check browser console for API logs)
- [ ] Can see appointment in Google Sheet
- [ ] Can switch to Doctor role
- [ ] Can view appointments in Doctor dashboard

## ✅ Google Apps Script Setup

- [ ] Created Google Sheet named "Dr. Janak Appointments"
- [ ] Created Apps Script from within the spreadsheet (Extensions > Apps Script)
- [ ] Pasted Code.gs content into script editor
- [ ] Ran `initializeSpreadsheet()` function
- [ ] Authorized the script (clicked "Allow")
- [ ] Deployed as Web App (Execute as: Me, Who has access: Anyone)
- [ ] Copied the Web App URL
- [ ] Added URL to `.env.local` as `VITE_GAS_API_URL`

## ✅ GitHub Preparation

- [ ] Have other GitHub account ready (or created)
- [ ] Repository name: `Dr-Janak-Appointments`
- [ ] Repository is PUBLIC
- [ ] Have been added as collaborator (if using separate account)

## ✅ Git Status

```bash
# Run these commands to verify:
git status
# Should show NO .env.local (it's in .gitignore)

git ls-files | grep env
# Should only show: .env.example (not .env.local)
```

## ✅ Ready to Deploy?

If all above are checked, you're ready!

### Run These Commands:

```bash
# 1. Verify no secrets in git
git status

# 2. Add remote (replace OTHER_USERNAME)
git remote add origin https://github.com/OTHER_USERNAME/Dr-Janak-Appointments.git

# 3. Push to GitHub
git branch -M main
git push -u origin main

# 4. When prompted, use:
# Username: OTHER_USERNAME (account hosting the repo)
# Password: Personal Access Token (from https://github.com/settings/tokens)
```

### Then on GitHub:

```
Settings > Secrets and variables > Actions > New secret
Name: VITE_GAS_API_URL
Value: https://script.google.com/macros/s/.../exec
```

### Finally:

- Wait 1-2 minutes for GitHub Actions to build
- Visit: `https://OTHER_USERNAME.github.io/Dr-Janak-Appointments/`
- Test the app!

## 🆘 If Something Doesn't Work

### "API URL not configured" error
- [ ] Check `.env.local` exists
- [ ] Check it has `VITE_GAS_API_URL=...`
- [ ] Restart `npm run dev`

### "Failed to connect" on localhost
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for error messages
- [ ] Verify Web App URL in `.env.local` is correct
- [ ] Try opening the Web App URL directly in browser

### "Failed to connect" on GitHub Pages
- [ ] Go to repository Actions tab
- [ ] Check if deploy workflow succeeded
- [ ] Verify GitHub Secret `VITE_GAS_API_URL` was added
- [ ] Try rebuilding: Push an empty commit
  ```bash
  git commit --allow-empty -m "Trigger rebuild"
  git push
  ```

### Git Push Authentication Error
- [ ] Use Personal Access Token, not password
- [ ] Create at: https://github.com/settings/tokens
- [ ] Select scopes: repo, workflow
- [ ] Use token as password when pushing

## 📞 Quick Reference

| What | Where |
|------|-------|
| API URL (local) | `.env.local` |
| API URL (template) | `.env.example` |
| Setup instructions | `SETUP_GUIDE.md` |
| Deploy instructions | `GITHUB_DEPLOY.md` |
| Security info | `SECURITY.md` |
| Deployment status | `DEPLOYMENT_READY.md` |
| GitHub Actions logs | Repository > Actions tab |
| GitHub Secrets | Settings > Secrets and variables > Actions |
| GitHub Pages URL | Settings > Pages |

---

**Last Updated:** December 6, 2025
**Status:** Ready for Deployment ✅
