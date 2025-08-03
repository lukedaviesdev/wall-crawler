// API-based wallpaper service (replaces the database direct calls)
import { apiClient } from './client';
import type { WallpaperItem, WallpaperCategory } from '@/types/wallpaper';

/**
 * Get categories from API
 */
export const getCategories = async (): Promise<WallpaperCategory[]> => {
  const response = await apiClient.categories.getAll(true);

  if (!response.success) {
    console.error('Failed to fetch categories:', response.error);
    return [];
  }

  return response.data || [];
};

/**
 * Get wallpapers by category from API
 */
export const getWallpapersByCategory = async (
  categorySlug: string,
): Promise<WallpaperItem[]> => {
  // First get the category to find its ID
  const categoryResponse = await apiClient.categories.getBySlug(categorySlug);

  if (!categoryResponse.success) {
    console.warn(`Category ${categorySlug} not found, returning empty array`);
    return [];
  }

  const category = categoryResponse.data;
  const wallpapersResponse = await apiClient.wallpapers.getByCategory(category.id);

  if (!wallpapersResponse.success) {
    console.error(`Failed to fetch wallpapers for ${categorySlug}:`, wallpapersResponse.error);
    return [];
  }

  return wallpapersResponse.data || [];
};

/**
 * Get featured wallpapers from API
 */
export const getFeaturedWallpapers = async (
  limit: number = 18,
): Promise<WallpaperItem[]> => {
  const response = await apiClient.wallpapers.getFeatured(limit);

  if (!response.success) {
    console.error('Failed to fetch featured wallpapers:', response.error);
    return [];
  }

  return response.data || [];
};

/**
 * Get wallpapers with filtering from API
 */
export const getWallpapers = async (
  filters: {
    categoryId?: number;
    categoryName?: string;
    isFeatured?: boolean;
    search?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
  } = {},
): Promise<WallpaperItem[]> => {
  const response = await apiClient.wallpapers.getAll(filters);

  if (!response.success) {
    console.error('Failed to fetch wallpapers:', response.error);
    return [];
  }

  return response.data || [];
};

/**
 * Create wallpaper via API
 */
export const createWallpaper = async (wallpaper: any): Promise<WallpaperItem | null> => {
  const response = await apiClient.wallpapers.create(wallpaper);

  if (!response.success) {
    console.error('Failed to create wallpaper:', response.error);
    return null;
  }

  return response.data;
};

/**
 * Create multiple wallpapers via API
 */
export const createMultipleWallpapers = async (wallpapers: any[]): Promise<boolean> => {
  const response = await apiClient.wallpapers.createBulk(wallpapers);

  if (!response.success) {
    console.error('Failed to create wallpapers in bulk:', response.error);
    return false;
  }

  return true;
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (wallpaperId: number): Promise<boolean> => {
  const response = await apiClient.wallpapers.incrementDownload(wallpaperId);
  return response.success;
};

/**
 * Increment view count
 */
export const incrementViewCount = async (wallpaperId: number): Promise<boolean> => {
  const response = await apiClient.wallpapers.incrementView(wallpaperId);
  return response.success;
};

/**
 * Track analytics event
 */
export const trackEvent = async (
  eventType: string,
  categoryName?: string,
  wallpaperId?: number,
  metadata?: Record<string, unknown>,
): Promise<boolean> => {
  const response = await apiClient.analytics.trackEvent({
    eventType,
    categoryName,
    wallpaperId,
    metadata,
  });

  return response.success;
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
  const response = await apiClient.sync.getStatus();

  if (!response.success) {
    console.error('Failed to get sync status:', response.error);
    return {
      isInitialized: false,
      stats: { categories: 0, wallpapers: 0, lastSync: null },
      needsInitialSync: true,
    };
  }

  return response.data;
};

/**
 * Import data from exported JSON
 */
export const importData = async (data: any): Promise<{
  success: boolean;
  categoriesImported: number;
  wallpapersImported: number;
  syncMetaImported: number;
  errors: string[];
}> => {
  const response = await apiClient.sync.importJson(data);

  if (!response.success) {
    console.error('Failed to import data:', response.error);
    return {
      success: false,
      categoriesImported: 0,
      wallpapersImported: 0,
      syncMetaImported: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  return response.data;
};
