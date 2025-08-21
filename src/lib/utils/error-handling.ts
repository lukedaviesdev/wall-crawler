// Consistent error handling utilities for API services

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standard error logger for API services
 */
export const logError = (
  context: string,
  error: string | Error | unknown,
  details?: unknown,
): void => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[${timestamp}] ${context}:`, errorMessage);
  if (details) {
    console.error('Details:', details);
  }
};

/**
 * Standard warning logger for API services
 */
export const logWarning = (
  context: string,
  message: string,
  details?: unknown,
): void => {
  const timestamp = new Date().toISOString();

  console.warn(`[${timestamp}] ${context}:`, message);
  if (details) {
    console.warn('Details:', details);
  }
};

/**
 * Safely handle API response failures with consistent logging
 */
export const handleApiError = <T>(
  context: string,
  response: { success: boolean; error?: string; message?: string; data?: T },
  fallbackValue: T,
): T => {
  if (!response.success) {
    logError(
      context,
      response.error || response.message || 'Unknown API error',
      {
        response,
      },
    );
    return fallbackValue;
  }

  // Return the actual data when successful
  return (response.data as T) || fallbackValue;
};

/**
 * Safely handle async operations with consistent error logging
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue: T,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logError(context, error);
    return fallbackValue;
  }
};
