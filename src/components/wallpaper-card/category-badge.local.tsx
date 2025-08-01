import React from 'react';

import { Badge } from '@/components/ui/badge';

import type { CategoryBadgeProperties } from './types.local';

export const CategoryBadge: React.FC<CategoryBadgeProperties> = ({
  category,
}) => {
  return (
    <div className="absolute top-3 left-3">
      <Badge
        variant="outline"
        className="backdrop-blur-sm bg-glass text-white border-white/20"
      >
        {category}
      </Badge>
    </div>
  );
};
