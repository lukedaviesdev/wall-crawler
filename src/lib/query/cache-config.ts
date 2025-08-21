// Centralized cache configuration for React Query

export const cacheConfig = {
  // Long-term cache for static/rarely changing data
  longTerm: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  },

  // Medium-term cache for semi-dynamic data
  mediumTerm: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },

  // Short-term cache for dynamic data
  shortTerm: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },

  // Search/user-input cache - shorter TTL
  userInput: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  },

  // Analytics/stats cache
  analytics: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },

  // Global query options for performance
  defaults: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
    },
  },
} as const;

// Specific cache strategies for different data types
export const cacheStrategies = {
  categories: cacheConfig.longTerm, // Categories rarely change
  featuredWallpapers: cacheConfig.mediumTerm, // Featured selection may change
  wallpapersByCategory: cacheConfig.mediumTerm, // Category content semi-stable
  allWallpapers: cacheConfig.shortTerm, // Full catalog may change frequently
  search: cacheConfig.userInput, // User search results
  analytics: cacheConfig.analytics, // Stats and metrics
  individual: cacheConfig.mediumTerm, // Single wallpaper data
} as const;
