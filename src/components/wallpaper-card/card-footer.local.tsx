import React from 'react';

import { formatBytes } from '@/hooks/use-downloads';

import type { CardFooterProperties } from './types.local';

export const CardFooter: React.FC<CardFooterProperties> = ({
  wallpaper,
  showDetails,
}) => {
  if (!showDetails) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-sm">
      <div className="text-white">
        <h3 className="font-semibold text-sm truncate mb-1">
          {wallpaper.name.replace(/\.[^/.]+$/, '')}
        </h3>

        <div className="flex items-center justify-between text-xs text-white/80">
          <span>
            {wallpaper.resolution
              ? `${wallpaper.resolution.width}×${wallpaper.resolution.height}`
              : 'Resolution unknown'}
          </span>
          <span>{formatBytes(wallpaper.size)}</span>
        </div>
      </div>
    </div>
  );
};
