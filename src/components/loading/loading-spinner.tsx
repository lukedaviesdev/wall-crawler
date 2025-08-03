import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-b-2', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    },
    variant: {
      default: 'border-neon',
      accent: 'border-accent',
      muted: 'border-muted-foreground',
      primary: 'border-primary',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface LoadingSpinnerProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProperties> = ({
  size,
  variant,
  label,
  className,
  ...properties
}) => {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      {...properties}
    >
      <div
        className={cn(spinnerVariants({ size, variant }))}
        role="status"
        aria-label={label || 'Loading'}
      />
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  );
};
