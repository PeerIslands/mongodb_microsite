# Azure Static Web App - Frontend Environment Variables Setup

## 🔐 Security Notice

### ❌ NEVER Include These in Frontend:
- `MONGODB_URI` - Database credentials (Backend only!)
- `AZURE_BLOB_SAS_URL` with SAS token - Write access (Backend only!)
- `SECRET_KEY` - Security keys (Backend only!)
- `HOST`/`PORT` - Server config (Backend only!)

### ✅ Safe for Frontend:
- `VITE_API_BASE_URL` - Public API endpoint
- `VITE_PROJECT_NAME` - Application name
- `VITE_VERSION` - Version number
- `VITE_AZURE_BLOB_BASE_URL` - Base URL only (no SAS token)

---

## 📋 Frontend Environment Variables (JSON Format)

### For Azure Portal Configuration

Copy and paste this into Azure Portal → Static Web App → Configuration:

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

**⚠️ IMPORTANT**: Replace `https://your-backend-api.azurewebsites.net` with your actual backend URL!

---

## 🚀 Quick Setup Steps

### Step 1: Configure in Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your Static Web App: **ashy-glacier-09cfe4b0f**
3. Click **Configuration** (left menu)
4. Click **+ Add** and add each variable:

#### Add These Variables:

| Name | Value |
|------|-------|
| `VITE_PROJECT_NAME` | `MongoDB Microsite` |
| `VITE_VERSION` | `0.1.0` |
| `VITE_API_BASE_URL` | `https://your-backend-api.azurewebsites.net` ⚠️ |
| `VITE_API_V1_STR` | `/api/v1` |
| `VITE_AZURE_BLOB_BASE_URL` | `https://mmsuploads.blob.core.windows.net/casestudies` |

5. Click **Save**

### Step 2: Update Backend CORS

Your backend must allow requests from your Static Web App. Update your backend `.env`:

```env
BACKEND_CORS_ORIGINS=http://localhost:5173,https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net
```

Or in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 Variable Breakdown

### From Your Backend Config:

| Backend Variable | Frontend Equivalent | Status |
|-----------------|-------------------|---------|
| `PROJECT_NAME=MongoDB Microsite` | `VITE_PROJECT_NAME` | ✅ Safe |
| `VERSION=0.1.0` | `VITE_VERSION` | ✅ Safe |
| `API_V1_STR=/api/v1` | `VITE_API_V1_STR` | ✅ Safe |
| `HOST=0.0.0.0` | ❌ Not needed | Backend only |
| `PORT=8000` | ✅ In `VITE_API_BASE_URL` | Part of URL |
| `MONGODB_URI` | ❌ **NEVER expose** | Backend only! |
| `MONGODB_DB_NAME` | ❌ **NEVER expose** | Backend only! |
| `AZURE_BLOB_SAS_URL` | ⚠️ Base URL only | Remove SAS token! |
| `BACKEND_CORS_ORIGINS` | ❌ Not needed | Backend only |
| `SECRET_KEY` | ❌ **NEVER expose** | Backend only! |

---

## 🎯 Complete Configuration Example

### Local Development (.env.local)

Create `frontend/.env.local`:

```env
VITE_PROJECT_NAME=MongoDB Microsite
VITE_VERSION=0.1.0
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_STR=/api/v1
VITE_AZURE_BLOB_BASE_URL=https://mmsuploads.blob.core.windows.net/casestudies
```

### Production (Azure Portal)

Configure in Azure Portal with these values:

```
VITE_PROJECT_NAME=MongoDB Microsite
VITE_VERSION=0.1.0
VITE_API_BASE_URL=https://your-backend-api.azurewebsites.net
VITE_API_V1_STR=/api/v1
VITE_AZURE_BLOB_BASE_URL=https://mmsuploads.blob.core.windows.net/casestudies
```

---

## 💡 Why Azure Blob SAS URL is Dangerous in Frontend

