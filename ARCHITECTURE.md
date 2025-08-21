# Wall Crawler - Architecture Documentation

## Overview

Wall Crawler is a full-stack TypeScript application for managing and displaying wallpaper collections from GitHub repositories. The application follows a modern React + Node.js architecture with SQLite for data persistence.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **TanStack Router** for routing with file-based routing
- **TanStack Query** (React Query) for server state management
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** with better-sqlite3 for database
- **GitHub API** integration for wallpaper data

## Project Structure

```
├── src/                          # Frontend source code
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Basic UI components (buttons, inputs, etc.)
│   │   └── error/              # Error handling components
│   ├── hooks/                  # Custom React hooks
│   │   └── use-wallpapers/     # Wallpaper-related hooks
│   ├── lib/                    # Utility libraries
│   │   ├── api/                # API client and services
│   │   ├── database/           # Database operations (shared with backend)
│   │   ├── query/              # React Query configuration
│   │   ├── utils/              # General utilities
│   │   └── validation/         # Input validation schemas
│   ├── pages/                  # Page components
│   ├── routes/                 # TanStack Router route definitions
│   └── types/                  # TypeScript type definitions
├── server/                      # Backend source code
│   ├── middleware/             # Express middleware
│   └── routes/                 # API route handlers
└── data/                       # SQLite database storage
```

## Architectural Patterns

### 1. Single Source of Truth Data Flow

The application implements a **cache-aside pattern** where:

1. **Frontend** requests data through React Query hooks
2. **API Service Layer** (`src/lib/api/wallpaper-service.ts`) handles all external API communication
3. **Backend API** (`server/routes/`) provides RESTful endpoints
4. **Database Layer** (`src/lib/database/`) manages SQLite operations
5. **GitHub API** serves as the ultimate data source

```
Frontend Hooks → API Service → Backend API → Database ← GitHub API
                     ↑                              ↓
                React Query Cache              Sync Operations
```

### 2. Error Handling Strategy

**Centralized Error Handling**:
- `src/lib/utils/error-handling.ts` - Centralized error utilities
- `src/components/error/error-boundary.tsx` - React Error Boundaries
- `server/middleware/validation.ts` - API error handling

**Error Handling Levels**:
1. **Network Level**: API client with retry logic
2. **Service Level**: Graceful degradation with fallback values
3. **Component Level**: Error boundaries with user-friendly messages
4. **Global Level**: Unhandled error capture

### 3. Caching Strategy

**Multi-layered Caching**:
1. **React Query** (Client-side): Intelligent background updates
2. **SQLite Database** (Server-side): Persistent cache with sync metadata
3. **GitHub API** (Source): Rate-limited external data source

**Cache Invalidation**:
- Time-based: Different TTL for different data types
- Event-based: Manual invalidation on data mutations
- Dependency-based: Related data invalidation

### 4. Performance Optimizations

**Frontend**:
- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Manual chunks for vendor libraries
- **Query Optimization**: Appropriate cache strategies per data type

**Backend**:
- **Database Indexes**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Singleton database pattern
- **Query Performance**: Prepared statements with performance monitoring

**Build System**:
- **Vite**: Fast development and optimized production builds
- **TypeScript**: Compile-time optimization and tree shaking
- **ESBuild**: Fast minification and bundling

## Database Schema

### Core Tables

```sql
categories (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT,
  path TEXT,
  wallpaper_count INTEGER,
  created_at TEXT,
  updated_at TEXT
)

wallpapers (
  id INTEGER PRIMARY KEY,
  github_id TEXT UNIQUE,
  name TEXT,
  category_id INTEGER,
  download_url TEXT,
  is_featured INTEGER,
  download_count INTEGER,
  view_count INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)

sync_meta (
  id INTEGER PRIMARY KEY,
  category_name TEXT UNIQUE,
  sync_status TEXT CHECK(status IN ('pending', 'syncing', 'completed', 'failed')),
  last_sync_at TEXT,
  wallpaper_count INTEGER
)

analytics (
  id INTEGER PRIMARY KEY,
  event_type TEXT,
  wallpaper_id INTEGER,
  category_name TEXT,
  timestamp TEXT,
  FOREIGN KEY (wallpaper_id) REFERENCES wallpapers(id)
)
```

### Performance Indexes
- `idx_wallpapers_category_id` - Fast category lookups
- `idx_wallpapers_is_featured` - Featured wallpaper queries
- `idx_categories_slug` - URL-based category access
- `idx_analytics_event_type` - Analytics aggregation

## API Design

### RESTful Endpoints

```
GET  /api/categories                    # List all categories
GET  /api/categories/:slug              # Get category by slug
GET  /api/wallpapers                    # List wallpapers (with filters)
GET  /api/wallpapers/featured           # Get featured wallpapers
POST /api/wallpapers/:id/view           # Track view event
POST /api/sync/categories               # Sync from GitHub
GET  /api/analytics/stats               # Get usage statistics
```

### Request/Response Format

```typescript
// Standard API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Error Response
interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: string[];
}
```

## Security Measures

### Input Validation
- **Server-side validation**: All inputs validated before processing
- **XSS Prevention**: Input sanitization and output encoding
- **SQL Injection**: Prepared statements only
- **Path Traversal**: File path validation

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` for API endpoints

### Rate Limiting
- IP-based rate limiting per endpoint
- Graceful degradation under load
- Request logging for monitoring

## Deployment Considerations

### Environment Configuration
```env
NODE_ENV=production|development
PORT=3001
FRONTEND_URL=https://your-domain.com
GITHUB_TOKEN=your_github_token
```

### Database Management
- **WAL Mode**: Better concurrent performance
- **Backup Strategy**: Regular database backups
- **Migration System**: Version-controlled schema changes

### Monitoring
- **Query Performance**: Slow query detection and logging
- **Error Tracking**: Centralized error collection
- **Usage Analytics**: Built-in analytics system

## Development Workflow

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Testing Strategy
- **Unit Tests**: Critical business logic
- **Integration Tests**: API endpoints
- **E2E Tests**: User workflows
- **Performance Tests**: Database and API performance

## Future Enhancements

### Scalability
- **Database**: PostgreSQL migration for larger datasets
- **Caching**: Redis for distributed caching
- **CDN**: Static asset delivery optimization

### Features
- **User Authentication**: User accounts and preferences
- **Upload System**: Direct wallpaper uploads
- **Social Features**: Rating and comments system
- **Mobile App**: React Native companion app

---

*This architecture documentation reflects the current state of the application after Phase 3 optimizations and should be updated as the system evolves.*