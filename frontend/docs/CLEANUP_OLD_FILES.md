# Cleanup Old Files

## ⚠️ Optional Step

The restructure created a new organization in `/src/features`, but kept the old files in `/src/components` for reference. You can safely remove these old files once you've verified the new structure works.

## 🗑️ Files to Remove (Optional)

These are duplicates that have been moved to the new structure:

### Old Component Folders
```bash
# Old home components (moved to features/home/components)
rm -rf src/components/Header.tsx
rm -rf src/components/Header.css
rm -rf src/components/Hero.tsx
rm -rf src/components/Hero.css
rm -rf src/components/Statistics.tsx
rm -rf src/components/Statistics.css
rm -rf src/components/Capabilities.tsx
rm -rf src/components/Capabilities.css
rm -rf src/components/CaseStudies.tsx
rm -rf src/components/CaseStudies.css
rm -rf src/components/Events.tsx
rm -rf src/components/Events.css
rm -rf src/components/Testimonials.tsx
rm -rf src/components/Testimonials.css
rm -rf src/components/Footer.tsx
rm -rf src/components/Footer.css

# Old accelerator components (moved to features/accelerators/components)
rm -rf src/components/accelerators/

# Old admin components (moved to features/admin/components)
rm -rf src/components/admin/
```

### Old Pages
```bash
# Old page files (replaced with new versions)
rm -f src/pages/AcceleratorDetail.tsx
rm -f src/pages/AcceleratorDetail.css
rm -f src/pages/AcceleratorsShowcase.tsx
rm -f src/pages/AcceleratorsShowcase.css
rm -f src/pages/AcceleratorsSingle.tsx
rm -f src/pages/AcceleratorsSingle.css
rm -f src/pages/AdminDashboard.tsx
rm -f src/pages/AdminDashboard.css
```

### Old Files
```bash
# Old app files (replaced with new routing)
rm -f src/App.tsx
rm -f src/AppRoutes.tsx

# Old source folder (unclear purpose)
rm -rf src/source/
```

## 🧹 Cleanup Script

To remove all old files at once:

```bash
#!/bin/bash
cd /Users/sree/Desktop/MonogoDV/mongodb_microsite/frontend/src

echo "Removing old component files..."
rm -rf components/Header.* components/Hero.* components/Statistics.* \
       components/Capabilities.* components/CaseStudies.* components/Events.* \
       components/Testimonials.* components/Footer.* \
       components/accelerators/ \
       components/admin/

echo "Removing old page files..."
rm -f pages/AcceleratorDetail.* pages/AcceleratorsShowcase.* \
      pages/AcceleratorsSingle.* pages/AdminDashboard.*

echo "Removing old app files..."
rm -f App.tsx AppRoutes.tsx

echo "Removing unclear folders..."
rm -rf source/

echo "✅ Cleanup complete!"
echo ""
echo "New structure is in:"
echo "  - src/features/home/components/"
echo "  - src/features/accelerators/components/"
echo "  - src/features/admin/components/"
echo "  - src/pages/ (new page files)"
```

## 📝 What to Keep

**Keep these folders** (they're the new structure):

- ✅ `src/api/` - API service layer
- ✅ `src/constants/` - Application constants
- ✅ `src/features/` - Feature-based components
- ✅ `src/hooks/` - Custom hooks (empty for now)
- ✅ `src/layouts/` - Layout components
- ✅ `src/pages/` - New page components (HomePage, AcceleratorsPage, etc.)
- ✅ `src/routes/` - Routing configuration
- ✅ `src/styles/` - Global styles
- ✅ `src/types/` - TypeScript types
- ✅ `src/utils/` - Utility functions
- ✅ `src/assets/` - Build-time assets
- ✅ `src/components/` - Keep this for future shared/UI components

## ⚠️ Before Cleanup

1. **Test the new structure:**
   ```bash
   npm run dev
   ```

2. **Verify all routes work:**
   - http://localhost:5173 (Homepage)
   - http://localhost:5173/accelerators (Accelerators)
   - http://localhost:5173/admin (Admin)

3. **Check for TypeScript errors:**
   ```bash
   npm run build
   ```

4. **Review the changes:**
   - Make sure you understand the new structure
   - Check that all features work as expected

## 🔄 After Cleanup

If you removed old files and need them back:

```bash
# Restore from git (if committed before restructure)
git checkout HEAD~1 -- src/components/
git checkout HEAD~1 -- src/pages/
```

## 📚 Reference

The old files are duplicates of:

| Old Location | New Location |
|-------------|-------------|
| `components/Header.tsx` | `features/home/components/Header.tsx` |
| `components/accelerators/*` | `features/accelerators/components/*` |
| `components/admin/*` | `features/admin/components/*` |
| `pages/AcceleratorsSingle.tsx` | `pages/AcceleratorsPage.tsx` |
| `pages/AdminDashboard.tsx` | `pages/AdminDashboardPage.tsx` |
| `App.tsx` | Replaced by routing system |
| `AppRoutes.tsx` | `routes/index.tsx` |

## 💡 Recommendation

**Wait a few days** before cleanup:
- Test thoroughly in development
- Make sure team is comfortable with new structure
- Verify all features work correctly
- Then run the cleanup script

---

**Note:** This cleanup is optional. The old files don't affect the new structure, they just take up space.

