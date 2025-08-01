import { Download, Check, Pause, AlertCircle, Play } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { StatusBadgeProperties } from './types.local';

// Status icon mapping
const statusIcons = {
  available: Download,
  downloading: Pause,
  completed: Check,
  failed: AlertCircle,
  paused: Play,
};

export const StatusBadge: React.FC<StatusBadgeProperties> = ({
  downloadStatus,
  downloadProgress,
}) => {
  const StatusIcon = statusIcons[downloadStatus];
  const isCompleted = downloadStatus === 'completed';

  return (
    <div className="absolute top-3 right-3">
      <Badge
        variant={isCompleted ? 'default' : 'secondary'}
        className={cn(
          'backdrop-blur-sm transition-all duration-300',
          isCompleted && 'bg-success text-success-foreground',
          downloadStatus === 'failed' &&
            'bg-destructive text-destructive-foreground',
        )}
      >
        <StatusIcon className="w-3 h-3 mr-1" />
        {downloadStatus === 'downloading'
          ? `${downloadProgress?.progress || 0}%`
          : downloadStatus.charAt(0).toUpperCase() + downloadStatus.slice(1)}
      </Badge>
    </div>
  );
};
