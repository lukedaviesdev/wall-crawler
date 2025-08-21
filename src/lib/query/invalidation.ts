// Query invalidation utilities for cache management
import { useQueryClient } from '@tanstack/react-query';

import { wallpaperKeys } from '@/hooks/use-wallpapers/use-wallpapers';

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  return {
    // Invalidate all wallpaper-related queries
    invalidateAllWallpapers: () => {
      queryClient.invalidateQueries({ queryKey: wallpaperKeys.all });
    },

    // Invalidate specific category
    invalidateCategory: (categorySlug: string) => {
      queryClient.invalidateQueries({
        queryKey: wallpaperKeys.category(categorySlug),
      });
    },

    // Invalidate categories list
    invalidateCategories: () => {
      queryClient.invalidateQueries({ queryKey: wallpaperKeys.categories() });
    },

    // Invalidate featured wallpapers
    invalidateFeatured: () => {
      queryClient.invalidateQueries({ queryKey: wallpaperKeys.featured() });
    },

    // Invalidate search results
    invalidateSearch: () => {
      queryClient.invalidateQueries({
        queryKey: [...wallpaperKeys.wallpapers(), 'search'],
        exact: false,
      });
    },

    // Clear all paginated queries
    clearPaginatedQueries: () => {
      queryClient.removeQueries({
        queryKey: [...wallpaperKeys.wallpapers(), 'paginated'],
        exact: false,
      });
    },

    // Prefetch common queries for performance
    prefetchCategories: () => {
      return queryClient.prefetchQuery({
        queryKey: wallpaperKeys.categories(),
        staleTime: 1000 * 60 * 30,
      });
    },

    prefetchFeaturedWallpapers: (limit: number = 3) => {
      return queryClient.prefetchQuery({
        queryKey: [...wallpaperKeys.featured(), limit],
        staleTime: 1000 * 60 * 15,
      });
    },
  };
};
