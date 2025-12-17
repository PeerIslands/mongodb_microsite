# MongoDB Microsite Frontend

A Vite.js + React + TypeScript frontend application with industry-standard architecture.

> **🎉 NEW:** Frontend has been restructured! See [docs/NEW_STRUCTURE_GUIDE.md](./docs/NEW_STRUCTURE_GUIDE.md) for details.

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Visit: http://localhost:5173

## Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── api/                   # ✨ API service layer
│   ├── assets/                # Images, icons, etc.
│   ├── components/            # Shared/reusable components
│   ├── constants/             # ✨ App constants
│   ├── features/              # ✨ Feature-based modules
│   │   ├── home/             # Homepage feature
│   │   ├── accelerators/     # Accelerators feature
│   │   └── admin/            # Admin feature
│   ├── hooks/                 # ✨ Custom React hooks
│   ├── layouts/               # ✨ Layout components
│   ├── pages/                 # Page components
│   ├── routes/                # ✨ Routing configuration
│   ├── styles/                # ✨ Global styles
│   ├── types/                 # ✨ TypeScript types
│   ├── utils/                 # ✨ Utility functions
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── NEW_STRUCTURE_GUIDE.md     # ✨ Detailed structure guide
├── MIGRATION_SUMMARY.md       # ✨ Migration overview
└── README.md
```

**✨ = New in restructure**

See [docs/NEW_STRUCTURE_GUIDE.md](./docs/NEW_STRUCTURE_GUIDE.md) for complete details.

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## Configuration

- **Vite Config**: `vite.config.ts` - Build tool configuration
- **TypeScript Config**: `tsconfig.json` - TypeScript compiler options
- **ESLint Config**: `.eslintrc.cjs` - Linting rules
- **Environment Variables**: `.env` - API URLs and other config

## API Proxy

The Vite dev server is configured to proxy `/api` requests to the backend API. Update `VITE_API_BASE_URL` in `.env` to change the backend URL.

## 📚 Documentation

All comprehensive documentation has been moved to the `docs/` folder:

- **[NEW_STRUCTURE_GUIDE.md](./docs/NEW_STRUCTURE_GUIDE.md)** - Complete guide (500+ lines)
- **[RESTRUCTURE_COMPLETE.md](./docs/RESTRUCTURE_COMPLETE.md)** - Quick start guide
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Quick lookup card
- **[MIGRATION_SUMMARY.md](./docs/MIGRATION_SUMMARY.md)** - What changed
- **[RESTRUCTURE_FINAL_REPORT.md](./docs/RESTRUCTURE_FINAL_REPORT.md)** - Complete report
- **[ADMIN_UI_README.md](./docs/ADMIN_UI_README.md)** - Admin interface guide
- **[CLEANUP_OLD_FILES.md](./docs/CLEANUP_OLD_FILES.md)** - Optional cleanup guide



