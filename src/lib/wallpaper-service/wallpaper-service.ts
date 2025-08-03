// Wallpaper service - now using API backend instead of direct database calls
export {
  getCategories,
  getWallpapersByCategory,
  getFeaturedWallpapers,
  getWallpapers,
  createWallpaper,
  createMultipleWallpapers,
  incrementDownloadCount,
  incrementViewCount,
  trackEvent,
  getSyncStatus,
  importData,
} from '@/lib/api/wallpaper-service';
