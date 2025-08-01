import type { DownloadStatus, DownloadProgress } from '@/types/download';
import type { WallpaperItem } from '@/types/wallpaper';

// Shared props for sub-components
export interface BaseCardProperties {
  wallpaper: WallpaperItem;
  downloadStatus: DownloadStatus;
  downloadProgress?: DownloadProgress | null;
}

// Image container props
export interface ImageContainerProperties extends BaseCardProperties {
  showHoverActions: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  imageLoaded: boolean;
  imageError: boolean;
}

// Progress overlay props
export interface ProgressOverlayProperties {
  downloadProgress: DownloadProgress;
  isVisible: boolean;
}

// Status badge props
export interface StatusBadgeProperties {
  downloadStatus: DownloadStatus;
  downloadProgress?: DownloadProgress | null;
}

// Category badge props
export interface CategoryBadgeProperties {
  category: string;
}

// Hover actions props
export interface HoverActionsProperties extends BaseCardProperties {
  isVisible: boolean;
  canDownload: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onPreview?: () => void;
}

// Card footer props
export interface CardFooterProperties {
  wallpaper: WallpaperItem;
  showDetails: boolean;
}
