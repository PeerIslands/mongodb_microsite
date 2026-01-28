# Styles Organization

## 📁 New Structure (Industry Standard)

All CSS files are now organized in the `styles/` folder, mirroring the component structure for easy navigation.

```
styles/
├── index.css                    # Global styles
├── App.css                      # App-level styles
├── pages/                       # Page component styles
│   ├── HomePage.css
│   ├── AcceleratorsPage.css
│   ├── AcceleratorDetailPage.css
│   ├── CaseStudiesPage.css
│   ├── CaseStudyDetailPage.css
│   └── AdminDashboardPage.css
├── layouts/                     # Layout component styles
│   ├── RootLayout.css
│   ├── MainLayout.css
│   └── AdminLayout.css
├── features/                    # Feature-specific styles
│   ├── home/
│   │   ├── Header.css
│   │   ├── Hero.css
│   │   ├── Statistics.css
│   │   ├── Capabilities.css
│   │   ├── CaseStudies.css
│   │   ├── Events.css
│   │   ├── Testimonials.css
│   │   └── Footer.css
│   ├── accelerators/
│   │   ├── AcceleratorCard.css
│   │   ├── AcceleratorFilters.css
│   │   ├── BenefitsSection.css
│   │   ├── DemoVideoSection.css
│   │   ├── DownloadSection.css
│   │   └── FeaturesSection.css
│   └── admin/
│       ├── AcceleratorForm.css
│       ├── AcceleratorList.css
│       ├── AdminLayout.css
│       ├── AnalyticsDashboard.css
│       ├── CaseStudyForm.css
│       ├── CaseStudyList.css
│       ├── FileManager.css
│       ├── FileUpload.css
│       ├── MonthlyReport.css
│       ├── PageLevelAnalytics.css
│       ├── SiteWideAnalytics.css
│       └── VideoUploader.css
└── components/                  # Old component styles (to be cleaned up)
    ├── [duplicate files - can be removed after migration]
    └── [kept for backwards compatibility during transition]
```

## 🔄 Import Path Changes Required

### Pages
```typescript
// Before
import './HomePage.css';

// After
import '@/styles/pages/HomePage.css';
```

### Layouts
```typescript
// Before
import './AdminLayout.css';

// After
import '@/styles/layouts/AdminLayout.css';
```

### Features
```typescript
// Before (in features/home/components/Header.tsx)
import './Header.css';

// After
import '@/styles/features/home/Header.css';
```

## ✅ Benefits of This Organization

1. **Separation of Concerns** - Logic (TSX) and styling (CSS) are clearly separated
2. **Easy to Find** - Parallel structure makes it easy to locate styles
3. **Better Version Control** - Cleaner diffs when styles or logic change
4. **Industry Standard** - Follows modern React/Vite project conventions
5. **Scalable** - Easy to add new styles without cluttering component folders

## 🚀 Next Steps

1. Update all component imports to use new paths
2. Remove duplicate CSS files from `styles/components/` (old structure)
3. Test all pages to ensure styles still load correctly
4. Consider migrating to CSS Modules (`.module.css`) for component-scoped styles

## 📝 Quick Reference

| Component Type | Style Location | Import Path |
|----------------|----------------|-------------|
| Pages | `styles/pages/` | `@/styles/pages/ComponentName.css` |
| Layouts | `styles/layouts/` | `@/styles/layouts/ComponentName.css` |
| Features | `styles/features/{feature}/` | `@/styles/features/{feature}/ComponentName.css` |
| Global | `styles/` | `@/styles/index.css` |

## 🔧 Migration Script

To update imports automatically, you can use:

```bash
# Run from frontend/ directory
find src/pages -name "*.tsx" -exec sed -i '' "s|import '\./\([^']*\)\.css'|import '@/styles/pages/\1.css'|g" {} \;
find src/layouts -name "*.tsx" -exec sed -i '' "s|import '\./\([^']*\)\.css'|import '@/styles/layouts/\1.css'|g" {} \;
find src/features -name "*.tsx" -exec sed -i '' "s|import '\./\([^']*\)\.css'|import '@/styles/features/[FEATURE]/\1.css'|g" {} \;
```

Note: Replace `[FEATURE]` with the actual feature name (home, accelerators, admin).

