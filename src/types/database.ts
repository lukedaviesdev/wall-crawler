// Database table interfaces for SQLite storage

/**
 * Categories table
 */
export interface DatabaseCategory {
  id: number;
  name: string;
  slug: string;
  path: string;
  description: string;
  wallpaper_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wallpapers table
 */
export interface DatabaseWallpaper {
  id: number;
  github_id: string; // sha from GitHub
  name: string;
  path: string;
  category_id: number;
  category_name: string;
  download_url: string;
  html_url: string;
  size: number;
  width?: number;
  height?: number;
  aspect_ratio?: 'portrait' | 'landscape' | 'square';
  dominant_color?: string;
  is_featured: boolean;
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Sync metadata table
 */
export interface DatabaseSyncMeta {
  id: number;
  category_name: string;
  last_synced: string;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  wallpaper_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Analytics table for tracking usage
 */
export interface DatabaseAnalytics {
  id: number;
  event_type: 'view' | 'download' | 'search' | 'category_view';
  wallpaper_id?: number;
  category_name?: string;
  metadata?: string;
  timestamp: string;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  path: string;
  readonly: boolean;
  memory: boolean;
  timeout: number;
}

/**
 * Query filters for wallpapers
 */
export interface DatabaseWallpaperFilters {
  categoryId?: number;
  categoryName?: string;
  isFeatured?: boolean;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  minWidth?: number;
  minHeight?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'size' | 'download_count' | 'view_count' | 'created_at';
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * Database service interface
 */
export interface DatabaseService {
  // Categories
  getCategories(): DatabaseCategory[];
  getCategoryBySlug(slug: string): DatabaseCategory | null;
  createCategory(
    category: Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'>,
  ): DatabaseCategory;
  updateCategory(id: number, updates: Partial<DatabaseCategory>): boolean;

  // Wallpapers
  getWallpapers(filters?: DatabaseWallpaperFilters): DatabaseWallpaper[];
  getWallpaperById(id: number): DatabaseWallpaper | null;
  getWallpapersByCategory(
    categoryId: number,
    limit?: number,
  ): DatabaseWallpaper[];
  getFeaturedWallpapers(limit?: number): DatabaseWallpaper[];
  createWallpaper(
    wallpaper: Omit<DatabaseWallpaper, 'id' | 'created_at' | 'updated_at'>,
  ): DatabaseWallpaper;
  updateWallpaper(id: number, updates: Partial<DatabaseWallpaper>): boolean;
  incrementDownloadCount(id: number): boolean;
  incrementViewCount(id: number): boolean;

  // Sync metadata
  getSyncMeta(categoryName?: string): DatabaseSyncMeta[];
  updateSyncMeta(
    categoryName: string,
    status: DatabaseSyncMeta['sync_status'],
    count?: number,
    error?: string,
  ): boolean;

  // Analytics
  trackEvent(event: Omit<DatabaseAnalytics, 'id' | 'timestamp'>): boolean;
  getAnalytics(startDate?: string, endDate?: string): DatabaseAnalytics[];

  // Utility
  close(): void;
  backup(path: string): boolean;
  getStats(): {
    categories: number;
    wallpapers: number;
    lastSync: string | null;
  };
}
