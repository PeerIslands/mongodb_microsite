# Azure Static Web App - Deployment Issues Fixed

## 🔴 Problems You Encountered

### 1. MIME Type Error
```
Failed to load module script: Expected a JavaScript module script 
but the server responded with a MIME type of "application/octet-stream"
```

**Cause**: Missing `staticwebapp.config.json` file that tells Azure how to serve different file types.

**Fix**: ✅ Created `frontend/staticwebapp.config.json` with proper MIME type mappings.

---

### 2. 404 Error for Assets
```
GET https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net/vite.svg 404 (Not Found)
```

**Cause**: Two issues:
1. Wrong output directory in GitHub Actions workflow (`build` instead of `dist`)
2. Missing `vite.svg` file in the public folder

**Fix**: 
- ✅ Updated workflow to use `dist` as output location
- ✅ Created `frontend/public/vite.svg`
- ✅ Created `frontend/public/favicon.ico`

---

## ✅ What Was Fixed

### 1. Created `frontend/staticwebapp.config.json`
This file configures:
- ✅ MIME types for `.js`, `.css`, `.svg`, `.png`, etc.
- ✅ SPA routing (no 404 on page refresh)
- ✅ Security headers
- ✅ Cache control for better performance

### 2. Updated `.github/workflows/azure-static-web-apps-ashy-glacier-09cfe4b0f.yml`
- ✅ Changed `output_location` from `"build"` to `"dist"` (Vite's default)
- ✅ Added environment variable support (`VITE_API_BASE_URL`)
- ✅ Added missing token to close_pull_request_job

### 3. Created Missing Assets
- ✅ `frontend/public/vite.svg` - Vite logo
- ✅ `frontend/public/favicon.ico` - Favicon

### 4. Updated `frontend/vite.config.ts`
- ✅ Improved build configuration
- ✅ Proper asset directory structure

---

## 🚀 How to Deploy the Fix

### Step 1: Commit and Push Changes

```bash
# Make sure you're in the project root
cd /Users/sree/Desktop/Desktop\ -\ Sreekanth\'s\ MacBook\ Pro/MonogoDV/mongodb_microsite

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix Azure Static Web App deployment - correct MIME types and output directory"

# Push to your branch (replace 'develop' with your branch name if different)
git push origin develop
```

### Step 2: GitHub Actions Will Automatically Deploy

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Watch the **Azure Static Web Apps CI/CD** workflow run
4. Wait 2-5 minutes for deployment to complete

### Step 3: Verify the Fix

1. Once deployment is complete, visit: `https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net`
2. Open browser DevTools (F12)
3. Check the Console tab - no more MIME errors!
4. Check the Network tab - all assets loading with 200 status
5. Refresh the page - no 404 errors

---

## 📋 Additional Configuration (Optional)

### Set Backend API URL

If you have a backend API, configure it:

**Option A: GitHub Secrets (Recommended for build-time)**

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-api.azurewebsites.net`
5. Re-deploy (push new commit or re-run workflow)

**Option B: Azure Portal (For runtime configuration)**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App (ashy-glacier-09cfe4b0f)
3. Click **Configuration** in the left menu
4. Click **+ Add**
5. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL
6. Click **OK** and **Save**

---

## 🔍 Understanding the Errors

### What is a MIME Type Error?

**MIME (Multipurpose Internet Mail Extensions)** types tell the browser what kind of file it's receiving.

- JavaScript files need: `text/javascript`
- CSS files need: `text/css`
- SVG files need: `image/svg+xml`

Azure Static Web Apps uses `staticwebapp.config.json` to know which MIME type to use for each file extension. Without this file, Azure serves everything as `application/octet-stream` (generic binary), which breaks JavaScript module loading.

### Why Was the Output Directory Wrong?

Vite (your build tool) outputs to `dist/` by default, but Azure was configured to look in `build/`. This meant:
- The build created files in `frontend/dist/`
- Azure looked for files in `frontend/build/`
- Result: No files found = 404 errors

---

## 📁 Important Files

### `frontend/staticwebapp.config.json` (Critical!)
**DO NOT DELETE THIS FILE**

This file is essential for:
- Correct MIME types
- SPA routing
- Security headers

If you delete it, you'll get the same errors again.

### `frontend/vite.config.ts`
Configures the Vite build process. The `outDir: 'dist'` setting must match the `output_location` in the GitHub Actions workflow.

### `.github/workflows/azure-static-web-apps-ashy-glacier-09cfe4b0f.yml`
Your deployment pipeline. Key settings:
- `app_location: "./frontend"` - Where your source code is
- `output_location: "dist"` - Where Vite builds to (MUST match vite.config.ts)

---

## 🧪 Testing Locally Before Deploy

Always test your build locally before deploying:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Preview the production build
npm run preview
```

This will start a local server at `http://localhost:4173` serving the built files, exactly as Azure will serve them.

**Check for:**
- ✅ No console errors
- ✅ All assets loading
- ✅ Routing works (try refreshing different pages)
- ✅ API calls work (if backend is running)

---

## 🛡️ Best Practices Going Forward

### 1. Always Keep `staticwebapp.config.json`
This file is **required** for Azure Static Web Apps to work correctly. Treat it like `package.json` - don't delete it.

### 2. Test Builds Locally
Before pushing, run:
```bash
npm run build
npm run preview
```

### 3. Check GitHub Actions Logs
After pushing, always check the Actions tab to ensure deployment succeeded.

### 4. Use Environment Variables Properly
- Never hardcode API URLs in source code
- Use `import.meta.env.VITE_API_BASE_URL` in your code
- Configure the actual URL in GitHub Secrets or Azure Portal

### 5. Monitor Your Deployment
Use Azure Portal to:
- View deployment history
- Check logs
- Monitor performance
- Set up alerts

---

## 🔄 Deployment Checklist

Use this checklist for every deployment:

- [ ] Code changes committed
- [ ] Build tested locally (`npm run build` + `npm run preview`)
- [ ] No console errors in local preview
- [ ] All required files present:
  - [ ] `frontend/staticwebapp.config.json`
  - [ ] `frontend/vite.config.ts`
  - [ ] `.github/workflows/azure-static-web-apps-*.yml`
- [ ] Environment variables configured (if needed)
- [ ] Pushed to correct branch (develop)
- [ ] GitHub Actions workflow completed successfully
- [ ] Tested live site after deployment
- [ ] Checked browser console for errors
- [ ] Verified all pages/routes work

---

## 📊 Quick Reference

### Your Deployment Info

| Setting | Value |
|---------|-------|
| **Live URL** | `https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net` |
| **Branch** | `develop` |
| **App Location** | `./frontend` |
| **Output Location** | `dist` |
| **Build Command** | `npm run build` (automatic) |
| **Framework** | React + Vite + TypeScript |

### Important Commands

```bash
# Local development
cd frontend
npm run dev               # Start dev server (localhost:5173)

# Build & test
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build (localhost:4173)
npm run lint             # Check for linting errors

# Deploy
git add .
git commit -m "Your message"
git push origin develop  # Triggers automatic deployment
```

---

## 🆘 If You Still Have Issues

### Clear Browser Cache
Sometimes browsers cache old files aggressively:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Check Build Logs
1. Go to GitHub → Actions
2. Click on the latest workflow run
3. Expand "Build And Deploy"
4. Look for error messages

### Check Azure Portal
1. Go to portal.azure.com
2. Find your Static Web App
3. Click "Environments" → "Production"
4. Check deployment logs

### Common Issues

**Issue**: Still getting MIME errors after deploying
**Solution**: 
- Clear browser cache
- Verify `staticwebapp.config.json` is in the repository
- Check GitHub Actions log to ensure file was deployed

**Issue**: Assets still returning 404
**Solution**:
- Verify `output_location: "dist"` in workflow
- Check `outDir: 'dist'` in vite.config.ts
- Run local build and verify files are in `frontend/dist/`

**Issue**: Changes not appearing
**Solution**:
- Check GitHub Actions completed successfully
- Wait 2-3 minutes for CDN cache to clear
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

---

## ✅ Summary

**What was wrong**:
1. ❌ Missing `staticwebapp.config.json` → Wrong MIME types
2. ❌ Wrong output directory in workflow → Files not found
3. ❌ Missing vite.svg file → 404 error

**What's fixed**:
1. ✅ Created `staticwebapp.config.json` with proper MIME types
2. ✅ Updated workflow to use `dist` output directory
3. ✅ Created missing asset files
4. ✅ Improved build configuration

**Next steps**:
1. Commit and push changes
2. Watch GitHub Actions deploy
3. Test your live site
4. Configure backend API URL (if needed)

---

**Your site should now work perfectly! 🎉**

Just push your changes and wait for deployment to complete.

If you have any issues, refer to the troubleshooting sections above.

