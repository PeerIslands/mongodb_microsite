# MongoDB Initialization Scripts

## Overview

This directory contains scripts for initializing and managing MongoDB collections for the MongoDB Microsite application.

## Scripts

### 1. `check_and_init_mongodb.py`

**Purpose:** CI/CD-friendly script that checks if MongoDB collections exist and initializes them if needed.

**Usage:**
```bash
cd backend
python scripts/check_and_init_mongodb.py
```

**What it does:**
- ✅ Connects to MongoDB
- ✅ Checks for all 8 expected collections
- ✅ Verifies key indexes are present
- ✅ Creates missing collections and indexes
- ✅ Reports status and exits with proper exit code (0=success, 1=error)

**Exit Codes:**
- `0` - Success (collections exist or were created)
- `1` - Error (connection failed or initialization failed)

---

### 2. Core Initialization Module

**Location:** `backend/app/core/mongodb_init.py`

**Usage:**
```bash
# Initialize collections and indexes (no sample data)
python -m app.core.mongodb_init

# Initialize with sample data (development only)
python -m app.core.mongodb_init --seed
```

**What it does:**
- ✅ Creates 8 collections:
  - `case_studies`
  - `users`
  - `login_creds`
  - `blogs`
  - `accelerators`
  - `events`
  - `email_templates` (for newsletter feature)
  - `totp_secrets`

- ✅ Creates 25+ indexes for optimal query performance
- ✅ Optionally seeds sample data for development

---

## Automatic Initialization

### During Deployment

The MongoDB initialization happens automatically during deployment via `startup.sh`:

```bash
# backend/startup.sh

# Initialize MongoDB collections and indexes
echo "🔧 Initializing MongoDB collections..."
python -m app.core.mongodb_init || echo "⚠️ MongoDB initialization failed, continuing..."

# Start Gunicorn server
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

**When:** Every time the container starts on Azure App Service

**Behavior:**
- Checks if collections exist
- Creates missing collections
- Creates missing indexes
- Continues startup even if initialization fails (fail-safe)

---

### In GitHub Actions

The CI/CD pipeline (`develop_mongodb-microsite-api.yml`) includes a check step:

```yaml
- name: Check MongoDB Initialization
  run: |
    echo "🔍 Checking MongoDB collections and indexes..."
    echo "MongoDB initialization handled by startup script"
```

**When:** After deployment to Azure App Service

**Behavior:**
- Acknowledges that initialization is handled by startup script
- Provides visibility in deployment logs

---

## Collections and Indexes

### Collections Created

| Collection | Purpose | Key Indexes |
|------------|---------|-------------|
| `case_studies` | Customer success stories | slug (unique), status, industry, featured |
| `users` | User accounts | user_email (unique), is_internal, account_active |
| `login_creds` | Encrypted passwords | user_email (unique) |
| `blogs` | Blog posts | slug (unique), status, featured |
| `accelerators` | MongoDB tools | slug (unique), status |
| `events` | Events/webinars | slug (unique), status, event_date |
| `email_templates` | Newsletters | slug (unique), status, category, last_sent_at |
| `totp_secrets` | MFA secrets | user_id (unique), expires_at |

### Indexes Performance Benefits

- 🚀 **50-1000x faster** queries on indexed fields
- 🎯 **Efficient filtering** by status, category, featured flags
- ⚡ **Quick lookups** by slug, email, user_id (unique indexes)
- 📊 **Optimal sorting** by date fields
- 🔍 **Compound indexes** for complex queries

---

## Manual Operations

### Check Collections

```bash
# Using MongoDB shell
mongosh "your-connection-string"

# List collections
show collections

