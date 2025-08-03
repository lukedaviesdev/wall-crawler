import React, { useState } from 'react';

import {
  LoadingState,
  DataFetchStatus,
  SyncStatusIndicator,
} from '@/components/loading';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch featured wallpapers immediately for better UX (reduced to avoid rate limits)
  const featuredQuery = useFeaturedWallpapers(3);

  // Fetch categories (lightweight)
  const categoriesQuery = useCategories();

  // Fetch wallpapers from selected category (if any)
  const categoryWallpapersQuery = useWallpapersByCategory(
    selectedCategory || '',
    !!selectedCategory,
  );

  // Determine what wallpapers to show
  const wallpapers = selectedCategory
    ? categoryWallpapersQuery.data || []
    : featuredQuery.data || [];

  const isInitialLoading = featuredQuery.isLoading && !featuredQuery.data;
  const isCategoryLoading =
    categoryWallpapersQuery.isLoading && !!selectedCategory;
  const hasError =
    featuredQuery.error ||
    categoriesQuery.error ||
    categoryWallpapersQuery.error;

  const handleDownload = (wallpaper: WallpaperItem) => {
    downloads.startDownload(wallpaper);
  };

  const handlePreview = (wallpaper: WallpaperItem) => {
    // TODO: Implement preview modal
    console.log('Preview wallpaper:', wallpaper.name);
  };

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
  };

  const getLoadingMessage = () => {
    if (isInitialLoading) return 'Loading featured wallpapers...';
    if (isCategoryLoading) return `Loading ${selectedCategory} wallpapers...`;
    return 'Loading wallpapers...';
  };

  const getLoadingSubmessage = () => {
    if (isInitialLoading) return 'Fetching popular wallpapers from cache';
    if (isCategoryLoading) return 'Checking database and syncing if needed';
    return undefined;
  };

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
              collection. High-quality images across{' '}
              {categoriesQuery.data?.length || 'many'} categories.
            </p>
          </div>

          {/* Category Navigation */}
          {categoriesQuery.data && (
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  !selectedCategory
                    ? 'bg-neon/20 text-neon border border-neon/30'
                    : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                }`}
              >
                Featured
              </button>
              {categoriesQuery.data.slice(0, 8).map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategorySelect(category.slug)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedCategory === category.slug
                      ? 'bg-neon/20 text-neon border border-neon/30'
                      : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {selectedCategory
                  ? `${wallpapers.length} wallpapers in "${selectedCategory}"`
                  : `${wallpapers.length} featured wallpapers`}
              </span>

              {/* Sync Status */}
              {(isCategoryLoading || isInitialLoading) && (
                <SyncStatusIndicator
                  status="syncing"
                  message={
                    isCategoryLoading ? 'Syncing category' : 'Loading featured'
                  }
                  compact
                />
              )}
            </div>

            <span>Downloaded: {downloads.totalDownloaded}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        {/* Error State */}
        <DataFetchStatus
          isLoading={false}
          isError={!!hasError}
          isEmpty={false}
          error={hasError as Error | null}
          errorMessage="Failed to load wallpapers. Please try again later."
        />

        {/* Initial Loading State */}
        {isInitialLoading && (
          <LoadingState
            message={getLoadingMessage()}
            submessage={getLoadingSubmessage()}
            showSkeleton={true}
            skeletonCount={6}
          />
        )}

        {/* Category Loading State */}
        {isCategoryLoading && (
          <LoadingState
            message={getLoadingMessage()}
            submessage={getLoadingSubmessage()}
            showSkeleton={true}
            skeletonCount={8}
          />
        )}

        {/* Content */}
        {!isInitialLoading && !isCategoryLoading && !hasError && (
          <>
            {wallpapers.length > 0 ? (
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
              <DataFetchStatus
                isLoading={false}
                isError={false}
                isEmpty={true}
                emptyMessage={
                  selectedCategory
                    ? `No wallpapers found in "${selectedCategory}" category`
                    : 'No featured wallpapers available'
                }
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
