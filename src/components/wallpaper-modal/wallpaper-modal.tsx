import { Download, ExternalLink, Info } from 'lucide-react';
import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { WallpaperItem } from '@/types/wallpaper';

interface WallpaperModalProperties {
  wallpaper: WallpaperItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (wallpaper: WallpaperItem) => void;
}

export const WallpaperModal: React.FC<WallpaperModalProperties> = ({
  wallpaper,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!wallpaper) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(wallpaper);
    } else {
      window.open(wallpaper.download_url, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold truncate">
            {wallpaper.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {wallpaper.category}
            {wallpaper.resolution && (
              <span>
                {' '}
                • {wallpaper.resolution.width}×{wallpaper.resolution.height}
              </span>
            )}
            <span> • {formatFileSize(wallpaper.size)}</span>
          </p>
        </DialogHeader>

        {/* Image */}
        <div className="relative max-h-[70vh] overflow-hidden bg-muted/20">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-neon/30 border-t-neon animate-spin rounded-full" />
            </div>
          )}

          {imageError ? (
            <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
              <div className="text-center">
                <Info size={48} className="mx-auto mb-2 opacity-50" />
                <p>Failed to load image</p>
                <p className="text-sm">Try downloading directly</p>
              </div>
            </div>
          ) : (
            <img
              src={wallpaper.download_url}
              alt={wallpaper.name}
              className={`w-full h-auto max-w-full transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {wallpaper.aspectRatio && (
              <span className="px-2 py-1 bg-muted rounded text-xs">
                {wallpaper.aspectRatio}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(wallpaper.html_url, '_blank')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              <ExternalLink size={14} />
              View on GitHub
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neon/10 text-neon hover:bg-neon/20 border border-neon/30 rounded transition-colors"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
