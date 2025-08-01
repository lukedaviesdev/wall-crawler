import type { WallpaperItem } from './wallpaper';

export interface DownloadItem {
  id: string;
  wallpaperId: string;
  fileName: string;
  url: string;
  downloadedAt: string;
  size: number;
  category: string;
  status: DownloadStatus;
}

export type DownloadStatus =
  | 'available' // Not downloaded yet
  | 'downloading' // Currently downloading
  | 'completed' // Successfully downloaded
  | 'failed' // Download failed
  | 'paused'; // Download paused

export interface DownloadProgress {
  wallpaperId: string;
  progress: number; // 0-100
  loaded: number; // bytes loaded
  total: number; // total bytes
  speed: number; // bytes per second
}

export interface DownloadState {
  downloads: Record<string, DownloadItem>;
  activeDownloads: Record<string, DownloadProgress>;
  queue: string[]; // wallpaper IDs in queue
  maxConcurrent: number;
  totalDownloaded: number;
  totalSize: number;
}

export interface DownloadActions {
  startDownload: (wallpaper: WallpaperItem) => Promise<void>;
  pauseDownload: (wallpaperId: string) => void;
  cancelDownload: (wallpaperId: string) => void;
  removeDownload: (wallpaperId: string) => void;
  clearAllDownloads: () => void;
  getDownloadStatus: (wallpaperId: string) => DownloadStatus;
  isDownloaded: (wallpaperId: string) => boolean;
}
