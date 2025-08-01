import React from 'react';

import { WallpaperGrid, WallpaperCard } from '@/components/wallpaper-grid';
import { useDownloads } from '@/hooks/use-downloads';

import type { WallpaperItem } from '@/types/wallpaper';

// Example wallpaper data for testing
const exampleWallpapers: WallpaperItem[] = [
  {
    id: '1',
    name: 'mountain-landscape-4k.jpg',
    path: 'landscapes/mountain-landscape-4k.jpg',
    sha: 'abc123',
    size: 2048000, // 2MB
    download_url:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
    html_url: 'https://github.com/example/repo',
    category: 'Landscapes',
    resolution: { width: 3840, height: 2160 },
    aspectRatio: 'landscape',
  },
  {
    id: '2',
    name: 'abstract-art-portrait.png',
    path: 'abstract/abstract-art-portrait.png',
    sha: 'def456',
    size: 1536000, // 1.5MB
    download_url:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500',
    html_url: 'https://github.com/example/repo',
    category: 'Abstract',
    resolution: { width: 1080, height: 1920 },
    aspectRatio: 'portrait',
  },
  {
    id: '3',
    name: 'cyberpunk-city.jpg',
    path: 'cyberpunk/cyberpunk-city.jpg',
    sha: 'ghi789',
    size: 3072000, // 3MB
    download_url:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500',
    html_url: 'https://github.com/example/repo',
    category: 'Cyberpunk',
    resolution: { width: 2560, height: 1440 },
    aspectRatio: 'landscape',
  },
];

export const GalleryPage: React.FC = () => {
  const downloads = useDownloads();

  const handleDownload = (wallpaper: WallpaperItem) => {
    downloads.startDownload(wallpaper);
  };

  const handlePreview = (wallpaper: WallpaperItem) => {
    // TODO: Implement preview modal
    console.log('Preview wallpaper:', wallpaper.name);
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
              collection. High-quality images across 40+ categories.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {exampleWallpapers.length} wallpapers</span>
            <span>Downloaded: {downloads.totalDownloaded}</span>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <main className="container mx-auto py-8">
        <WallpaperGrid layout="auto" spacing="md">
          {exampleWallpapers.map((wallpaper) => (
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
      </main>
    </div>
  );
};
