import React from 'react';

import { cn } from '@/lib/utils';

interface WallpaperCardSkeletonProperties {
  className?: string;
}

export const WallpaperCardSkeleton: React.FC<
  WallpaperCardSkeletonProperties
> = ({ className }) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg bg-muted/20',
        className,
      )}
    >
      {/* Image skeleton */}
      <div className="aspect-[3/4] bg-gradient-to-br from-muted/40 to-muted/60 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Footer skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-sm">
        <div className="space-y-2">
          {/* Title skeleton */}
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          {/* Details skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-3 bg-muted animate-pulse rounded w-16" />
            <div className="h-3 bg-muted animate-pulse rounded w-12" />
          </div>
        </div>
      </div>

      {/* Category badge skeleton */}
      <div className="absolute top-2 left-2">
        <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
      </div>
    </div>
  );
};

interface WallpaperGridSkeletonProperties {
  count?: number;
  className?: string;
}

export const WallpaperGridSkeleton: React.FC<
  WallpaperGridSkeletonProperties
> = ({ count = 12, className }) => {
  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <WallpaperCardSkeleton key={index} />
      ))}
    </div>
  );
};

interface LoadingStateProperties {
  message?: string;
  submessage?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProperties> = ({
  message = 'Loading wallpapers...',
  submessage,
  showSkeleton = true,
  skeletonCount = 12,
  className,
}) => {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Loading message */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon" />
          <div>
            <p className="text-sm font-medium">{message}</p>
            {submessage && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {submessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Skeleton grid */}
      {showSkeleton && <WallpaperGridSkeleton count={skeletonCount} />}
    </div>
  );
};
