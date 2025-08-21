import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';

// Smart wallpaper service (cache-aside pattern)
import {
  getAllWallpapers,
  searchWallpapers,
  getWallpapersPaginated,
  getCategories,
  getWallpapersByCategory,
  getFeaturedWallpapers,
} from '@/lib/api/wallpaper-service';
import { cacheStrategies } from '@/lib/query/cache-config';

import type { WallpaperItem, WallpaperFilters } from '@/types/wallpaper';

// Query keys for React Query
export const wallpaperKeys = {
  all: ['wallpapers'] as const,
  categories: () => [...wallpaperKeys.all, 'categories'] as const,
  featured: () => [...wallpaperKeys.all, 'featured'] as const,
  wallpapers: () => [...wallpaperKeys.all, 'wallpapers'] as const,
  category: (slug: string) =>
    [...wallpaperKeys.wallpapers(), 'category', slug] as const,
  search: (query: string, category?: string) =>
    [...wallpaperKeys.wallpapers(), 'search', query, category] as const,
  paginated: (filters: WallpaperFilters) =>
    [...wallpaperKeys.wallpapers(), 'paginated', filters] as const,
};

/**
 * Hook to fetch all categories (lightweight version)
 */
export const useCategories = () => {
  return useQuery({
    queryKey: wallpaperKeys.categories(),
    queryFn: getCategories,
    ...cacheStrategies.categories,
  });
};

/**
 * Hook to fetch featured wallpapers for immediate loading
 */
export const useFeaturedWallpapers = (limit: number = 3) => {
  return useQuery({
    queryKey: [...wallpaperKeys.featured(), limit],
    queryFn: () => getFeaturedWallpapers(limit),
    ...cacheStrategies.featuredWallpapers,
  });
};

/**
 * Hook to fetch all wallpapers
 */
export const useAllWallpapers = () => {
  return useQuery({
    queryKey: wallpaperKeys.wallpapers(),
    queryFn: getAllWallpapers,
    ...cacheStrategies.allWallpapers,
  });
};

/**
 * Hook to fetch wallpapers by category
 */
export const useWallpapersByCategory = (
  categorySlug: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: wallpaperKeys.category(categorySlug),
    queryFn: () => getWallpapersByCategory(categorySlug),
    enabled: enabled && !!categorySlug,
    ...cacheStrategies.wallpapersByCategory,
  });
};

/**
 * Hook to search wallpapers
 */
export const useSearchWallpapers = (query: string, categorySlug?: string) => {
  return useQuery({
    queryKey: wallpaperKeys.search(query, categorySlug),
    queryFn: () => searchWallpapers(query, categorySlug),
    enabled: query.length >= 2, // Only search with 2+ characters
    ...cacheStrategies.search,
  });
};

/**
 * Hook for infinite scroll wallpapers with pagination
 */
export const useInfiniteWallpapers = (
  filters: WallpaperFilters = {},
  limit: number = 50,
) => {
  return useInfiniteQuery({
    queryKey: [...wallpaperKeys.paginated(filters), limit],
    queryFn: ({ pageParam: pageParameter = 1 }) =>
      getWallpapersPaginated(pageParameter as number, limit, filters.category),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    ...cacheStrategies.wallpapersByCategory,
  });
};

/**
 * Hook for infinite scroll within a specific category (avoids rate limits)
 */
export const useInfiniteCategoryWallpapers = (
  categorySlug: string,
  limit: number = 12,
  enabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: [...wallpaperKeys.category(categorySlug), 'infinite', limit],
    queryFn: ({ pageParam: pageParameter = 1 }) =>
      getWallpapersPaginated(pageParameter as number, limit, categorySlug),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    enabled: enabled && !!categorySlug,
    ...cacheStrategies.wallpapersByCategory,
  });
};

/**
 * Hook to get a single wallpaper by ID
 */
export const useWallpaper = (wallpaperId: string) => {
  return useQuery({
    queryKey: [...wallpaperKeys.wallpapers(), 'single', wallpaperId],
    queryFn: async (): Promise<WallpaperItem | undefined> => {
      const wallpapers = await getAllWallpapers();
      return wallpapers.find((w: WallpaperItem) => w.id === wallpaperId);
    },
    enabled: !!wallpaperId,
    ...cacheStrategies.individual,
  });
};

/**
 * Hook to get wallpapers with client-side filtering
 */
export const useFilteredWallpapers = (filters: WallpaperFilters) => {
  const { data: allData, ...queryResult } = useAllWallpapers();

  const filteredData = React.useMemo(() => {
    if (!allData) return undefined;

    let wallpapers = allData;

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      wallpapers = wallpapers.filter(
        (w: WallpaperItem) => w.category === filters.category,
      );
    }

    // Filter by aspect ratio
    if (filters.aspectRatio && filters.aspectRatio !== 'all') {
      wallpapers = wallpapers.filter(
        (w: WallpaperItem) => w.aspectRatio === filters.aspectRatio,
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      wallpapers = wallpapers.filter(
        (w: WallpaperItem) =>
          w.name.toLowerCase().includes(searchTerm) ||
          w.category.toLowerCase().includes(searchTerm),
      );
    }

    // Sort wallpapers
    if (filters.sortBy) {
      wallpapers.sort((a: WallpaperItem, b: WallpaperItem) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'recent':
            // For now, sort by ID as a proxy for recent
            comparison = a.id.localeCompare(b.id);
            break;
        }

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return wallpapers;
  }, [allData, filters]);

  return {
    ...queryResult,
    data: filteredData,
  };
};
