// API-based wallpaper service (replaces the database direct calls)
import {
  handleApiError,
  logWarning,
  safeAsync,
} from '@/lib/utils/error-handling';

import { apiClient } from './client';

import type { DatabaseCategory } from '@/types/database';
import type { WallpaperItem } from '@/types/wallpaper';

/**
 * Get categories from API
 */
export const getCategories = async (): Promise<DatabaseCategory[]> => {
  return safeAsync(
    async () => {
      const response = await apiClient.categories.getAll(true);
      return handleApiError(
        'getCategories',
        response,
        [] as DatabaseCategory[],
      ) as DatabaseCategory[];
    },
    'getCategories',
    [],
  );
};

/**
 * Get wallpapers by category from API
 */
export const getWallpapersByCategory = async (
  categorySlug: string,
): Promise<WallpaperItem[]> => {
  return safeAsync(
    async () => {
      // First get the category to find its ID
      const categoryResponse =
        await apiClient.categories.getBySlug(categorySlug);

      if (!categoryResponse.success) {
        logWarning(
          'getWallpapersByCategory',
          `Category ${categorySlug} not found, returning empty array`,
        );
        return [];
      }

      const category = categoryResponse.data as DatabaseCategory;
      const wallpapersResponse = await apiClient.wallpapers.getByCategory(
        category.id,
      );

      return handleApiError(
        `getWallpapersByCategory(${categorySlug})`,
        wallpapersResponse,
        [] as WallpaperItem[],
      ) as WallpaperItem[];
    },
    'getWallpapersByCategory',
    [],
  );
};

/**
 * Get featured wallpapers from API
 */
export const getFeaturedWallpapers = async (
  limit: number = 18,
): Promise<WallpaperItem[]> => {
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.getFeatured(limit);
      return handleApiError(
        'getFeaturedWallpapers',
        response,
        [] as WallpaperItem[],
      ) as WallpaperItem[];
    },
    'getFeaturedWallpapers',
    [],
  );
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
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.getAll(filters);
      return handleApiError(
        'getWallpapers',
        response,
        [] as WallpaperItem[],
      ) as WallpaperItem[];
    },
    'getWallpapers',
    [],
  );
};

/**
 * Create wallpaper via API
 */
export const createWallpaper = async (
  wallpaper: any,
): Promise<WallpaperItem | null> => {
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.create(wallpaper);
      return handleApiError(
        'createWallpaper',
        response,
        null as WallpaperItem | null,
      ) as WallpaperItem | null;
    },
    'createWallpaper',
    null,
  );
};

/**
 * Create multiple wallpapers via API
 */
export const createMultipleWallpapers = async (
  wallpapers: any[],
): Promise<boolean> => {
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.createBulk(wallpapers);
      if (response.success) return true;
      handleApiError('createMultipleWallpapers', response, false);
      return false;
    },
    'createMultipleWallpapers',
    false,
  );
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (
  wallpaperId: number,
): Promise<boolean> => {
  return safeAsync(
    async () => {
      const response =
        await apiClient.wallpapers.incrementDownload(wallpaperId);
      if (response.success) return true;
      handleApiError('incrementDownloadCount', response, false);
      return false;
    },
    'incrementDownloadCount',
    false,
  );
};

/**
 * Increment view count
 */
export const incrementViewCount = async (
  wallpaperId: number,
): Promise<boolean> => {
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.incrementView(wallpaperId);
      if (response.success) return true;
      handleApiError('incrementViewCount', response, false);
      return false;
    },
    'incrementViewCount',
    false,
  );
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
  return safeAsync(
    async () => {
      const response = await apiClient.analytics.trackEvent({
        eventType,
        categoryName,
        wallpaperId,
        metadata,
      });
      if (response.success) return true;
      handleApiError('trackEvent', response, false);
      return false;
    },
    'trackEvent',
    false,
  );
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
  const fallbackValue = {
    isInitialized: false,
    stats: { categories: 0, wallpapers: 0, lastSync: null },
    needsInitialSync: true,
  };

  return safeAsync(
    async () => {
      const response = await apiClient.sync.getStatus();
      if (response.success) return response.data;
      handleApiError('getSyncStatus', response, fallbackValue);
      return fallbackValue;
    },
    'getSyncStatus',
    fallbackValue,
  );
};

/**
 * Import data from exported JSON
 */
export const importData = async (
  data: any,
): Promise<{
  success: boolean;
  categoriesImported: number;
  wallpapersImported: number;
  syncMetaImported: number;
  errors: string[];
}> => {
  const fallbackValue = {
    success: false,
    categoriesImported: 0,
    wallpapersImported: 0,
    syncMetaImported: 0,
    errors: ['Failed to import data'],
  };

  return safeAsync(
    async () => {
      const response = await apiClient.sync.importJson(data);
      if (response.success) {
        return response.data as {
          success: boolean;
          categoriesImported: number;
          wallpapersImported: number;
          syncMetaImported: number;
          errors: string[];
        };
      }
      handleApiError('importData', response, fallbackValue);
      return {
        ...fallbackValue,
        errors: [response.error || 'Unknown error'],
      };
    },
    'importData',
    fallbackValue,
  );
};

/**
 * Get all wallpapers via API (replaces direct GitHub API call)
 */
export const getAllWallpapers = async (): Promise<WallpaperItem[]> => {
  return safeAsync(
    async () => {
      const response = await apiClient.wallpapers.getAll();
      return handleApiError(
        'getAllWallpapers',
        response,
        [] as WallpaperItem[],
      ) as WallpaperItem[];
    },
    'getAllWallpapers',
    [],
  );
};

/**
 * Search wallpapers via API (replaces direct GitHub API call)
 */
export const searchWallpapers = async (
  query: string,
  categorySlug?: string,
): Promise<WallpaperItem[]> => {
  return safeAsync(
    async () => {
      const filters: any = { search: query };
      if (categorySlug && categorySlug !== 'all') {
        filters.categoryName = categorySlug;
      }

      const response = await apiClient.wallpapers.getAll(filters);
      return handleApiError(
        'searchWallpapers',
        response,
        [] as WallpaperItem[],
      ) as WallpaperItem[];
    },
    'searchWallpapers',
    [],
  );
};

/**
 * Get paginated wallpapers via API (replaces direct GitHub API call)
 */
export const getWallpapersPaginated = async (
  page: number = 1,
  limit: number = 50,
  categorySlug?: string,
): Promise<{
  wallpapers: WallpaperItem[];
  hasMore: boolean;
  totalPages: number;
}> => {
  const fallbackValue = { wallpapers: [], hasMore: false, totalPages: 0 };

  return safeAsync(
    async () => {
      const filters: any = {
        limit,
        offset: (page - 1) * limit,
      };

      if (categorySlug && categorySlug !== 'all') {
        filters.categoryName = categorySlug;
      }

      const response = await apiClient.wallpapers.getAll(filters);

      if (!response.success) {
        handleApiError('getWallpapersPaginated', response, fallbackValue);
        return fallbackValue;
      }

      const wallpapers = (response.data as WallpaperItem[]) || [];
      const hasMore = wallpapers.length === limit;
      const totalPages = Math.ceil((response.count || 0) / limit);

      return { wallpapers, hasMore, totalPages };
    },
    'getWallpapersPaginated',
    fallbackValue,
  );
};
