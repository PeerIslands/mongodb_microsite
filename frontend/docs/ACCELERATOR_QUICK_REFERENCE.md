# 🚀 Accelerator Library - Quick Reference

## 📋 Overview

A complete system for managing and showcasing reusable IP accelerators (HBase→Mongo, Cassandra→Mongo, Cosmos→Mongo, MCP Demo) with admin capabilities.

---

## 🎯 Core Accelerators

1. **HBase → MongoDB Accelerator**
2. **Cassandra → MongoDB Toolkit**
3. **Cosmos DB → MongoDB Mapping Tool**
4. **MCP-based Migration Demo**

---

## 📄 Page Structure

### **Showcase Page** (`/accelerators`)
- Grid of accelerator cards
- Filters (Category, Source Tech, Target Tech)
- Search functionality
- Pagination

### **Detail Page** (`/accelerators/:slug`)
- Hero section with logo and CTAs
- Overview section
- Features section (grid)
- Benefits section (metrics)
- Demo video section (player)
- Technical specifications
- Download section (files)
- Related case studies
- Testimonials

---

## 🗄️ Database Fields Summary

### Essential Fields (30)
- Basic Info (10): name, slug, tagline, category, source/target tech, status, featured, published, migration type
- Overview (4): description, use cases, ideal for, tech stack
- Features (3 per feature): title, description, icon
- Benefits (4 per benefit): title, description, metric, category
- Demo Video (4): url, thumbnail, duration, title
- Downloads (6 per file): name, description, file_url, version, size, date
- Media (4): card image, hero image, logo, screenshots

### Optional Fields (30+)
- Technical specs, testimonials, pricing, performance metrics, documentation links, SEO metadata, analytics, etc.

**Total Fields**: 60+ across 13 sections

---

## 📝 Admin Form Sections

| # | Section | Fields | Key Items |
|---|---------|--------|-----------|
| 1 | Basic Information | 10 | Name, slug, category, tech, status |
| 2 | Overview | 4 | Description, use cases, tech stack |
| 3 | Features | Dynamic | Title, description, icon per feature |
| 4 | Benefits | Dynamic | Title, metric, description, category |
| 5 | Technical Specs | 4 | Versions, prerequisites, limitations |
| 6 | Demo Video | 4 | Upload/URL, thumbnail, duration |
| 7 | Media & Assets | 4 | Card, hero, logo, screenshots |
| 8 | Downloads | Dynamic | Files, versions, descriptions |
| 9 | Documentation | 5 | URLs for docs, API, GitHub, support |
| 10 | Performance Metrics | Dynamic | Metric name, value, description |
| 11 | Testimonials | Dynamic | Quote, author, company, logo |
| 12 | Pricing | 3 | Model, price, license type |
| 13 | SEO & Metadata | 3 | Title, description, keywords |

---

## 🎨 Design Patterns

### Card Component (Showcase)
```
┌─────────────────────┐
│   [Hero Image]      │
│   [Logo Overlay]    │
├─────────────────────┤
│ Title               │
│ Short Description   │
│ [Category Badge]    │
│ [Learn More →]      │
└─────────────────────┘
```

**Specs**: 388px x 729px, border-radius: 30px, gradient text, white border

### Detail Page Sections
```
1. Hero (Logo, Title, Tagline, CTAs)
2. Overview (Description, Use Cases)
3. Features (3-col grid, icons)
4. Benefits (2-4 col, metrics)
5. Demo Video (Full-width player)
6. Tech Specs (List format)
7. Downloads (Cards with CTAs)
8. Related Content (Case studies)
```

---

## 🔌 API Endpoints

### Public
```
GET    /api/v1/accelerators                    # List all
GET    /api/v1/accelerators/:slug              # Single
GET    /api/v1/accelerators/:slug/download     # Download file
POST   /api/v1/accelerators/:slug/track-demo   # Analytics
GET    /api/v1/accelerators/featured           # Homepage
```

### Admin
```
GET    /api/v1/admin/accelerators              # All (admin view)
POST   /api/v1/admin/accelerators              # Create
PUT    /api/v1/admin/accelerators/:id          # Update
DELETE /api/v1/admin/accelerators/:id          # Delete
POST   /api/v1/admin/accelerators/:id/upload   # Files
```

---

## 📤 File Upload Requirements

