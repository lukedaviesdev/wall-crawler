export interface WallpaperItem {
  id: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string;
  html_url: string;
  category: string;
  resolution?: {
    width: number;
    height: number;
  };
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  dominantColor?: string;
}

export interface WallpaperCategory {
  name: string;
  slug: string;
  path: string;
  count: number;
  thumbnail?: string;
  description?: string;
}

export interface WallpaperCollection {
  categories: WallpaperCategory[];
  wallpapers: WallpaperItem[];
  totalCount: number;
}

export interface WallpaperFilters {
  category?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'all';
  search?: string;
  sortBy?: 'name' | 'size' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}
