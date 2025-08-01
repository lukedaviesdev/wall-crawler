import { cva, type VariantProps } from 'class-variance-authority';
import React, { useState, useCallback } from 'react';

import { cn } from '@/lib/utils';

import { CardFooter } from './card-footer.local';
import { CategoryBadge } from './category-badge.local';
import { HoverActions } from './hover-actions.local';
import { ImageContainer } from './image-container.local';
import { ProgressOverlay } from './progress-overlay.local';
import { StatusBadge } from './status-badge.local';

import type { DownloadStatus, DownloadProgress } from '@/types/download';
import type { WallpaperItem } from '@/types/wallpaper';

// Local sub-components

// Card variants using CVA
const cardVariants = cva(
  'group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer',
  {
    variants: {
      size: {
        sm: 'h-48',
        md: 'h-64',
        lg: 'h-80',
        xl: 'h-96',
      },
      status: {
        available: 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-neon/20',
        downloading: 'ring-2 ring-accent animate-pulse',
        completed: 'ring-2 ring-success ring-opacity-50',
        failed: 'ring-2 ring-destructive ring-opacity-50',
        paused: 'ring-2 ring-warning ring-opacity-50',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'available',
    },
  },
);

export interface WallpaperCardProperties
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onPause'>,
    VariantProps<typeof cardVariants> {
  wallpaper: WallpaperItem;
  downloadStatus: DownloadStatus;
  downloadProgress?: DownloadProgress | null;
  onDownload: (wallpaper: WallpaperItem) => void;
  onPause?: (wallpaperId: string) => void;
  onCancel?: (wallpaperId: string) => void;
  onPreview?: (wallpaper: WallpaperItem) => void;
  showDetails?: boolean;
}

export const WallpaperCard = React.memo<WallpaperCardProperties>(
  ({
    className,
    wallpaper,
    downloadStatus,
    downloadProgress,
    onDownload,
    onPause,
    onCancel,
    onPreview,
    showDetails = true,
    size,
    ...properties
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showHoverActions, setShowHoverActions] = useState(false);

    const isDownloading = downloadStatus === 'downloading';
    const canDownload =
      downloadStatus === 'available' || downloadStatus === 'failed';

    // Handle download action
    const handleDownload = useCallback(() => {
      if (canDownload) {
        onDownload(wallpaper);
      } else if (isDownloading && onPause) {
        onPause(wallpaper.id);
      }
    }, [canDownload, isDownloading, onDownload, onPause, wallpaper]);

    // Handle preview
    const handlePreview = useCallback(() => {
      onPreview?.(wallpaper);
    }, [onPreview, wallpaper]);

    // Handle cancel download
    const handleCancel = useCallback(() => {
      onCancel?.(wallpaper.id);
    }, [onCancel, wallpaper.id]);

    // Handle pause download
    const handlePause = useCallback(() => {
      onPause?.(wallpaper.id);
    }, [onPause, wallpaper.id]);

    return (
      <div
        className={cn(
          cardVariants({ size, status: downloadStatus, className }),
        )}
        onMouseEnter={() => setShowHoverActions(true)}
        onMouseLeave={() => setShowHoverActions(false)}
        role="button"
        tabIndex={0}
        aria-label={`Wallpaper: ${wallpaper.name} - ${downloadStatus}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (canDownload) {
              onDownload(wallpaper);
            }
          }
        }}
        {...properties}
      >
        {/* Image Container */}
        <ImageContainer
          wallpaper={wallpaper}
          downloadStatus={downloadStatus}
          downloadProgress={downloadProgress}
          showHoverActions={showHoverActions}
          onImageLoad={() => setImageLoaded(true)}
          onImageError={() => setImageError(true)}
          imageLoaded={imageLoaded}
          imageError={imageError}
        />

        {/* Download Progress Overlay */}
        {isDownloading && downloadProgress && (
          <ProgressOverlay
            downloadProgress={downloadProgress}
            isVisible={true}
          />
        )}

        {/* Status Badge */}
        <StatusBadge
          downloadStatus={downloadStatus}
          downloadProgress={downloadProgress}
        />

        {/* Category Badge */}
        <CategoryBadge category={wallpaper.category} />

        {/* Hover Actions */}
        <HoverActions
          wallpaper={wallpaper}
          downloadStatus={downloadStatus}
          downloadProgress={downloadProgress}
          isVisible={showHoverActions}
          canDownload={canDownload}
          isDownloading={isDownloading}
          onDownload={handleDownload}
          onPause={handlePause}
          onCancel={handleCancel}
          onPreview={handlePreview}
        />

        {/* Card Footer */}
        <CardFooter wallpaper={wallpaper} showDetails={showDetails} />
      </div>
    );
  },
);

WallpaperCard.displayName = 'WallpaperCard';
