# Azure Static Web App - Environment Variables Configuration

## 📋 Environment Variables for Frontend

### ⚠️ Security Notice

**IMPORTANT**: The following backend variables should **NEVER** be exposed to the frontend:
- ❌ `MONGODB_URI` - Database credentials
- ❌ `AZURE_BLOB_SAS_URL` (with SAS token) - Write access credentials
- ❌ `SECRET_KEY` - Backend security keys
- ❌ `HOST`/`PORT` - Backend server configuration

**Only frontend-safe variables are included below.**

---

## 🔧 Frontend Environment Variables (Azure Static Web Apps Format)

### JSON Format (for Azure Portal)

Use this format when configuring in Azure Portal → Static Web App → Configuration:

```json
[
  {
    "name": "VITE_PROJECT_NAME",
    "value": "MongoDB Microsite"
  },
  {
    "name": "VITE_VERSION",
    "value": "0.1.0"
  },
  {
    "name": "VITE_API_BASE_URL",
    "value": "https://your-backend-api.azurewebsites.net"
  },
  {
    "name": "VITE_API_V1_STR",
    "value": "/api/v1"
  },
  {
    "name": "VITE_AZURE_BLOB_BASE_URL",
    "value": "https://mmsuploads.blob.core.windows.net/casestudies"
  }
]
```

---

## 📝 Variable Descriptions

### 1. `VITE_PROJECT_NAME`
- **Purpose**: Application name for display in UI
- **Type**: Public
- **Example**: `"MongoDB Microsite"`
- **Usage**: Can be used in page titles, headers, etc.

### 2. `VITE_VERSION`
- **Purpose**: Application version number
- **Type**: Public
- **Example**: `"0.1.0"`
- **Usage**: Display in footer, about page, or for cache busting

### 3. `VITE_API_BASE_URL` ⭐ **REQUIRED**
- **Purpose**: Backend API base URL
- **Type**: Public (but environment-specific)
- **Local**: `"http://localhost:8000"`
- **Production**: `"https://your-backend-api.azurewebsites.net"`
- **Usage**: All API calls use this as the base URL

### 4. `VITE_API_V1_STR`
- **Purpose**: API version prefix
- **Type**: Public
- **Example**: `"/api/v1"`
- **Usage**: Combined with base URL for API endpoints

### 5. `VITE_AZURE_BLOB_BASE_URL`
- **Purpose**: Base URL for Azure Blob Storage (READ-ONLY, no SAS token)
- **Type**: Public
- **Example**: `"https://mmsuploads.blob.core.windows.net/casestudies"`
- **Usage**: Display images/files already uploaded by backend
- **Note**: Does NOT include SAS token (that stays on backend)

---

## 🚀 How to Configure in Azure Static Web Apps

### Method 1: Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App: `ashy-glacier-09cfe4b0f`
3. Click **Configuration** in the left menu
4. Click **+ Add** for each variable:

#### Add Each Variable:

**Variable 1:**
- Name: `VITE_PROJECT_NAME`
- Value: `MongoDB Microsite`

**Variable 2:**
- Name: `VITE_VERSION`
- Value: `0.1.0`

**Variable 3:** ⭐ **MOST IMPORTANT**
- Name: `VITE_API_BASE_URL`
- Value: `https://your-backend-api.azurewebsites.net`
  *(Replace with your actual backend URL)*

**Variable 4:**
- Name: `VITE_API_V1_STR`
- Value: `/api/v1`

**Variable 5:**
- Name: `VITE_AZURE_BLOB_BASE_URL`
- Value: `https://mmsuploads.blob.core.windows.net/casestudies`

5. Click **OK** for each variable
6. Click **Save** at the top

---

### Method 2: GitHub Secrets (Build-Time Injection)

For variables needed during build time, add them as GitHub Secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each variable (repeat for each):

```
Name: VITE_API_BASE_URL
Value: https://your-backend-api.azurewebsites.net
```

The GitHub Actions workflow is already configured to use these secrets during build.

---

## 🔐 Security Best Practices

### ✅ Safe for Frontend (Public)
These can be exposed in the frontend bundle:
- `VITE_PROJECT_NAME`
- `VITE_VERSION`
- `VITE_API_BASE_URL`
- `VITE_API_V1_STR`
- `VITE_AZURE_BLOB_BASE_URL` (without SAS token)

### ❌ NEVER Expose to Frontend
These must stay on the backend only:
- `MONGODB_URI` / `MONGODB_DB_NAME` (database credentials)
- `AZURE_BLOB_SAS_URL` (contains write access token)
- `SECRET_KEY` (encryption/signing keys)
- `HOST` / `PORT` (backend configuration)
- `BACKEND_CORS_ORIGINS` (backend security settings)

### 🔒 Why Azure Blob SAS URL is Backend-Only

The SAS URL you have includes a **SAS token** that grants **write access**:
```
?sp=racwdl&st=2026-01-08...&sig=qEKZKJOJnbL210csyyxaECtzmtFtLTVAVVuaSCDIpog%3D
```

**If exposed to frontend**:
- ❌ Anyone can read your frontend code
- ❌ Anyone can extract the SAS token
- ❌ Anyone can upload/delete files in your blob storage
- ❌ Security breach!

**Correct Architecture**:
1. Frontend sends file to **Backend API**
2. Backend uploads to Azure Blob using SAS token
3. Backend returns **public URL** (without SAS token) to frontend
4. Frontend displays image using public URL

