import React from 'react';
import { useQuery, useInfiniteQuery } from 'react-query';

// Smart wallpaper service (cache-aside pattern)
import {
  getAllWallpapers,
  searchWallpapers,
  getWallpapersPaginated,
} from '@/lib/github-api';
import {
  getCategories,
  getWallpapersByCategory,
  getFeaturedWallpapers,
} from '@/lib/wallpaper-service';

// GitHub API for fallback operations

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
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};

/**
 * Hook to fetch featured wallpapers for immediate loading
 */
export const useFeaturedWallpapers = (limit: number = 3) => {
  return useQuery({
    queryKey: wallpaperKeys.featured(),
    queryFn: () => getFeaturedWallpapers(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 45, // 45 minutes
  });
};

/**
 * Hook to fetch all wallpapers
 */
export const useAllWallpapers = () => {
  return useQuery({
    queryKey: wallpaperKeys.wallpapers(),
    queryFn: getAllWallpapers,
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
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
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
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
    queryKey: wallpaperKeys.paginated(filters),
    queryFn: ({ pageParam: pageParameter = 1 }) =>
      getWallpapersPaginated(pageParameter, limit, filters.category),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook to get a single wallpaper by ID
 */
export const useWallpaper = (wallpaperId: string) => {
  return useQuery({
    queryKey: [...wallpaperKeys.wallpapers(), 'single', wallpaperId],
    queryFn: async (): Promise<WallpaperItem | undefined> => {
      const { wallpapers } = await getAllWallpapers();
      return wallpapers.find((w) => w.id === wallpaperId);
    },
    enabled: !!wallpaperId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to get wallpapers with client-side filtering
 */
export const useFilteredWallpapers = (filters: WallpaperFilters) => {
  const { data: allData, ...queryResult } = useAllWallpapers();

  const filteredData = React.useMemo(() => {
    if (!allData) return undefined;

    let { wallpapers } = allData;

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      wallpapers = wallpapers.filter((w) => w.category === filters.category);
    }

    // Filter by aspect ratio
    if (filters.aspectRatio && filters.aspectRatio !== 'all') {
      wallpapers = wallpapers.filter(
        (w) => w.aspectRatio === filters.aspectRatio,
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      wallpapers = wallpapers.filter(
        (w) =>
          w.name.toLowerCase().includes(searchTerm) ||
          w.category.toLowerCase().includes(searchTerm),
      );
    }

    // Sort wallpapers
    if (filters.sortBy) {
      wallpapers.sort((a, b) => {
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

    return {
      ...allData,
      wallpapers,
    };
  }, [allData, filters]);

  return {
    ...queryResult,
    data: filteredData,
  };
};
