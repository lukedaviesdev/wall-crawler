import { AlertCircle } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { ImageContainerProperties } from './types.local';

export const ImageContainer: React.FC<ImageContainerProperties> = ({
  wallpaper,
  showHoverActions,
  onImageLoad,
  onImageError,
  imageLoaded,
  imageError,
}) => {
  // Get aspect ratio class
  const getAspectRatioClass = () => {
    if (!wallpaper.aspectRatio) return 'aspect-[3/4]';

    switch (wallpaper.aspectRatio) {
      case 'landscape':
        return 'aspect-[16/9]';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'square':
        return 'aspect-square';
      default:
        return 'aspect-[3/4]';
    }
  };

  return (
    <div className={cn('relative w-full bg-muted', getAspectRatioClass())}>
      {/* Loading State */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-glass backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-glass backdrop-blur-sm text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Failed to load</span>
        </div>
      )}

      {/* Main Image */}
      {!imageError && (
        <img
          src={wallpaper.download_url}
          alt={wallpaper.name}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            showHoverActions && 'scale-110',
          )}
          onLoad={onImageLoad}
          onError={onImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};