Your Azure Blob SAS URL:
```
https://mmsuploads.blob.core.windows.net/casestudies?sp=racwdl&st=2026-01-08T11:25:34Z&se=2026-12-31T19:40:34Z&sv=2024-11-04&sr=c&sig=qEKZKJOJnbL210csyyxaECtzmtFtLTVAVVuaSCDIpog%3D
```

The `?sp=racwdl...&sig=...` part is a **SAS token** that grants:
- ✅ `r` = Read
- ✅ `a` = Add
- ✅ `c` = Create
- ✅ `w` = Write
- ✅ `d` = Delete
- ✅ `l` = List

**If exposed in frontend**:
- ❌ Anyone can view your frontend source code
- ❌ Anyone can extract the SAS token
- ❌ Anyone can upload malicious files
- ❌ Anyone can delete all your files
- ❌ **MAJOR SECURITY BREACH!**

**Correct Architecture**:
```
Frontend → Backend API → Azure Blob (with SAS)
                ↓
         Returns public URL
                ↓
Frontend displays image
```

**Frontend gets**:
```
https://mmsuploads.blob.core.windows.net/casestudies/hero-images/2026/01/xyz.jpg
```

**Frontend does NOT get**:
```
...?sp=racwdl&sig=... (SAS token)
```

---

## 📝 Usage in Code

### API Client Setup

```typescript
// frontend/src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_STR = import.meta.env.VITE_API_V1_STR || '/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_STR}`,
  timeout: 30000,
});
```

### Display Images from Azure Blob

```typescript
// If backend returns full URLs (recommended):
<img src={caseStudy.heroImage} alt={caseStudy.title} />

// If backend returns relative paths:
const blobBaseUrl = import.meta.env.VITE_AZURE_BLOB_BASE_URL;
const imageUrl = `${blobBaseUrl}/${caseStudy.heroImage}`;
<img src={imageUrl} alt={caseStudy.title} />
```

---

## ✅ Configuration Checklist

Before deploying:

- [ ] All frontend env vars configured in Azure Portal
- [ ] `VITE_API_BASE_URL` points to actual backend URL
- [ ] Backend CORS includes Static Web App domain
- [ ] No sensitive data (DB credentials, SAS tokens, secret keys) in frontend
- [ ] Tested locally with `.env.local`
- [ ] Azure Blob SAS URL kept on backend only
- [ ] Environment variables start with `VITE_` prefix

---

## 🧪 Testing

### Test Locally

```bash
cd frontend

# Create .env.local with local values
cat > .env.local << 'EOF'
VITE_PROJECT_NAME=MongoDB Microsite
VITE_VERSION=0.1.0
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_STR=/api/v1
VITE_AZURE_BLOB_BASE_URL=https://mmsuploads.blob.core.windows.net/casestudies
EOF

# Start dev server
npm run dev

# Open browser console and test
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: http://localhost:8000
```

### Test Production

After deploying to Azure:

1. Visit: https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net
2. Open DevTools (F12) → Console
3. Run:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: https://your-backend-api.azurewebsites.net
```

---

## 🔗 Reference Files

- **Configuration Template**: `frontend/azure-environment-config.json`
- **Detailed Guide**: `frontend/AZURE_ENVIRONMENT_VARIABLES.md`
- **This Quick Guide**: `AZURE_FRONTEND_ENV_SETUP.md`

---

## 📞 Quick Help

**Q: Can I use the MongoDB URI in frontend?**  
A: ❌ **NO!** Never expose database credentials to the frontend.

**Q: Can I use the Azure Blob SAS URL in frontend?**  
A: ❌ **NO!** The SAS token grants write/delete access. Only use the base URL without the token.

**Q: How do I upload files to Azure Blob?**  
A: Frontend sends file to backend API → Backend uploads using SAS token → Backend returns public URL.

**Q: Why must variables start with VITE_?**  
A: Vite only exposes environment variables that start with `VITE_` to prevent accidental exposure of sensitive data.

---

**Created**: January 2026  
**Security Level**: Frontend-Safe Variables Only  
**Backend Security**: Sensitive credentials kept on backend


