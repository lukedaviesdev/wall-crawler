import React from 'react';

import { WallpaperGrid, WallpaperCard } from '@/components/wallpaper-grid';
import { useDownloads } from '@/hooks/use-downloads';
import {
  useCategories,
  useFeaturedWallpapers,
  useWallpapersByCategory,
} from '@/hooks/use-wallpapers';

import type { WallpaperItem } from '@/types/wallpaper';

export const GalleryPage: React.FC = () => {
  const downloads = useDownloads();

  // Fetch featured wallpapers immediately for better UX
  const featuredQuery = useFeaturedWallpapers(3);

  // Fetch categories (lightweight)
  const categoriesQuery = useCategories();

  // For demo: also fetch wallpapers from first category
  const firstCategory = categoriesQuery.data?.[0];
  const wallpapersQuery = useWallpapersByCategory(
    firstCategory?.slug || '',
    !!firstCategory,
  );

  // Use featured wallpapers if available, otherwise use category wallpapers
  const wallpapers = featuredQuery.data || wallpapersQuery.data || [];
  const isLoading =
    featuredQuery.isLoading ||
    (!featuredQuery.data && wallpapersQuery.isLoading);

  const handleDownload = (wallpaper: WallpaperItem) => {
    downloads.startDownload(wallpaper);
  };

  const handlePreview = (wallpaper: WallpaperItem) => {
    // TODO: Implement preview modal
    console.log('Preview wallpaper:', wallpaper.name);
  };

  // Loading state
  if (isLoading && !wallpapers.length) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            Loading featured wallpapers...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (categoriesQuery.error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-2">Failed to load categories</p>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  const totalCategories = categoriesQuery.data?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-neon via-accent to-primary bg-clip-text text-transparent">
              Wall Crawler
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and download stunning wallpapers from the dharmx/walls
              collection. High-quality images across {totalCategories}{' '}
              categories.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {isLoading && !wallpapers.length
                ? 'Loading wallpapers...'
                : featuredQuery.data
                  ? `Showing ${wallpapers.length} featured wallpapers from popular categories`
                  : `Showing ${wallpapers.length} wallpapers from "${firstCategory?.name || 'Unknown'}" category`}
            </span>
            <span>Downloaded: {downloads.totalDownloaded}</span>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <main className="container mx-auto py-8">
        {isLoading && !wallpapers.length ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading{' '}
              {featuredQuery.isLoading ? 'featured' : firstCategory?.name}{' '}
              wallpapers...
            </p>
          </div>
        ) : wallpapers.length > 0 ? (
          <WallpaperGrid layout="auto" spacing="md">
            {wallpapers.map((wallpaper) => (
              <WallpaperCard
                key={wallpaper.id}
                wallpaper={wallpaper}
                downloadStatus={downloads.getDownloadStatus(wallpaper.id)}
                downloadProgress={downloads.downloadProgress(wallpaper.id)}
                onDownload={handleDownload}
                onPause={downloads.pauseDownload}
                onCancel={downloads.cancelDownload}
                onPreview={handlePreview}
                size="md"
              />
            ))}
          </WallpaperGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No wallpapers found</p>
          </div>
        )}
      </main>
    </div>
  );
};
