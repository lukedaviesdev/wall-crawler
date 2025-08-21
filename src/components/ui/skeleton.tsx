import { cn } from '@/lib/utils';

interface SkeletonProperties {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProperties) => {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
};

// Specific skeleton components for common use cases
export const WallpaperSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-video w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const WallpaperGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <WallpaperSkeleton key={index} />
    ))}
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex items-center space-x-2">
    <Skeleton className="h-8 w-24" />
  </div>
);

export const CategoryListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: count }).map((_, index) => (
      <CategorySkeleton key={index} />
    ))}
  </div>
);
