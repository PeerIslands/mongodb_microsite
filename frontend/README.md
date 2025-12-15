# MongoDB Microsite Frontend

A Vite.js + React + TypeScript frontend application.

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
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   ├── index.css        # Global styles
│   └── vite-env.d.ts    # Vite types
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .eslintrc.cjs
├── .env.example
└── README.md
```

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

