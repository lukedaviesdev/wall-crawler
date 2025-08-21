// Connection and schema
export { getDb, closeDb } from './connection';

// Category operations
export {
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryCount,
  getCategoriesWithCounts,
} from './categories';

// Wallpaper operations
export {
  getWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
  getFeaturedWallpapers,
  createWallpaper,
  createMultipleWallpapers,
  updateWallpaper,
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
  getAnalyticsSummary,
  cleanupAnalytics,
  getCategoryStats,
  getStats,
  getSyncStatus,
} from './metadata';

// Sync operations (re-export from existing file)
export {
  syncCategories,
  getSyncStatus as getSyncOperationStatus,
} from './sync';

// Import operations
export { importFromFile, importFromJson, clearDatabase } from './import';

// Debug utilities are available separately in ./debug.ts (browser only)
