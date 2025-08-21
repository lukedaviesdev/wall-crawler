import React from 'react';

import { useCategories, useFeaturedWallpapers } from '@/hooks/use-wallpapers';

export const GalleryDebugPage: React.FC = () => {
  // Fetch featured wallpapers
  const featuredQuery = useFeaturedWallpapers(3);

  // Fetch categories
  const categoriesQuery = useCategories();

  console.log('Debug Data:', {
    featuredWallpapers: {
      data: featuredQuery.data,
      isLoading: featuredQuery.isLoading,
      error: featuredQuery.error,
    },
    categories: {
      data: categoriesQuery.data,
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error,
    },
  });

  if (featuredQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading...</div>
          <div className="text-muted-foreground">
            Featured: {featuredQuery.isLoading ? 'Loading...' : 'Ready'}
            <br />
            Categories: {categoriesQuery.isLoading ? 'Loading...' : 'Ready'}
          </div>
        </div>
      </div>
    );
  }

  if (featuredQuery.error || categoriesQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-500">Error</div>
          <div className="text-muted-foreground">
            Featured Error: {featuredQuery.error?.message || 'None'}
            <br />
            Categories Error: {categoriesQuery.error?.message || 'None'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Wall Crawler - Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Categories ({categoriesQuery.data?.length || 0})
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categoriesQuery.data?.slice(0, 10).map((category) => (
              <div key={category.id} className="p-2 bg-muted rounded">
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-muted-foreground">
                  {category.slug} • {category.wallpaper_count || 0} wallpapers
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Wallpapers Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Featured Wallpapers ({featuredQuery.data?.length || 0})
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {featuredQuery.data?.map((wallpaper) => (
              <div key={wallpaper.id} className="p-2 bg-muted rounded">
                <div className="font-medium truncate">{wallpaper.name}</div>
                <div className="text-sm text-muted-foreground">
                  {wallpaper.category} • {Math.round(wallpaper.size / 1024)}KB
                </div>
                <div className="text-xs text-blue-600 hover:underline">
                  <a
                    href={wallpaper.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Raw API Data</h2>
        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
          {JSON.stringify(
            {
              categories: categoriesQuery.data,
              wallpapers: featuredQuery.data,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
};
