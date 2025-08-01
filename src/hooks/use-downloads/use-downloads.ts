import React, { useCallback, useEffect, useRef } from 'react';

import { useLocalStorage } from '@/hooks/use-local-storage/use-local-storage';

import type {
  DownloadItem,
  DownloadState,
  DownloadActions,
  DownloadProgress,
  DownloadStatus,
} from '@/types/download';
import type { WallpaperItem } from '@/types/wallpaper';

// Default download state
const DEFAULT_DOWNLOAD_STATE: DownloadState = {
  downloads: {},
  activeDownloads: {},
  queue: [],
  maxConcurrent: 3,
  totalDownloaded: 0,
  totalSize: 0,
};

// Hook interface
interface UseDownloadsReturn extends DownloadState, DownloadActions {
  isLoading: boolean;
  error: string | null;
  downloadProgress: (wallpaperId: string) => DownloadProgress | null;
}

/**
 * Hook for managing wallpaper downloads with local storage persistence
 */
export const useDownloads = (): UseDownloadsReturn => {
  const [downloadState, setDownloadState] = useLocalStorage<DownloadState>(
    'wall-crawler-downloads',
    DEFAULT_DOWNLOAD_STATE,
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Refs to manage download progress and abort controllers
  const downloadControllers = useRef<Record<string, AbortController>>({});
  const progressTimers = useRef<Record<string, NodeJS.Timeout>>({});

  /**
   * Get download status for a specific wallpaper
   */
  const getDownloadStatus = useCallback(
    (wallpaperId: string): DownloadStatus => {
      const download = downloadState.downloads[wallpaperId];
      if (!download) return 'available';
      return download.status;
    },
    [downloadState.downloads],
  );

  /**
   * Check if a wallpaper is downloaded
   */
  const isDownloaded = useCallback(
    (wallpaperId: string): boolean => {
      return getDownloadStatus(wallpaperId) === 'completed';
    },
    [getDownloadStatus],
  );

  /**
   * Get download progress for a specific wallpaper
   */
  const downloadProgress = useCallback(
    (wallpaperId: string): DownloadProgress | null => {
      return downloadState.activeDownloads[wallpaperId] || null;
    },
    [downloadState.activeDownloads],
  );

  /**
   * Update download state helper
   */
  const updateDownloadState = useCallback(
    (updater: (previous: DownloadState) => DownloadState) => {
      setDownloadState(updater);
    },
    [setDownloadState],
  );

  /**
   * Start downloading a wallpaper
   */
  const startDownload = useCallback(
    async (wallpaper: WallpaperItem): Promise<void> => {
      const { id: wallpaperId, download_url, name, size, category } = wallpaper;

      try {
        setError(null);
        setIsLoading(true);

        // Check if already downloaded or downloading
        const currentStatus = getDownloadStatus(wallpaperId);
        if (currentStatus === 'completed' || currentStatus === 'downloading') {
          return;
        }

        // Create download item
        const downloadItem: DownloadItem = {
          id: `download-${wallpaperId}-${Date.now()}`,
          wallpaperId,
          fileName: name,
          url: download_url,
          downloadedAt: new Date().toISOString(),
          size,
          category,
          status: 'downloading',
        };

        // Add to downloads and active downloads
        updateDownloadState((previous) => ({
          ...previous,
          downloads: {
            ...previous.downloads,
            [wallpaperId]: downloadItem,
          },
          activeDownloads: {
            ...previous.activeDownloads,
            [wallpaperId]: {
              wallpaperId,
              progress: 0,
              loaded: 0,
              total: size,
              speed: 0,
            },
          },
        }));

        // Create abort controller for this download
        const controller = new AbortController();
        downloadControllers.current[wallpaperId] = controller;

        // Start the actual download
        await performDownload(wallpaperId, download_url, controller.signal);
      } catch (error_) {
        console.error('Download failed:', error_);
        setError(error_ instanceof Error ? error_.message : 'Download failed');

        // Mark download as failed
        updateDownloadState((previous) => ({
          ...previous,
          downloads: {
            ...previous.downloads,
            [wallpaperId]: {
              ...previous.downloads[wallpaperId],
              status: 'failed',
            },
          },
        }));
      } finally {
        setIsLoading(false);
        // Clean up
        delete downloadControllers.current[wallpaperId];
        if (progressTimers.current[wallpaperId]) {
          clearInterval(progressTimers.current[wallpaperId]);
          delete progressTimers.current[wallpaperId];
        }
      }
    },
    [getDownloadStatus, updateDownloadState],
  );

  /**
   * Perform the actual download with progress tracking
   */
  const performDownload = async (
    wallpaperId: string,
    url: string,
    signal: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    let lastTime = Date.now();

    // Progress tracking
    const updateProgress = (loaded: number, speed: number) => {
      const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

      updateDownloadState((previous) => ({
        ...previous,
        activeDownloads: {
          ...previous.activeDownloads,
          [wallpaperId]: {
            wallpaperId,
            progress,
            loaded,
            total,
            speed,
          },
        },
      }));
    };

    try {
      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();

        if (done) {
          reading = false;
          break;
        }

        chunks.push(value);
        loaded += value.length;

        // Calculate download speed
        const now = Date.now();
        const timeDiff = now - lastTime;
        if (timeDiff >= 1000) {
          // Update every second
          const speed = loaded / (timeDiff / 1000);
          updateProgress(loaded, speed);
          lastTime = now;
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const downloadUrl = URL.createObjectURL(blob);

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadState.downloads[wallpaperId].fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(downloadUrl);

      // Mark as completed
      updateDownloadState((previous) => ({
        ...previous,
        downloads: {
          ...previous.downloads,
          [wallpaperId]: {
            ...previous.downloads[wallpaperId],
            status: 'completed',
          },
        },
        activeDownloads: {
          ...previous.activeDownloads,
          [wallpaperId]: {
            ...previous.activeDownloads[wallpaperId],
            progress: 100,
          },
        },
        totalDownloaded: previous.totalDownloaded + 1,
        totalSize: previous.totalSize + total,
      }));

      // Remove from active downloads after a delay
      setTimeout(() => {
        updateDownloadState((previous) => {
          const { [wallpaperId]: _removed, ...activeDownloads } =
            previous.activeDownloads;
          return {
            ...previous,
            activeDownloads,
          };
        });
      }, 3000);
    } catch (error_) {
      if (signal.aborted) {
        // Download was cancelled
        updateDownloadState((previous) => ({
          ...previous,
          downloads: {
            ...previous.downloads,
            [wallpaperId]: {
              ...previous.downloads[wallpaperId],
              status: 'paused',
            },
          },
        }));
      }
      throw error_;
    }
  };

  /**
   * Pause/cancel an active download
   */
  const pauseDownload = useCallback((wallpaperId: string): void => {
    const controller = downloadControllers.current[wallpaperId];
    if (controller) {
      controller.abort();
    }
  }, []);

  /**
   * Cancel a download completely
   */
  const cancelDownload = useCallback(
    (wallpaperId: string): void => {
      pauseDownload(wallpaperId);

      updateDownloadState((previous) => {
        const { [wallpaperId]: _removedDownload, ...downloads } =
          previous.downloads;
        const { [wallpaperId]: _removedActive, ...activeDownloads } =
          previous.activeDownloads;

        return {
          ...previous,
          downloads,
          activeDownloads,
          queue: previous.queue.filter((id) => id !== wallpaperId),
        };
      });
    },
    [pauseDownload, updateDownloadState],
  );

  /**
   * Remove a completed/failed download from history
   */
  const removeDownload = useCallback(
    (wallpaperId: string): void => {
      updateDownloadState((previous) => {
        const { [wallpaperId]: _removed, ...downloads } = previous.downloads;
        return {
          ...previous,
          downloads,
        };
      });
    },
    [updateDownloadState],
  );

  /**
   * Clear all downloads
   */
  const clearAllDownloads = useCallback((): void => {
    // Cancel all active downloads
    Object.keys(downloadControllers.current).forEach((wallpaperId) => {
      pauseDownload(wallpaperId);
    });

    setDownloadState(DEFAULT_DOWNLOAD_STATE);
  }, [pauseDownload, setDownloadState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(downloadControllers.current).forEach((controller) => {
        controller.abort();
      });
      Object.values(progressTimers.current).forEach((timer) => {
        clearInterval(timer);
      });
    };
  }, []);

  return {
    // State
    ...downloadState,
    isLoading,
    error,

    // Actions
    startDownload,
    pauseDownload,
    cancelDownload,
    removeDownload,
    clearAllDownloads,
    getDownloadStatus,
    isDownloaded,
    downloadProgress,
  };
};
