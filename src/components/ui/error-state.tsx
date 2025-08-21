import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { Button } from './button';

interface ErrorStateProperties {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'generic' | 'network' | 'not-found' | 'server';
}

const errorConfig = {
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: WifiOff,
    title: 'Connection problem',
    message: 'Please check your internet connection and try again.',
  },
  'not-found': {
    icon: AlertTriangle,
    title: 'Content not found',
    message: "The content you're looking for doesn't exist or has been moved.",
  },
  server: {
    icon: Wifi,
    title: 'Server error',
    message: 'Our servers are experiencing issues. Please try again later.',
  },
};

export const ErrorState = ({
  title,
  message,
  action,
  type = 'generic',
}: ErrorStateProperties) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex min-h-64 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <Icon className="mx-auto mb-4 h-16 w-16 text-red-500" />

        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {title || config.title}
        </h2>

        <p className="mb-6 text-gray-600">{message || config.message}</p>

        {action && (
          <Button onClick={action.onClick} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specific error components for common scenarios
export const NetworkError = ({ onRetry }: { onRetry: () => void }) => (
  <ErrorState
    type="network"
    action={{ label: 'Try Again', onClick: onRetry }}
  />
);

export const ServerError = ({ onRetry }: { onRetry: () => void }) => (
  <ErrorState type="server" action={{ label: 'Retry', onClick: onRetry }} />
);

export const NotFoundError = () => <ErrorState type="not-found" />;
