import {
  Download,
  Check,
  Pause,
  X,
  AlertCircle,
  Play,
  Eye,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { HoverActionsProperties } from './types.local';

// Status icon mapping
const statusIcons = {
  available: Download,
  downloading: Pause,
  completed: Check,
  failed: AlertCircle,
  paused: Play,
};

// Status colors
const statusColors = {
  available: 'bg-primary hover:bg-primary/90',
  downloading: 'bg-accent hover:bg-accent/90',
  completed: 'bg-success hover:bg-success/90',
  failed: 'bg-destructive hover:bg-destructive/90',
  paused: 'bg-warning hover:bg-warning/90',
};

export const HoverActions: React.FC<HoverActionsProperties> = ({
  downloadStatus,
  isVisible,
  canDownload: _canDownload,
  isDownloading,
  onDownload,
  onPause: _onPause,
  onCancel,
  onPreview,
}) => {
  const StatusIcon = statusIcons[downloadStatus];

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPreview?.();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel?.();
  };

  return (
    <div
      className={cn(
        'absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {/* Preview Button */}
      <Button
        size="icon"
        variant="secondary"
        className="backdrop-blur-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
        onClick={handlePreview}
      >
        <Eye className="w-4 h-4" />
      </Button>

      {/* Download/Pause Button */}
      <Button
        size="icon"
        className={cn('backdrop-blur-sm', statusColors[downloadStatus])}
        onClick={handleDownload}
        disabled={downloadStatus === 'completed'}
      >
        <StatusIcon className="w-4 h-4" />
      </Button>

      {/* Cancel Button (only when downloading) */}
      {isDownloading && onCancel && (
        <Button
          size="icon"
          variant="destructive"
          className="backdrop-blur-sm bg-destructive/80 hover:bg-destructive"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