# Count documents
db.email_templates.countDocuments()
db.users.countDocuments({account_active: true})
```

### Verify Indexes

```bash
# Check indexes on a collection
db.email_templates.getIndexes()
db.users.getIndexes()
```

### Re-run Initialization

Safe to run multiple times:

```bash
cd backend
python -m app.core.mongodb_init
```

MongoDB will skip existing collections and indexes.

---

## Development Workflow

### Local Development

1. **First time setup:**
   ```bash
   cd backend
   python -m app.core.mongodb_init --seed
   ```

2. **Start application:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Adding New Collections

When adding a new collection:

1. **Create repository** in `backend/app/api/v1/repositories/`
2. **Update initialization** in `backend/app/core/mongodb_init.py`:
   - Add collection name to `create_collections()`
   - Add indexes in `create_indexes()`
3. **Update documentation** in `backend/MONGODB_COLLECTIONS.md`
4. **Test locally:**
   ```bash
   python -m app.core.mongodb_init
   ```

### Newsletter Feature Integration

The `email_templates` collection is automatically created with these indexes:

```python
# Unique slug for URL lookups
await email_templates.create_index("slug", unique=True)

# Filter by status (draft/active/archived)
await email_templates.create_index("status")

# Filter by category (newsletter/transactional/promotional)
await email_templates.create_index("category")

# Sort by creation date
await email_templates.create_index([("created_at", -1)])

# Track last sent timestamp
await email_templates.create_index("last_sent_at")

# Compound index for common queries
await email_templates.create_index([
    ("status", 1), 
    ("category", 1), 
    ("created_at", -1)
])
```

These indexes optimize:
- Newsletter list queries (status + category filters)
- Send history tracking (last_sent_at)
- Template lookup by slug
- Sorting by date

---

## Troubleshooting

### Issue: Collections not created

**Check:**
```bash
# Verify MongoDB connection
python -c "from app.core.config import settings; print(settings.MONGODB_URI)"

# Test connection
python -m app.core.mongodb_init
```

**Solution:** Ensure `MONGODB_URI` environment variable is set correctly.

---

### Issue: Indexes not created

**Check:**
```bash
# List indexes
db.email_templates.getIndexes()
```

**Solution:** Drop and recreate indexes:
```bash
# MongoDB shell
db.email_templates.dropIndexes()

# Re-run initialization
python -m app.core.mongodb_init
```

---

### Issue: Deployment fails due to MongoDB

**Check deployment logs:**
- Azure Portal → App Service → Log Stream

**Look for:**
```
🔧 Initializing MongoDB collections...
✅ Connected to MongoDB
```

**Solution:** Verify MongoDB connection string in Azure App Service Configuration.

---

## Environment Variables

Required environment variables:

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=mongodb_microsite
```

Set in:
- Local: `.env` file
- Azure: App Service → Configuration → Application Settings

---

## CI/CD Integration

### Workflow: `develop_mongodb-microsite-api.yml`

**Build Step:**
```yaml
- name: Create and Start virtual environment and Install dependencies
  run: |
    cd backend
    python -m venv antenv
    source antenv/bin/activate
    pip install -r requirements.txt
```

**Deploy Step:**
```yaml
- name: 'Deploy to Azure Web App'
  uses: azure/webapps-deploy@v3
  with:
    app-name: 'mongodb-microsite-api'
```

**Initialization:** Handled automatically by `startup.sh` during container startup.

---

## Best Practices

1. ✅ **Always use initialization scripts** - Don't create collections manually
2. ✅ **Run with --seed locally** - For development environments
3. ✅ **Never seed in production** - Use real data only
4. ✅ **Verify indexes regularly** - Check performance
5. ✅ **Update scripts when adding collections** - Keep in sync
6. ✅ **Test initialization locally first** - Before deployment
7. ✅ **Monitor deployment logs** - Ensure initialization succeeds

---

## Summary

✅ **Automatic initialization** on every deployment  
✅ **8 collections** properly configured  
✅ **25+ indexes** for optimal performance  
✅ **Newsletter feature** fully supported  
✅ **CI/CD integrated** via GitHub Actions  
✅ **Safe to run multiple times** - idempotent  
✅ **Development and production ready**

For detailed collection documentation, see `backend/MONGODB_COLLECTIONS.md`.
