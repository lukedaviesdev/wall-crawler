// Connection and schema
export { getDb, closeDb } from './connection';

// Category operations
export {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategoryCount,
} from './categories';

// Wallpaper operations
export {
  getWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
  getFeaturedWallpapers,
  createWallpaper,
  incrementDownloadCount,
  incrementViewCount,
} from './wallpapers';

// Metadata and analytics
export {
  updateSyncMeta,
  getSyncMeta,
  getAllSyncMeta,
  trackEvent,
  getAnalytics,
  getStats,
  getSyncStatus,
} from './metadata';

// Sync operations (re-export from existing file)
export {
  syncCategories,
  getSyncStatus as getSyncOperationStatus,
} from './sync';
