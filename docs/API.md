# API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication
Currently, no authentication is required for read operations. Future versions may implement API keys for rate limiting.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {}, 
  "count": 0,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable error message",
  "details": ["Validation error 1", "Validation error 2"]
}
```

## Endpoints

### Categories

#### GET /api/categories
Get all categories with optional wallpaper counts.

**Query Parameters:**
- `withCounts` (boolean) - Include wallpaper counts

**Example Request:**
```http
GET /api/categories?withCounts=true
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "nature",
      "name": "Nature",
      "path": "wallpapers/nature",
      "wallpaper_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### GET /api/categories/:slug
Get a specific category by slug.

**Parameters:**
- `slug` (string) - Category slug (e.g., "nature")

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "nature",
    "name": "Nature",
    "path": "wallpapers/nature",
    "wallpaper_count": 45
  }
}
```

### Wallpapers

#### GET /api/wallpapers
Get wallpapers with optional filtering and pagination.

**Query Parameters:**
- `categoryId` (number) - Filter by category ID
- `categoryName` (string) - Filter by category slug
- `isFeatured` (boolean) - Filter featured wallpapers
- `search` (string) - Search in name and category
- `orderBy` (string) - Sort field (name, size, created_at)
- `orderDirection` (string) - Sort direction (ASC, DESC)
- `limit` (number) - Number of results (max 100)
- `offset` (number) - Results offset for pagination

**Example Request:**
```http
GET /api/wallpapers?categoryName=nature&limit=20&offset=0
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "mountain-sunset.jpg",
      "category_name": "nature",
      "download_url": "https://github.com/user/repo/raw/main/...",
      "size": 2048576,
      "width": 1920,
      "height": 1080,
      "is_featured": 1,
      "download_count": 150,
      "view_count": 1200
    }
  ],
  "count": 1
}
```

#### GET /api/wallpapers/featured
Get featured wallpapers.

**Query Parameters:**
- `limit` (number) - Number of results (default: 18)

#### GET /api/wallpapers/category/:categoryId
Get wallpapers by category ID.

**Parameters:**
- `categoryId` (number) - Category ID

**Query Parameters:**
- `limit` (number) - Number of results

#### POST /api/wallpapers/:id/view
Track a view event for analytics.

**Parameters:**
- `id` (number) - Wallpaper ID

**Example Response:**
```json
{
  "success": true,
  "message": "View tracked successfully"
}
```

#### POST /api/wallpapers/:id/download
Track a download event for analytics.

**Parameters:**
- `id` (number) - Wallpaper ID

### Sync Operations

#### GET /api/sync/status
Get overall synchronization status.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "operation": {
      "isRunning": false,
      "lastRun": "2024-01-01T12:00:00Z",
      "progress": 100
    },
    "categories": [
      {
        "category_name": "nature",
        "sync_status": "completed",
        "last_sync_at": "2024-01-01T12:00:00Z",
        "wallpaper_count": 45
      }
    ],
    "stats": {
      "categories": 5,
      "wallpapers": 200,
      "lastSync": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### POST /api/sync/categories
Start category synchronization from GitHub.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "categoriesProcessed": 5,
    "wallpapersAdded": 20,
    "wallpapersUpdated": 5
  },
  "message": "Category sync completed"
}
```

#### POST /api/sync/import/json
Import data from JSON payload.

**Request Body:**
```json
{
  "categories": [...],
  "wallpapers": [...],
  "sync_meta": [...]
}
```

#### DELETE /api/sync/clear
Clear all database data (requires confirmation).

**Request Body:**
```json
{
  "confirm": "CLEAR_ALL_DATA"
}
```

### Analytics

#### GET /api/analytics/stats
Get usage statistics.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalViews": 50000,
    "totalDownloads": 12000,
    "topCategories": [
      { "name": "nature", "views": 15000 },
      { "name": "abstract", "views": 12000 }
    ],
    "topWallpapers": [
      { "id": 1, "name": "sunset.jpg", "downloads": 500 }
    ]
  }
}
```

#### GET /api/analytics/events
Get analytics events with filtering.

**Query Parameters:**
- `eventType` (string) - Filter by event type
- `categoryName` (string) - Filter by category
- `startDate` (string) - Start date (ISO format)
- `endDate` (string) - End date (ISO format)
- `limit` (number) - Number of results

#### POST /api/analytics/events
Track a custom analytics event.

**Request Body:**
```json
{
  "eventType": "custom_action",
  "wallpaperId": 1,
  "categoryName": "nature",
  "metadata": {
    "customField": "value"
  }
}
```

## Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Validation Error | Invalid request parameters |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

## Rate Limiting

- **Limit**: 1000 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Exceeded**: HTTP 429 with retry information

## CORS Policy

- **Development**: All origins allowed
- **Production**: Specific domain whitelist
- **Credentials**: Not supported (no cookies/auth)

## Performance Notes

- **Pagination**: Use `limit` and `offset` for large datasets
- **Caching**: Responses cached for 5-30 minutes depending on endpoint
- **Compression**: Gzip compression enabled for all responses
- **Database**: Query performance monitored, slow queries logged