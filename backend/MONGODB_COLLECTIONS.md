# MongoDB Collections Analysis

## Overview

The MongoDB microsite application uses **8 collections** to store different types of data. All collections are initialized via `backend/app/core/mongodb_init.py`.

## Collections List

### 1. **case_studies** 📚
**Purpose:** Stores customer case studies and success stories

**Repository:** `CaseStudyRepository`

**Key Fields:**
- `_id` (unique): Case study ID
- `slug` (unique): URL-friendly identifier
- `title`: Case study title
- `status`: Publication status (draft/published/archived)
- `industry`: Industry sector
- `featured`: Boolean for featured studies
- `company_name`: Client company name
- `tech_stack`: Array of technologies used
- `migration_type`: Type of database migration
- `metrics`: Performance metrics (time_reduction, ingestion_speed, etc.)
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `slug` (unique)
- `status`
- `industry`
- `featured`
- `created_at` (descending)
- Compound: `status + featured + created_at`

---

### 2. **users** 👥
**Purpose:** Stores user account information

**Repository:** `UserRepository`

**Key Fields:**
- `_id` (unique): User ID
- `user_email` (unique): User email address
- `first_name`, `last_name`: User name
- `company`: Company name
- `job_function`: Job title/role
- `business_phone`: Contact number
- `country`: User country
- `is_internal`: Boolean (company employee vs external)
- `is_admin`: Boolean for admin privileges
- `totp_enabled`: MFA enabled status
- `totp_setup_at`: When MFA was configured
- `registration_status`: Account setup status
- `account_active`: Account active/inactive
- `can_login`: Login permission
- `created_at`: Registration timestamp

**Indexes:**
- `user_email` (unique)
- `is_internal`
- `account_active`
- `totp_enabled`

**Newsletter Feature Usage:**
- Used by bulk newsletter sending to filter recipients
- `active_users` filter: `account_active = true AND can_login = true`
- `internal_users` filter: `is_internal = true`
- `external_users` filter: `is_internal = false`

---

### 3. **login_creds** 🔐
**Purpose:** Stores encrypted login credentials (passwords)

**Repository:** `UserRepository`

**Key Fields:**
- `_id` (unique): User ID (matches users._id)
- `user_email` (unique): User email
- `user_password`: Bcrypt hashed password
- `created_at`: Timestamp

**Indexes:**
- `user_email` (unique)

**Security:** Passwords are bcrypt hashed, never stored in plain text

---

### 4. **blogs** 📝
**Purpose:** Stores blog posts and articles

**Repository:** `BlogRepository`

**Key Fields:**
- `_id` (unique): Blog ID
- `slug` (unique): URL-friendly identifier
- `title`: Blog title
- `author`: Author name
- `status`: Publication status (draft/published/archived)
- `featured`: Boolean for featured blogs
- `content`: Blog content (Markdown/HTML)
- `excerpt`: Short description
- `tags`: Array of tags
- `hero_image`: Header image URL
- `read_time`: Estimated reading time
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `slug` (unique)
- `status`
- `featured`
- `created_at` (descending)
- Compound: `status + featured + created_at`

---

### 5. **accelerators** 🚀
**Purpose:** Stores MongoDB accelerator programs and tools

**Repository:** `AcceleratorRepository`

**Key Fields:**
- `_id` (unique): Accelerator ID
- `slug` (unique): URL-friendly identifier
- `name`: Accelerator name
- `description`: Description
- `status`: Publication status
- `category`: Program category
- `features`: Array of features
- `documentation_url`: Link to docs
- `github_url`: Repository link
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `slug` (unique)
- `status`
- `created_at` (descending)

---

### 6. **events** 📅
**Purpose:** Stores upcoming and past events, webinars, conferences

**Repository:** `EventRepository`

**Key Fields:**
- `_id` (unique): Event ID
- `slug` (unique): URL-friendly identifier
- `title`: Event title
- `description`: Event description
- `status`: Publication status
- `event_date`: Event date/time
- `location`: Physical/virtual location
- `event_type`: Type (webinar, conference, workshop)
- `registration_url`: Sign-up link
- `speakers`: Array of speaker information
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `slug` (unique)
- `status`
- `event_date`
- `created_at` (descending)
- Compound: `status + event_date`

---

### 7. **email_templates** 📧 (Newsletter Feature)
**Purpose:** Stores newsletter and email templates for bulk sending

**Repository:** `EmailTemplateRepository`

**Key Fields:**
- `_id` (unique): Template ID
- `slug` (unique): URL-friendly identifier
- `name`: Template name
- `description`: Template description
- `status`: Status (draft/active/archived)
- `category`: Type (newsletter/transactional/promotional/notification)
- `subject`: Email subject line
- `html_content`: Email HTML body
- `plain_text_content`: Plain text fallback
- `variables`: Array of template variables
- `images`: Array of embedded/linked images
- `sendgrid_template_id`: Optional SendGrid integration
- `created_by`: Admin user who created template
- `send_count`: Number of times sent (tracked via `increment_send_count()`)
- `test_send_count`: Number of test sends
- `last_sent_at`: Last send timestamp
- `version`: Template version number
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `slug` (unique)
- `status`
- `category`
- `created_at` (descending)
- `last_sent_at`
- Compound: `status + category + created_at`

