import React from 'react';

import {
  formatBytes,
  formatSpeed,
  formatTimeRemaining,
} from '@/hooks/use-downloads';

import type { ProgressOverlayProperties } from './types.local';

export const ProgressOverlay: React.FC<ProgressOverlayProperties> = ({
  downloadProgress,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 relative mb-3">
          {/* Progress Ring */}
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - downloadProgress.progress / 100)}`}
              className="text-accent transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">
              {downloadProgress.progress}%
            </span>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div>
            {formatBytes(downloadProgress.loaded)} /{' '}
            {formatBytes(downloadProgress.total)}
          </div>
          <div>{formatSpeed(downloadProgress.speed)}</div>
          <div>
            ETA:{' '}
            {formatTimeRemaining(
              downloadProgress.loaded,
              downloadProgress.total,
              downloadProgress.speed,
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
