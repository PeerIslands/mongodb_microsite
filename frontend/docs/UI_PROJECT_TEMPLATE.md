# Vite.js + React + TypeScript Project Template - Universal Starter Guide

This is a universal template for creating new Vite.js + React + TypeScript projects from scratch. Use this guide to bootstrap any modern React application with best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Project Structure](#project-structure)
4. [Initial Setup](#initial-setup)
5. [Core Configuration](#core-configuration)
6. [Application Structure](#application-structure)
7. [Optional Features](#optional-features)
8. [Testing Setup](#testing-setup)
9. [Docker Setup](#docker-setup)
10. [Development Workflow](#development-workflow)

---

## Quick Start

### 1. Create Project with Vite
```bash
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
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

---

## Project Overview

### Technology Stack (Core)
- **Build Tool**: Vite 5.0+
- **Framework**: React 18.2+
- **Language**: TypeScript 5.2+
- **Package Manager**: npm, pnpm, or yarn

### Optional Additions
- **UI Library**: Material-UI, Ant Design, Chakra UI, Tailwind CSS
- **State Management**: Zustand, Redux Toolkit, Jotai
- **Data Fetching**: TanStack Query (React Query), SWR
- **Routing**: React Router DOM
- **Forms**: React Hook Form, Formik
- **Validation**: Yup, Zod
- **HTTP Client**: Axios, Fetch API
- **Authentication**: Auth0, Firebase Auth, Custom JWT
- **Styling**: CSS Modules, Styled Components, Emotion

---

## Project Structure

### Minimal Structure
```
my-react-app/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/              # Images, icons, etc.
│   ├── components/          # Reusable components
│   │   └── Button.tsx
│   ├── pages/               # Page components
│   │   └── HomePage.tsx
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite types
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── .gitignore
```

### Extended Structure (with optional features)
```
my-react-app/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/              # Base UI components
│   │   └── [Feature]/        # Feature-specific components
│   ├── pages/
│   ├── hooks/                # Custom React hooks
│   ├── services/            # API services
│   ├── store/                # State management
│   ├── context/             # React Context providers
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   ├── constants/           # Constants
│   ├── config/              # Configuration files
│   ├── theme/               # Theme configuration (if using MUI)
│   ├── App.tsx
│   └── main.tsx
├── tests/                    # Test files
└── [config files]
```

---

## Initial Setup

### 1. package.json (Minimal)

```json
{
  "name": "my-react-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vitejs/plugin-react": "^4.1.1",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

### 2. .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
```

### 3. .env.example

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

---

## Core Configuration

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Application Structure

### Main Entry Point (src/main.tsx)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Root Component (src/App.tsx)

```typescript
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React + TypeScript + Vite</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
      </header>
    </div>
  )
}

export default App
```

### Example Component (src/components/Button.tsx)

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded transition-colors'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  }
  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Example Page (src/pages/HomePage.tsx)

```typescript
import { useState, useEffect } from 'react'
import Button from '../components/Button'

export default function HomePage() {
  const [data, setData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/health')
      const result = await response.json()
      setData(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Home Page</h1>
      <Button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </Button>
      {data && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {data}
        </pre>
      )}
    </div>
  )
}
```

---

## Optional Features

### 1. Routing (React Router)

**Install:**
```bash
npm install react-router-dom
npm install --save-dev @types/react-router-dom
```

**Setup (src/App.tsx):**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

### 2. State Management (Zustand)

**Install:**
```bash
npm install zustand
```

**Store (src/store/useCounterStore.ts):**
```typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

### 3. Data Fetching (TanStack Query)

**Install:**
```bash
npm install @tanstack/react-query
```

**Setup (src/main.tsx):**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Usage:**
```typescript
import { useQuery } from '@tanstack/react-query'

function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: async () => {
      const response = await fetch('/api/v1/data')
      return response.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{JSON.stringify(data)}</div>
}
```

### 4. HTTP Client (Axios)

**Install:**
```bash
npm install axios
```

**Setup (src/services/api.ts):**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 5. UI Library (Material-UI)

**Install:**
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
```

**Setup (src/main.tsx):**
```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
```

### 6. Forms (React Hook Form + Yup)

**Install:**
```bash
npm install react-hook-form yup @hookform/resolvers
```

**Usage:**
```typescript
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
})

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: any) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 7. Styling (Tailwind CSS)

**Install:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Testing Setup

### Vitest (Recommended for Vite)

**Install:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**src/test/setup.ts:**
```typescript
import '@testing-library/jest-dom'
```

**Example Test (src/components/Button.test.tsx):**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Docker Setup

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  ui:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://api:8000
    depends_on:
      - api

  api:
    image: your-api-image
    ports:
      - "8000:8000"
```

---

## Development Workflow

### 1. Development Server
```bash
npm run dev
```

### 2. Code Formatting (Prettier)

**Install:**
```bash
npm install -D prettier
```

**.prettierrc:**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**package.json:**
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

### 3. Linting (ESLint)

**ESLint is included by default with Vite React template**

**package.json:**
```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  }
}
```

### 4. Type Checking
```bash
npm run build  # Includes type checking
# or
npx tsc --noEmit
```

---

## Best Practices

1. **Use TypeScript** for type safety
2. **Component composition** over inheritance
3. **Custom hooks** for reusable logic
4. **Code splitting** with lazy loading
5. **Error boundaries** for error handling
6. **Proper loading states** for async operations
7. **Environment variables** for configuration
8. **Consistent naming** conventions
9. **Accessibility** (a11y) considerations
10. **Performance optimization** (memo, useMemo, useCallback)

---

## Next Steps

1. **Add routing** - Set up React Router for navigation
2. **Add state management** - Choose Zustand, Redux, or Context API
3. **Set up API integration** - Configure Axios or Fetch
4. **Add UI library** - Choose Material-UI, Tailwind, or another
5. **Implement authentication** - Add login/logout flow
6. **Write tests** - Set up Vitest or Jest
7. **Add CI/CD** - Automate testing and deployment
8. **Optimize build** - Configure production build settings
9. **Deploy** - Deploy to Vercel, Netlify, or your platform

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

---

## Template Checklist

- [ ] Project created with Vite
- [ ] TypeScript configured
- [ ] Basic components created
- [ ] Routing set up (if needed)
- [ ] State management configured (if needed)
- [ ] API integration set up (if needed)
- [ ] UI library integrated (if needed)
- [ ] Tests written and passing
- [ ] Docker setup working
- [ ] Production build tested
- [ ] Documentation updated