| Asset Type | Format | Max Size | Dimensions |
|------------|--------|----------|------------|
| Card Image | PNG/JPG | 5MB | 600x400px |
| Hero Image | PNG/JPG | 5MB | 1920x600px |
| Logo | PNG (transparent) | 2MB | 200x200px |
| Screenshots | PNG/JPG | 3MB each | Variable |
| Demo Video | MP4/MOV | 100MB | 1920x1080 |
| Download Files | ZIP/PDF/EXE | 50MB | N/A |

---

## 🎯 User Journeys

### **Public User**
```
Homepage → "View Accelerators" → 
Showcase Page → Filter/Browse → 
Click Card → Detail Page → 
Watch Demo → Download Toolkit
```

### **Admin User**
```
Login → Admin Panel → "Accelerators" Tab →
"Add New" → Fill 13 Sections → 
Upload Media → Add Downloads →
Preview → Publish
```

---

## 📊 Key Metrics to Track

1. **Views**: Per accelerator page
2. **Downloads**: Per file/version
3. **Demo Views**: Video plays
4. **Engagement Time**: Time on page
5. **Conversion Rate**: View → Download
6. **Popular Accelerators**: Most viewed
7. **Geographic Data**: Visitor locations

---

## 🎨 Design Checklist

- [x] Match existing Capabilities card style
- [x] Use Manrope for headings (gradient text)
- [x] Use Inter for body text
- [x] Dark background (#020916)
- [x] Primary blue (#5b6cff) for CTAs
- [x] 30px border-radius on cards
- [x] Arrow icons on links
- [x] Hover effects (translateY)
- [x] Responsive (768px, 1200px breakpoints)

---

## 🚀 Implementation Phases

| Phase | Tasks | Duration |
|-------|-------|----------|
| 1 | Backend (Schema, APIs, Auth) | 1 week |
| 2 | Admin Interface (Form, Uploads) | 1 week |
| 3 | Public Showcase (Cards, Filters) | 1 week |
| 4 | Detail Pages (Sections, Video) | 1 week |
| 5 | Analytics & Polish | 1 week |

**Total**: 5 weeks

---

## 🔄 Integration Points

### Update Navigation
```typescript
// Header.tsx
<a href="/accelerators">Accelerators</a>
```

### Update Hero CTA
```typescript
// Hero.tsx
<button onClick={() => navigate('/accelerators')}>
  Explore Accelerators
</button>
```

### Update Capabilities
```typescript
// Capabilities.tsx
<a href="/accelerators">View All Accelerators</a>
```

---

## 📂 Component Structure

```
frontend/src/
├── pages/
│   ├── AcceleratorsShowcase.tsx    # Main listing
│   └── AcceleratorDetail.tsx       # Detail view
│
├── components/accelerators/
│   ├── AcceleratorCard.tsx         # Card component
│   ├── AcceleratorFilters.tsx      # Filter UI
│   ├── FeaturesSection.tsx         # Features grid
│   ├── BenefitsSection.tsx         # Benefits display
│   ├── DemoVideoSection.tsx        # Video player
│   └── DownloadSection.tsx         # Download CTAs
│
└── components/admin/
    ├── AcceleratorList.tsx         # Admin table
    ├── AcceleratorForm.tsx         # 13-section form
    ├── VideoUploader.tsx           # Video upload
    └── FileManager.tsx             # File management
```

---

## 🎬 Demo Video Options

### Option 1: YouTube/Vimeo Embed
```typescript
<iframe 
  src={videoUrl}
  width="100%"
  height="600px"
  allow="autoplay; fullscreen"
/>
```

### Option 2: Direct Upload
```typescript
<video 
  controls
  poster={thumbnail}
  src={videoFile}
/>
```

### Option 3: Custom Player
- Custom controls
- Analytics tracking
- Playback speed
- Subtitles support

---

## 📥 Download Section Features

- **Primary CTA**: "Download Toolkit v2.3" (large button)
- **File Info**: Size, format, version, release date
- **Secondary Downloads**: Documentation, guides
- **Download Counter**: "Downloaded 1,234 times"
- **Requirements**: List prerequisites
- **License Info**: Usage terms

---

## 🔍 Filter Options

### Category
- ☐ All
- ☐ Migration
- ☐ Modernization
- ☐ Integration

### Source Technology
- HBase
- Cassandra
- Cosmos DB
- Oracle
- PostgreSQL
- MySQL
- Others

### Target Technology
- MongoDB Atlas
- MongoDB Enterprise
- MongoDB Community

### Status
- Active
- Coming Soon
- Beta

---

## 📊 Analytics Dashboard Integration

Add to existing Analytics Dashboard:

### **New Section: Accelerator Performance**
```
┌─────────────────────────────────┐
│ 🚀 Accelerator Metrics          │
├─────────────────────────────────┤
│ Total Views: 12,456             │
│ Total Downloads: 3,456          │
│ Avg. Engagement: 6:23           │
│                                 │
│ Top 5 Accelerators:             │
│ 1. HBase→Mongo (5,678 views)    │
│ 2. Cassandra→Mongo (4,234)      │
│ 3. Cosmos→Mongo (2,544)          │
│                                 │
│ Top Downloads:                  │
│ 1. Migration Toolkit (1,234)   │
│ 2. Schema Mapper (892)          │
└─────────────────────────────────┘
```

---

## 🎯 Content Requirements

### Per Accelerator
- ✅ Name and tagline
- ✅ Overview (500-1000 words)
- ✅ 3-10 features with descriptions
- ✅ 3-8 benefits with metrics
- ✅ Demo video (5-10 minutes)
- ✅ Technical specifications
- ✅ At least 1 download file
- ✅ Documentation links
- ✅ Card image (600x400)
- ✅ Hero image (1920x600)
- ✅ Logo (200x200)

### Optional
- Screenshots gallery
- Architecture diagram
- Testimonials
- Pricing information
- Performance metrics
- Related case studies

---

## 🔒 Security Checklist

- [ ] Validate file uploads (type, size)
- [ ] Scan for malware
- [ ] Use signed URLs for downloads
- [ ] Rate limit download requests
- [ ] Authenticate admin access (JWT)
- [ ] Audit log all changes
- [ ] HTTPS for video streams
- [ ] Input sanitization

---

## 🎨 Visual Effects

### Cards (Showcase)
- Hover: `translateY(-4px)`, shadow increase
- Image: Gradient overlay (opacity change on hover)
- Badge: Pulse animation for "New"

### Detail Page
- Scroll: Fade-in sections (Intersection Observer)
- Metrics: Count-up animation
- Progress Bars: Animated fill
- Video: Thumbnail → Player transition

### Buttons
- Hover: Background lighten, scale(1.02)
- Active: scale(0.98)
- Disabled: Opacity 0.5, cursor: not-allowed

---

## 📝 Sample Content

### HBase → MongoDB Accelerator

**Tagline**: "Automated migration toolkit for seamless HBase to MongoDB Atlas transition"

**Features**:
1. **Automated Schema Discovery** - Automatically analyze HBase table structures
2. **Data Mapping Engine** - Intelligent column family to document mapping
3. **Incremental Sync** - Real-time data synchronization during migration

**Benefits**:
1. **40% Faster Migration** - Reduce project timeline significantly
2. **99.9% Data Accuracy** - Ensure complete data fidelity
3. **Zero Downtime** - Migrate without service interruption

---

## 🚀 Quick Start

### For Developers
```bash
# 1. Set up backend
cd app
poetry install
poetry run uvicorn app.main:app --reload

# 2. Set up frontend
cd frontend
npm install
npm run dev

# 3. Access admin
http://localhost:5173/admin → Accelerators Tab
```

### For Content Managers
1. Login to admin panel
2. Click "Accelerators" tab
3. Click "+ Add New Accelerator"
4. Fill form sections
5. Upload media files
6. Preview before publishing
7. Click "Publish"

---

## 📚 Related Documentation

- **ACCELERATOR_LIBRARY_WORKFLOW.md** - Complete detailed spec
- **CASE_STUDY_LIBRARY_OVERVIEW.md** - Similar pattern reference
- **ADMIN_UI_README.md** - Admin interface guide
- **ANALYTICS_DASHBOARD_GUIDE.md** - Analytics integration

---

## ✅ Implementation Checklist

### Backend
- [ ] Create accelerator model
- [ ] Implement CRUD APIs
- [ ] Set up file storage
- [ ] Add authentication
- [ ] Test all endpoints

### Admin
- [ ] Add "Accelerators" tab to navigation
- [ ] Create list view with table
- [ ] Build 13-section form
- [ ] Implement file uploaders
- [ ] Add preview feature
- [ ] Test full workflow

### Public
- [ ] Create showcase page
- [ ] Build accelerator cards
- [ ] Implement filters
- [ ] Create detail page
- [ ] Add all sections (Features, Benefits, Demo, Downloads)
- [ ] Test responsive design

### Integration
- [ ] Update navigation links
- [ ] Connect to existing components
- [ ] Add to analytics dashboard
- [ ] Update homepage CTAs
- [ ] Test user journeys

---

**This quick reference complements the detailed ACCELERATOR_LIBRARY_WORKFLOW.md document. Use both together for complete implementation guidance.**

