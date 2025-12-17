# 🚀 Quick Reference Card

## 📁 Directory Structure

```
src/
├── api/              # API services
├── constants/        # App constants
├── features/         # Feature modules
│   ├── home/        # Homepage
│   ├── accelerators/# Accelerators
│   └── admin/       # Admin
├── hooks/           # Custom hooks
├── layouts/         # Layouts
├── pages/           # Pages
├── routes/          # Router
├── styles/          # Global styles
├── types/           # TypeScript
└── utils/           # Utilities
```

## 💻 Common Imports

```typescript
// API Services
import { acceleratorsService, caseStudiesService, analyticsService } from '@/api';

// Components
import { Header, Hero, Footer } from '@/features/home/components';

// Types
import type { Accelerator, CaseStudy } from '@/types';

// Utilities
import { formatNumber, slugify, isValidEmail } from '@/utils';

// Constants
import { ROUTES, FILE_UPLOAD, INDUSTRIES } from '@/constants';

// Layouts
import { MainLayout, AdminLayout } from '@/layouts';
```

## 🔧 API Service Examples

```typescript
// Get all accelerators
const accelerators = await acceleratorsService.getAll();

// Get by slug
const accelerator = await acceleratorsService.getBySlug('hbase');

// Create (admin)
const newAccelerator = await acceleratorsService.create(data);

// Upload file
const result = await uploadService.uploadFile(file, 'accelerators');

// Get analytics
const analytics = await analyticsService.getSiteWide();
```

## 📝 Type Examples

```typescript
// Accelerator
const accelerator: Accelerator = {
  id: '1',
  slug: 'hbase',
  name: 'HBase Migration',
  status: 'active',
  featured: true,
  // ...
};

// Case Study
const caseStudy: CaseStudy = {
  id: '1',
  slug: 'finance-migration',
  title: 'Finance Company Migration',
  industry: 'Financial Services',
  // ...
};

// DTO
const createDto: CreateAcceleratorDto = {
  name: 'New Accelerator',
  slug: 'new-accelerator',
  // ...
};
```

## 🎨 Utility Examples

```typescript
// Formatting
formatNumber(1000000);              // "1,000,000"
formatCompactNumber(1500000);       // "1.5M"
formatBytes(1048576);               // "1.00 MB"
formatDate(new Date());             // "December 17, 2025"
formatRelativeTime(date);           // "2 days ago"
slugify('Hello World');             // "hello-world"
truncate('Long text...', 50);       // "Long text..."
formatPercentage(0.856, 1);         // "85.6%"

// Validation
isValidEmail('test@example.com');   // true
isValidUrl('https://example.com');  // true
isValidSlug('my-slug');             // true
isValidImageFile(file);             // true
isValidImageSize(file);             // true
validateFile(file, types, maxSize); // { valid: true }
```

## 🔑 Constants Reference

```typescript
// Routes
ROUTES.HOME                    // '/'
ROUTES.ACCELERATORS           // '/accelerators'
ROUTES.ACCELERATOR_DETAIL     // '/accelerators/:slug'
ROUTES.ADMIN                  // '/admin'

// Accelerator Categories
ACCELERATOR_CATEGORIES = [
  'Migration',
  'Modernization',
  'Integration',
  'Performance'
]

// File Upload
FILE_UPLOAD.MAX_IMAGE_SIZE    // 5MB
FILE_UPLOAD.MAX_PDF_SIZE      // 10MB
FILE_UPLOAD.ALLOWED_IMAGE_TYPES
FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES

// Storage Keys
STORAGE_KEYS.AUTH_TOKEN       // 'auth_token'
STORAGE_KEYS.USER_PREFERENCES // 'user_preferences'
```

## 🏗️ Component Structure

```typescript
// Feature component
src/features/{feature}/components/MyComponent.tsx
src/features/{feature}/components/MyComponent.css

// Shared component
src/components/ui/Button.tsx
src/components/ui/Button.css

// Page component
src/pages/MyPage.tsx
src/pages/MyPage.css

// Layout component
src/layouts/MyLayout.tsx
src/layouts/MyLayout.css
```

## 🔀 Routing

```typescript
// Define routes
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/accelerators', element: <AcceleratorsPage /> },
      // ...
    ],
  },
]);

// Navigate
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/accelerators');

// Get params
import { useParams } from 'react-router-dom';
const { slug } = useParams();
```

## 🌍 Environment Variables

```typescript
// Define in .env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=MongoDB Microsite

// Access in code
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## 📦 NPM Scripts

```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## 🎯 Best Practices

1. **Use barrel exports**
   ```typescript
   // ✅ Good
   import { Header, Hero } from '@/features/home/components';
   
   // ❌ Bad
   import Header from '@/features/home/components/Header';
   ```

2. **Use API services**
   ```typescript
   // ✅ Good
   const data = await acceleratorsService.getAll();
   
   // ❌ Bad
   const response = await fetch('/api/accelerators');
   ```

3. **Use TypeScript types**
   ```typescript
   // ✅ Good
   import type { Accelerator } from '@/types';
   const acc: Accelerator = ...;
   
   // ❌ Bad
   const acc = ...;
   ```

4. **Use constants**
   ```typescript
   // ✅ Good
   navigate(ROUTES.ACCELERATORS);
   
   // ❌ Bad
   navigate('/accelerators');
   ```

5. **Use utilities**
   ```typescript
   // ✅ Good
   const formatted = formatNumber(count);
   
   // ❌ Bad
   const formatted = count.toLocaleString();
   ```

## 🐛 Debugging

```typescript
// API errors
// Check: src/api/client.ts for interceptors

// Type errors
// Check: src/types/models/*.ts for definitions

// Import errors
// Check: tsconfig.json for path aliases

// Build errors
// Run: npm run build to see TypeScript errors

// Runtime errors
// Check: Browser console for errors
```

## 📚 Documentation

- **NEW_STRUCTURE_GUIDE.md** - Complete guide (500+ lines)
- **MIGRATION_SUMMARY.md** - What changed (400+ lines)
- **RESTRUCTURE_COMPLETE.md** - Quick start (300+ lines)
- **QUICK_REFERENCE.md** - This card

## 🆘 Common Issues

**Module not found**
```typescript
// Use @ alias
import { Header } from '@/features/home/components';
```

**Type errors**
```typescript
// Import types
import type { Accelerator } from '@/types';
```

**API errors**
```typescript
// Check token
localStorage.setItem('auth_token', token);
```

**Build errors**
```bash
# Check TypeScript
npm run build
```

## 🎉 You're All Set!

```bash
npm run dev
```

**Visit:** http://localhost:5173

---

**Need more info?** See [NEW_STRUCTURE_GUIDE.md](./NEW_STRUCTURE_GUIDE.md)

