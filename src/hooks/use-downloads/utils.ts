/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index]
  );
};

/**
 * Format download speed to human readable format
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond, 1) + '/s';
};

/**
 * Calculate estimated time remaining for download
 */
export const formatTimeRemaining = (
  loaded: number,
  total: number,
  speed: number,
): string => {
  if (speed === 0 || total === 0) return 'Calculating...';

  const remaining = total - loaded;
  const seconds = Math.ceil(remaining / speed);

  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

/**
 * Generate a safe filename from a wallpaper name
 */
export const generateSafeFileName = (
  originalName: string,
  category: string,
): string => {
  // Remove file extension to get base name
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  const extension = originalName.match(/\.[^/.]+$/) || ['.jpg'];

  // Create safe filename
  const safeName = nameWithoutExtension
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  const safeCategory = category
    .toLowerCase()
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_');

  return `${safeCategory}_${safeName}${extension[0]}`;
};

/**
 * Check if file type is supported for download
 */
export const isSupportedImageType = (filename: string): boolean => {
  const supportedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.bmp',
    '.svg',
  ];
  const extension = filename.toLowerCase().match(/\.[^/.]+$/);

  if (!extension) return false;

  return supportedExtensions.includes(extension[0]);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : '';
};

/**
 * Validate download URL
 */
export const isValidDownloadUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
};
