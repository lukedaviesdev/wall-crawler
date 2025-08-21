# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd wall-crawler

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
# GITHUB_TOKEN=your_github_token_here
# FRONTEND_URL=http://localhost:5173

# Start development servers
npm run dev
```

This starts both frontend (Vite) and backend (Express) in development mode.

## Development Workflow

### Project Scripts
```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Frontend only (Vite)
npm run dev:server       # Backend only (Express)

# Building
npm run build            # Build for production
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Quality Assurance
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode

# Database
npm run db:backup        # Backup database
npm run db:reset         # Clear and reinitialize database
```

### Code Organization

#### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic components (Button, Input, etc.)
│   ├── error/          # Error handling components
│   └── [feature]/      # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── api/           # API client and services
│   ├── query/         # React Query configuration
│   ├── utils/         # General utilities
│   └── validation/    # Input validation
├── pages/             # Page components
├── routes/            # Route definitions
└── types/             # TypeScript definitions
```

#### Backend Structure  
```
server/
├── middleware/        # Express middleware
├── routes/           # API route handlers
└── index.ts          # Server entry point

src/lib/database/     # Shared database layer
├── connection.ts     # Database connection
├── categories.ts     # Category operations  
├── wallpapers.ts     # Wallpaper operations
├── metadata.ts       # Analytics and sync metadata
└── performance.ts    # Performance monitoring
```

### Adding New Features

#### 1. Frontend Component
```typescript
// src/components/new-feature/NewFeature.tsx
import { useState } from 'react';

export const NewFeature = () => {
  const [state, setState] = useState();
  
  return <div>New Feature</div>;
};
```

#### 2. Custom Hook
```typescript  
// src/hooks/use-new-feature/use-new-feature.ts
import { useQuery } from '@tanstack/react-query';

export const useNewFeature = () => {
  return useQuery({
    queryKey: ['newFeature'],
    queryFn: () => fetch('/api/new-feature').then(r => r.json()),
  });
};
```

#### 3. API Endpoint
```typescript
// server/routes/new-feature.ts
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;
```

#### 4. Database Operations
```typescript
// src/lib/database/new-feature.ts
import { getDb } from './connection';

export const getNewFeatureData = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM new_table').all();
};
```

### Styling Guidelines

#### Tailwind CSS Classes
```typescript
// Use utility classes with consistent spacing
<div className="flex items-center space-x-4 p-6">
  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Action
  </Button>
</div>

// Use semantic color variables
className="bg-background text-foreground border-border"
```

#### Component Patterns
```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

const Button = ({ className, variant = 'default', ...props }) => {
  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-md font-medium',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
};
```

### State Management

#### React Query Patterns
```typescript
// Query keys
const keys = {
  all: ['feature'] as const,
  lists: () => [...keys.all, 'list'] as const,
  list: (filters: FilterType) => [...keys.lists(), filters] as const,
  details: () => [...keys.all, 'detail'] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

// Queries
export const useFeatureList = (filters: FilterType) => {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => getFeatureList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations
export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
    },
  });
};
```

### Error Handling

#### API Service Pattern
```typescript
// src/lib/api/service.ts
import { safeAsync, handleApiError } from '@/lib/utils/error-handling';

export const getFeatureData = async (): Promise<FeatureData[]> => {
  return safeAsync(
    async () => {
      const response = await apiClient.feature.getAll();
      return handleApiError('getFeatureData', response, [] as FeatureData[]);
    },
    'getFeatureData',
    []
  );
};
```

#### Component Error Boundaries
```typescript
// Use QueryErrorBoundary for data fetching errors
import { QueryErrorBoundary } from '@/components/error/error-boundary';

<QueryErrorBoundary>
  <FeatureComponent />
</QueryErrorBoundary>
```

### Testing

#### Unit Tests
```typescript
// src/components/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

#### API Tests
```typescript
// server/routes/__tests__/feature.test.ts
import request from 'supertest';
import app from '../../../app';

describe('GET /api/feature', () => {
  it('returns feature data', async () => {
    const response = await request(app)
      .get('/api/feature')
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

### Database Development

#### Adding New Tables
```typescript
// In src/lib/database/connection.ts initializeSchema()
database_.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add indexes
database_.exec(`
  CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);
`);
```

#### Migration Pattern
```typescript
// In runMigrations() function
if (version < 2) {
  console.log('Running migration to v2...');
  database_.exec(`
    ALTER TABLE existing_table 
    ADD COLUMN new_column TEXT DEFAULT NULL;
  `);
}
```

### Performance Best Practices

#### React Query Optimization
```typescript
// Use appropriate cache times
const cacheStrategies = {
  static: { staleTime: 30 * 60 * 1000 }, // 30 min
  dynamic: { staleTime: 5 * 60 * 1000 },  // 5 min  
  realtime: { staleTime: 1 * 60 * 1000 }, // 1 min
};

// Prefetch related data
const prefetchRelated = () => {
  queryClient.prefetchQuery({
    queryKey: keys.related(),
    queryFn: getRelatedData,
  });
};
```

#### Database Query Optimization
```typescript
// Use prepared statements
const getItemsStmt = db.prepare(`
  SELECT * FROM items 
  WHERE category_id = ? 
  ORDER BY created_at DESC 
  LIMIT ?
`);

// Batch operations
const batchInsert = db.transaction((items) => {
  const insert = db.prepare('INSERT INTO items (name) VALUES (?)');
  for (const item of items) insert.run(item.name);
});
```

### Debugging

#### Development Tools
- React DevTools
- TanStack Query DevTools
- Network tab for API debugging
- SQLite browser for database inspection

#### Logging
```typescript
// Use structured logging
console.log('[API] Request:', { method, path, params });
console.error('[API] Error:', { error: error.message, stack: error.stack });

// Performance monitoring
const start = performance.now();
// ... operation
console.log(`Operation took ${performance.now() - start}ms`);
```

### Deployment Preparation

#### Environment Variables
```bash
# Production environment
NODE_ENV=production
PORT=3001
GITHUB_TOKEN=prod_token_here
FRONTEND_URL=https://your-domain.com
```

#### Build Verification
```bash
# Test production build locally
npm run build
npm run preview

# Check bundle size
npm run build -- --analyze
```

#### Database Backup
```bash
# Create backup before deployment
npm run db:backup

# Test database migration
npm run db:migrate --dry-run
```