---

## 📖 Usage in Frontend Code

### Accessing Environment Variables

```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_STR = import.meta.env.VITE_API_V1_STR || '/api/v1';

// Full API endpoint
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_STR}`,
});
```

### Example: Display Project Info

```typescript
// src/components/Footer.tsx
const projectName = import.meta.env.VITE_PROJECT_NAME;
const version = import.meta.env.VITE_VERSION;

return (
  <footer>
    <p>{projectName} v{version}</p>
  </footer>
);
```

### Example: Display Azure Blob Images

```typescript
// src/components/CaseStudyCard.tsx
// Backend returns URL like: "hero-images/2026/01/xyz.jpg"
const blobBaseUrl = import.meta.env.VITE_AZURE_BLOB_BASE_URL;

// Full URL: https://mmsuploads.blob.core.windows.net/casestudies/hero-images/2026/01/xyz.jpg
const imageUrl = `${blobBaseUrl}/${caseStudy.heroImage}`;

return <img src={imageUrl} alt={caseStudy.title} />;
```

**Note**: If your backend already returns full URLs, you don't need `VITE_AZURE_BLOB_BASE_URL`.

---

## 🌍 Environment-Specific Configuration

### Local Development (`.env.local`)

Create `frontend/.env.local`:

```env
VITE_PROJECT_NAME=MongoDB Microsite
VITE_VERSION=0.1.0
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_STR=/api/v1
VITE_AZURE_BLOB_BASE_URL=https://mmsuploads.blob.core.windows.net/casestudies
```

### Production (Azure Static Web Apps)

Configure in Azure Portal as shown above, with production values:

```env
VITE_PROJECT_NAME=MongoDB Microsite
VITE_VERSION=0.1.0
VITE_API_BASE_URL=https://your-production-backend.azurewebsites.net
VITE_API_V1_STR=/api/v1
VITE_AZURE_BLOB_BASE_URL=https://mmsuploads.blob.core.windows.net/casestudies
```

---

## ✅ Configuration Checklist

Before deploying, ensure:

- [ ] `VITE_API_BASE_URL` points to your backend
  - [ ] Local: `http://localhost:8000`
  - [ ] Production: `https://your-backend.azurewebsites.net`
- [ ] Backend CORS allows your frontend domain:
  - [ ] Local: `http://localhost:5173`
  - [ ] Production: `https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net`
- [ ] Azure Blob SAS URL is **NOT** in frontend (stays on backend)
- [ ] Environment variables configured in Azure Portal
- [ ] GitHub Actions workflow has access to secrets (if using build-time injection)

---

## 🧪 Testing Configuration

### Verify Environment Variables are Loaded

1. **Local Development**:
```bash
cd frontend
npm run dev
# Open browser console
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: http://localhost:8000
```

2. **Production** (After deployment):
```javascript
// Open DevTools console on your deployed site
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: https://your-backend.azurewebsites.net
```

### Test API Connectivity

```typescript
// Make a test API call
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/health`);
console.log(response); // Should get 200 OK
```

---

## 🔄 Updating Environment Variables

### In Azure Portal

1. Go to Static Web App → Configuration
2. Click on the variable to edit
3. Update the value
4. Click **Save**
5. **No redeployment needed** (takes effect immediately)

### In GitHub Secrets

1. Go to repository Settings → Secrets → Actions
2. Click on the secret
3. Update the value
4. **Requires redeployment** - push a new commit or re-run workflow

---

## 📊 Quick Reference Table

| Variable | Required | Public | Default | Production Value |
|----------|----------|--------|---------|------------------|
| `VITE_PROJECT_NAME` | No | ✅ Yes | N/A | `MongoDB Microsite` |
| `VITE_VERSION` | No | ✅ Yes | N/A | `0.1.0` |
| `VITE_API_BASE_URL` | **YES** ⭐ | ✅ Yes | `http://localhost:8000` | `https://your-backend.azurewebsites.net` |
| `VITE_API_V1_STR` | No | ✅ Yes | `/api/v1` | `/api/v1` |
| `VITE_AZURE_BLOB_BASE_URL` | No | ✅ Yes | N/A | `https://mmsuploads.blob.core.windows.net/casestudies` |

---

## 🆘 Troubleshooting

### API Calls Failing

**Issue**: API calls return CORS errors or 404

**Solution**:
1. Verify `VITE_API_BASE_URL` is correct
2. Check backend CORS configuration allows your frontend domain
3. Ensure backend is running and accessible

### Environment Variables Not Loading

**Issue**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solution**:
1. Variable name must start with `VITE_`
2. Restart dev server after changing `.env.local`
3. In production, check Azure Portal → Configuration

### Images Not Loading from Azure Blob

**Issue**: Images return 404 or access denied

**Solution**:
1. Verify blob container has public read access
2. Check `VITE_AZURE_BLOB_BASE_URL` is correct
3. Ensure backend returns correct blob paths
4. Do NOT include SAS token in frontend URLs

---

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Azure Static Web Apps Configuration](https://docs.microsoft.com/azure/static-web-apps/configuration)
- [Azure Blob Storage Security](https://docs.microsoft.com/azure/storage/common/storage-sas-overview)

---

**Last Updated**: January 2026  
**Frontend Framework**: React + Vite + TypeScript  
**Deployment**: Azure Static Web Apps


