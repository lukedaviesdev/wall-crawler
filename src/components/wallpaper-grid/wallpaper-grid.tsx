import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const gridVariants = cva('grid gap-4 p-4', {
  variants: {
    layout: {
      auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      masonry:
        'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6',
      compact:
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    },
    spacing: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    layout: 'auto',
    spacing: 'md',
  },
});

export interface WallpaperGridProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
}

export const WallpaperGrid = React.forwardRef<
  HTMLDivElement,
  WallpaperGridProperties
>(
  (
    {
      className,
      layout,
      spacing,
      children,
      emptyState,
      isLoading,
      ...properties
    },
    reference,
  ) => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center glass p-8 rounded-2xl">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-primary/20 rounded w-48 mb-2 mx-auto"></div>
              <div className="h-4 bg-primary/20 rounded w-32 mx-auto"></div>
            </div>
            <p className="text-muted-foreground">
              Loading amazing wallpapers...
            </p>
          </div>
        </div>
      );
    }

    // Show empty state if no children
    if (!children || (Array.isArray(children) && children.length === 0)) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          {emptyState || (
            <div className="text-center glass p-8 rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No wallpapers found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(gridVariants({ layout, spacing, className }))}
        {...properties}
      >
        {children}
      </div>
    );
  },
);

WallpaperGrid.displayName = 'WallpaperGrid';
