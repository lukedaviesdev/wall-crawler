import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SyncStatus =
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'completed'
  | 'failed';

interface SyncStatusIndicatorProperties {
  status: SyncStatus;
  message?: string;
  className?: string;
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProperties> = ({
  status,
  message,
  className,
  compact = false,
}) => {
  const getStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case 'idle':
        return {
          icon: Clock,
          color: 'bg-muted text-muted-foreground',
          label: 'Ready',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          label: 'Pending',
        };
      case 'syncing':
        return {
          icon: Loader2,
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          label: 'Syncing',
          animate: true,
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-500/10 text-green-500 border-green-500/20',
          label: 'Completed',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
          label: 'Failed',
        };
      default:
        return {
          icon: Clock,
          color: 'bg-muted text-muted-foreground',
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Icon
          className={cn(
            'h-3 w-3',
            config.animate && 'animate-spin',
            status === 'completed' && 'text-green-500',
            status === 'failed' && 'text-red-500',
            status === 'syncing' && 'text-blue-500',
            status === 'pending' && 'text-yellow-500',
          )}
        />
        {message && (
          <span className="text-xs text-muted-foreground">{message}</span>
        )}
      </div>
    );
  }

  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      <Icon className={cn('h-3 w-3 mr-1', config.animate && 'animate-spin')} />
      {message || config.label}
    </Badge>
  );
};

interface DataFetchStatusProperties {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error?: Error | null;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  className?: string;
}

export const DataFetchStatus: React.FC<DataFetchStatusProperties> = ({
  isLoading,
  isError,
  isEmpty,
  error,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data found',
  errorMessage,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 mx-auto text-red-500" />
          <p className="text-sm text-red-500">
            {errorMessage || error?.message || 'Failed to load data'}
          </p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center space-y-2">
          <div className="h-6 w-6 mx-auto rounded-full bg-muted flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return null;
};

interface ProgressIndicatorProperties {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProperties> = ({
  current,
  total,
  label,
  className,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>
            {current}/{total} ({percentage}%)
          </span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-neon h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
