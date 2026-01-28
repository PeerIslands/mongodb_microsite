# Troubleshooting: MIME Type Error in Azure Static Web Apps

## Error Message
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream"
```

## Root Cause
Azure Static Web Apps CDN is serving JavaScript files with incorrect MIME type.

## Solutions (Try in Order)

### 1. Clear Browser Cache (FIRST TRY)
**Most likely fix if deployment just completed!**

- **Chrome/Edge:** `Ctrl+Shift+Delete` → Clear cached images and files
- **Hard Refresh:** `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- **Incognito Mode:** Open site in private/incognito window

### 2. Purge Azure CDN Cache
**Required after any config changes!**

#### Via Azure Portal:
1. Go to Azure Portal → Your Static Web App
2. Click **"Overview"**
3. Click **"Purge"** or **"Clear Cache"**
4. Wait 5-10 minutes

#### Via Azure CLI:
```bash
az staticwebapp clear --name mongodb-microsite --resource-group <your-resource-group>
```

### 3. Verify Configuration Deployed
Check GitHub Actions logs for:
```
✓ staticwebapp.config.json found in dist/
✓ routes.json fallback found in dist/
✓ staticwebapp.config.json confirmed in frontend root
📄 Config file content (first 20 lines):
```

### 4. Check Deployed Files in Azure
1. Azure Portal → Static Web App
2. Click **"Files"** or **"Environment"**
3. Verify `staticwebapp.config.json` exists in root
4. Download and verify contents match your repo

### 5. Restart Azure Static Web App
Sometimes Azure needs a restart to pick up config changes:

```bash
# Via Azure CLI
az staticwebapp restart --name mongodb-microsite --resource-group <your-resource-group>
```

Or in Portal:
1. Go to your Static Web App
2. Click **"Stop"**
3. Wait 30 seconds
4. Click **"Start"**

### 6. Wait for CDN Propagation
Azure CDN caching can be aggressive:
- **Minimum wait:** 30 minutes
- **Recommended wait:** 1-2 hours
- CDN nodes update at different rates

### 7. Check Response Headers in Browser
**Verify what Azure is actually serving:**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Click on any `.js` file in `/assets/`
5. Check **Response Headers**:

**Should show:**
```
Content-Type: application/javascript; charset=utf-8
```

**If it shows:**
```
Content-Type: application/octet-stream
```
→ Config not being read OR CDN still cached

### 8. Verify Config File Syntax
The config file should be valid JSON. Check for:
- No trailing commas
- Proper quote escaping
- Valid route patterns

Run locally:
```bash
cd frontend
cat staticwebapp.config.json | jq .
```

If `jq` not installed:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('staticwebapp.config.json', 'utf8')))"
```

### 9. Nuclear Option: Redeploy from Scratch

#### Option A: Manual Trigger
1. Go to GitHub → Actions
2. Find the workflow run
3. Click **"Re-run all jobs"**

#### Option B: Force Push
```bash
git commit --allow-empty -m "Force redeploy to clear Azure cache"
git push origin develop
```

#### Option C: Delete Deployment (Last Resort)
1. Azure Portal → Static Web App
2. Overview → Delete
3. Wait 5 minutes
4. Redeploy (will get new URL or re-create)

### 10. Contact Azure Support
If nothing works after 2+ hours:

**Provide them with:**
- Deployment logs from GitHub Actions
- Your `staticwebapp.config.json` file
- Response headers from browser DevTools
- Error message screenshots

**Tell them:**
"Azure Static Web Apps is not respecting the MIME types configured in 
staticwebapp.config.json. JavaScript files are being served with 
Content-Type: application/octet-stream instead of application/javascript."

## Quick Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Try incognito mode
- [ ] Purge Azure CDN cache
- [ ] Wait 30+ minutes
- [ ] Verify config file deployed
- [ ] Check response headers in DevTools
- [ ] Restart Azure Static Web App
- [ ] Force redeploy

## Expected Working State

**Correct Response Headers:**
```
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8
Cache-Control: public, max-age=31536000, immutable
X-Content-Type-Options: nosniff
```

**Files That Must Exist:**
```
dist/
  ├── index.html
  ├── staticwebapp.config.json  ← MUST BE HERE
  ├── routes.json               ← Fallback
  └── assets/
      └── *.js                  ← Served as application/javascript
```

## Why This Is So Difficult

Azure Static Web Apps has **aggressive multi-layer CDN caching:**

1. **Edge CDN Cache** (client-side) - 24 hours
2. **Regional CDN Cache** - 1-2 hours  
3. **Platform Cache** - varies
4. **Browser Cache** - based on Cache-Control

**All layers must be cleared or expired!**

---

## Prevention

To avoid this in future:

1. Always purge CDN after config changes
2. Test in incognito mode
3. Wait adequate time after deployment
4. Use Azure CLI to force cache clear
5. Consider using query string versioning (`?v=123`)

---

**Note:** If error persists after following ALL steps and waiting 2+ hours, 
this is likely an Azure platform bug. Contact Azure Support.