**Newsletter Integration:**
- Used by bulk newsletter sending endpoint
- `increment_send_count()` called after successful sends
- Tracks newsletter performance and history

---

### 8. **totp_secrets** 🔑
**Purpose:** Stores TOTP (MFA) secrets for two-factor authentication

**Repository:** `TOTPRepository`

**Key Fields:**
- `_id` (unique): Secret ID
- `user_id` (unique): User ID (FK to users._id)
- `secret`: Encrypted TOTP secret
- `backup_codes`: Array of backup codes
- `created_at`: Creation timestamp
- `expires_at`: Optional expiration

**Indexes:**
- `user_id` (unique)
- `expires_at`

**Security:** TOTP secrets are encrypted at rest

---

## Initialization

### Run MongoDB Initialization

```bash
# Navigate to backend
cd backend

# Initialize collections and indexes
python -m app.core.mongodb_init

# Initialize with sample data (for development)
python -m app.core.mongodb_init --seed
```

### What It Does

1. ✅ **Connects to MongoDB** using `MONGODB_URI` from environment
2. ✅ **Creates 8 collections** if they don't exist
3. ✅ **Creates indexes** for optimal query performance
4. ✅ **Seeds sample data** (optional, development only)

### Indexes Created

The initialization script creates:
- **Unique indexes** on key fields (slug, email, user_id)
- **Single field indexes** for filtering (status, category, etc.)
- **Compound indexes** for common query patterns
- **Date indexes** for sorting and time-based queries

### Performance Benefits

Proper indexing provides:
- 🚀 **Faster queries** (50-1000x improvement on large datasets)
- 🎯 **Efficient filtering** by status, category, featured, etc.
- ⚡ **Quick lookups** by slug, email, user_id
- 📊 **Optimal sorting** by date fields

---

## Collection Statistics

### Current Usage

| Collection | Primary Use | Key Features |
|------------|-------------|-------------|
| `case_studies` | Customer success stories | Filterable, featurable, industry-tagged |
| `users` | User accounts | MFA support, internal/external, newsletter targeting |
| `login_creds` | Authentication | Bcrypt hashed passwords |
| `blogs` | Content marketing | Featured posts, tags, read time |
| `accelerators` | MongoDB tools | GitHub integration, documentation links |
| `events` | Event management | Date-based, registration URLs, speaker info |
| `email_templates` | Newsletter system | Send tracking, versioning, bulk sending |
| `totp_secrets` | MFA/2FA | Encrypted secrets, backup codes |

---

## Newsletter Feature Integration

The **email_templates** collection is tightly integrated with the newsletter sending feature:

### Send Count Tracking

```python
# backend/app/api/v1/repositories/email_template_repository.py
async def increment_send_count(self, template_id: str) -> bool:
    """
    Increment send count and update last_sent_at.
    Uses MongoDB $inc for atomic increment.
    """
    result = await self.collection.update_one(
        {"_id": ObjectId(template_id)},
        {
            "$inc": {"send_count": 1},
            "$set": {"last_sent_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0
```

### Recipient Filtering

The newsletter feature queries the **users** collection with these filters:
- **All Users**: No filter
- **Active Users**: `account_active=true AND can_login=true`
- **Internal Users**: `is_internal=true`
- **External Users**: `is_internal=false`
- **Custom List**: Direct email addresses (no query needed)

---

## Maintenance

### View Collections

```bash
# Using MongoDB shell
mongosh "your-connection-string"
> show collections
> db.email_templates.countDocuments()
> db.users.find({is_internal: true}).count()
```

### Backup Collections

```bash
# Backup specific collection
mongodump --uri="your-connection-string" --db=mongodb_microsite --collection=email_templates --out=./backup

# Restore collection
mongorestore --uri="your-connection-string" --db=mongodb_microsite --collection=email_templates ./backup/mongodb_microsite/email_templates.bson
```

### Update Indexes

If you modify the initialization file:

```bash
# Re-run initialization (safe to run multiple times)
python -m app.core.mongodb_init
```

MongoDB will skip existing indexes and only create new ones.

---

## Future Enhancements

Potential additions:
1. **contact_inquiries** - Store contact form submissions
2. **newsletter_subscribers** - Separate subscription management
3. **email_logs** - Detailed send logs per recipient
4. **analytics** - Track email opens, clicks, engagement
5. **scheduled_sends** - Queue newsletters for future delivery
6. **unsubscribes** - Honor opt-out preferences

---

## Summary

✅ **8 collections** properly initialized  
✅ **25+ indexes** for optimal performance  
✅ **Newsletter integration** with send tracking  
✅ **User segmentation** for targeted campaigns  
✅ **MFA support** with TOTP secrets  
✅ **Content management** for blogs, events, case studies  
✅ **Initialization script** ready to use  

All collections are production-ready and properly indexed for the MongoDB microsite application!
