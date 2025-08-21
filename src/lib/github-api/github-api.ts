import type {
  GitHubContentItem,
  GitHubDirectoryResponse,
} from '@/types/github';
import type { WallpaperItem, WallpaperCategory } from '@/types/wallpaper';

// GitHub repository configuration
const GITHUB_CONFIG = {
  owner: 'dharmx',
  repo: 'walls',
  baseUrl: 'https://api.github.com',
  rawUrl: 'https://raw.githubusercontent.com',
} as const;

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

/**
 * Custom error class for GitHub API errors
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

// Build API URLs
const buildApiUrl = (path: string = '') =>
  `${GITHUB_CONFIG.baseUrl}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents${path}`;

const buildRawUrl = (path: string) =>
  `${GITHUB_CONFIG.rawUrl}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main${path}`;

// Utility functions
const isImageFile = (filename: string): boolean => {
  return IMAGE_EXTENSIONS.some((extension) =>
    filename.toLowerCase().endsWith(extension),
  );
};

const extractFileInfo = (
  item: GitHubContentItem,
  category: string,
): WallpaperItem => {
  const resolution = extractResolutionFromName(item.name);

  return {
    id: item.sha,
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    download_url: item.download_url || buildRawUrl(item.path),
    html_url: item.html_url,
    category,
    resolution,
    aspectRatio: resolution
      ? getAspectRatio(resolution.width, resolution.height)
      : undefined,
  };
};

const extractResolutionFromName = (filename: string) => {
  // Try to extract resolution from filename patterns like "1920x1080", "3840×2160", etc.
  const resolutionMatch = filename.match(/(\d{3,4})[x×](\d{3,4})/);
  if (resolutionMatch) {
    return {
      width: parseInt(resolutionMatch[1], 10),
      height: parseInt(resolutionMatch[2], 10),
    };
  }
  return undefined;
};

const getAspectRatio = (
  width: number,
  height: number,
): 'portrait' | 'landscape' | 'square' => {
  const ratio = width / height;
  if (ratio > 1.1) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
};

/**
 * Fetch directory contents from GitHub API (with rate limiting)
 */
const fetchDirectoryContents = async (
  path: string = '',
): Promise<GitHubDirectoryResponse> => {
  return fetchDirectoryContentsWithRateLimit(path);
};

/**
 * Get all available categories from the repository
 */
export const getCategories = async (): Promise<WallpaperCategory[]> => {
  const contents = await fetchDirectoryContents();

  // Filter out system directories and non-wallpaper folders
  const wallpaperDirectories = contents
    .filter((item) => item.type === 'dir')
    .filter((item) => !item.name.startsWith('.')) // Filter out .github, etc.
    .filter(
      (item) =>
        !['logs.txt', 'responses.txt', 'snake_case_log.txt'].includes(
          item.name,
        ),
    );

  const categories: WallpaperCategory[] = [];

  for (const item of wallpaperDirectories) {
    try {
      // Count wallpapers in this category
      const categoryContents = await fetchDirectoryContents(`/${item.path}`);
      const wallpaperCount = categoryContents.filter(
        (file) => file.type === 'file' && isImageFile(file.name),
      ).length;

      categories.push({
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        path: item.path,
        count: wallpaperCount,
        description: `${item.name} wallpapers`,
      });
    } catch (error) {
      console.warn(
        `Failed to count wallpapers in category ${item.name}:`,
        error,
      );
      // Still add the category but with 0 count
      categories.push({
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        path: item.path,
        count: 0,
        description: `${item.name} wallpapers`,
      });
    }
  }

  return categories;
};

/**
 * Get all wallpapers from all categories
 */
export const getAllWallpapers = async (): Promise<WallpaperItem[]> => {
  const categories = await getCategories();
  const allWallpapers: WallpaperItem[] = [];

  for (const category of categories) {
    try {
      const categoryWallpapers = await getWallpapersByCategory(category.slug);
      allWallpapers.push(...categoryWallpapers);
    } catch (error) {
      console.warn(`Failed to load category ${category.name}:`, error);
      // Continue with other categories
    }
  }

  return allWallpapers;
};

/**
 * Get wallpapers from a specific category
 */
export const getWallpapersByCategory = async (
  categorySlug: string,
): Promise<WallpaperItem[]> => {
  // Find the actual category path (case-sensitive)
  const categories = await getCategories();
  const category = categories.find((cat) => cat.slug === categorySlug);

  if (!category) {
    throw new GitHubApiError(`Category "${categorySlug}" not found`, 404, '');
  }

  const contents = await fetchDirectoryContents(`/${category.path}`);

  const wallpapers = contents
    .filter((item) => item.type === 'file' && isImageFile(item.name))
    .map((item) => extractFileInfo(item, category.name));

  return wallpapers;
};

/**
 * Get a limited number of wallpapers from a specific category (for initial loads)
 */
export const getWallpapersByCategoryLimited = async (
  categorySlug: string,
  limit: number = 6,
): Promise<WallpaperItem[]> => {
  // Find the actual category path (case-sensitive)
  const categories = await getCategories();
  const category = categories.find((cat) => cat.slug === categorySlug);

  if (!category) {
    throw new GitHubApiError(`Category "${categorySlug}" not found`, 404, '');
  }

  const contents = await fetchDirectoryContents(`/${category.path}`);

  const wallpapers = contents
    .filter((item) => item.type === 'file' && isImageFile(item.name))
    .slice(0, limit) // Limit the number of files we process
    .map((item) => extractFileInfo(item, category.name));

  return wallpapers;
};

/**
 * Get wallpapers from a category with pagination (avoids rate limits)
 */
export const getWallpapersByCategoryPaginated = async (
  categorySlug: string,
  page: number = 1,
  limit: number = 12,
): Promise<{
  wallpapers: WallpaperItem[];
  hasMore: boolean;
  total: number;
  page: number;
}> => {
  // Find the actual category path (case-sensitive)
  const categories = await getCategories();
  const category = categories.find((cat) => cat.slug === categorySlug);

  if (!category) {
    throw new GitHubApiError(`Category "${categorySlug}" not found`, 404, '');
  }

  const contents = await fetchDirectoryContents(`/${category.path}`);
  const allFiles = contents.filter(
    (item) => item.type === 'file' && isImageFile(item.name),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pagedFiles = allFiles.slice(startIndex, endIndex);

  const wallpapers = pagedFiles.map((item) =>
    extractFileInfo(item, category.name),
  );

  return {
    wallpapers,
    hasMore: endIndex < allFiles.length,
    total: allFiles.length,
    page,
  };
};

/**
 * Search wallpapers across all categories
 */
export const searchWallpapers = async (
  query: string,
  categorySlug?: string,
): Promise<WallpaperItem[]> => {
  const searchTerm = query.toLowerCase();

  let wallpapers: WallpaperItem[];

  if (categorySlug) {
    wallpapers = await getWallpapersByCategory(categorySlug);
  } else {
    wallpapers = await getAllWallpapers();
  }

  return wallpapers.filter(
    (wallpaper) =>
      wallpaper.name.toLowerCase().includes(searchTerm) ||
      wallpaper.category.toLowerCase().includes(searchTerm),
  );
};

/**
 * Get wallpapers with pagination support
 */
export const getWallpapersPaginated = async (
  page: number = 1,
  limit: number = 20,
  categorySlug?: string,
): Promise<{
  wallpapers: WallpaperItem[];
  hasMore: boolean;
  total: number;
}> => {
  let allWallpapers: WallpaperItem[];

  if (categorySlug) {
    allWallpapers = await getWallpapersByCategory(categorySlug);
  } else {
    allWallpapers = await getAllWallpapers();
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const wallpapers = allWallpapers.slice(startIndex, endIndex);
  const hasMore = endIndex < allWallpapers.length;

  return {
    wallpapers,
    hasMore,
    total: allWallpapers.length,
  };
};

/**
 * Get all available categories from the repository (lightweight version without counts)
 */
export const getCategoriesLight = async (): Promise<WallpaperCategory[]> => {
  const contents = await fetchDirectoryContents();

  // Filter out system directories and non-wallpaper folders
  const wallpaperDirectories = contents
    .filter((item) => item.type === 'dir')
    .filter((item) => !item.name.startsWith('.')) // Filter out .github, etc.
    .filter(
      (item) =>
        !['logs.txt', 'responses.txt', 'snake_case_log.txt'].includes(
          item.name,
        ),
    );

  const categories: WallpaperCategory[] = wallpaperDirectories.map((item) => ({
    name: item.name,
    slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    path: item.path,
    count: 0, // Will be populated on-demand
    description: `${item.name} wallpapers`,
  }));

  return categories;
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 50, // Conservative limit
  requestDelay: 1200, // 1.2 seconds between requests
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
} as const;

// Request queue to manage rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < RATE_LIMIT_CONFIG.requestDelay) {
        await this.delay(RATE_LIMIT_CONFIG.requestDelay - timeSinceLastRequest);
      }

      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const requestQueue = new RequestQueue();

// Featured categories for immediate loading
const FEATURED_CATEGORIES = [
  'anime',
  'abstract',
  'nature',
  'architecture',
  'digital',
  'minimal',
] as const;

/**
 * Enhanced fetch with rate limiting and retry logic
 */
const fetchWithRateLimit = async (
  url: string,
  retryCount = 0,
): Promise<Response> => {
  try {
    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited
      if (retryCount < RATE_LIMIT_CONFIG.retryAttempts) {
        console.warn(
          `Rate limited, retrying in ${RATE_LIMIT_CONFIG.retryDelay}ms (attempt ${retryCount + 1})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_CONFIG.retryDelay),
        );
        return fetchWithRateLimit(url, retryCount + 1);
      }
      throw new GitHubApiError('Rate limit exceeded after retries', 429, url);
    }

    if (!response.ok) {
      throw new GitHubApiError(
        `Failed to fetch ${url}: ${response.statusText}`,
        response.status,
        url,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof GitHubApiError) throw error;
    throw new GitHubApiError(`Network error fetching ${url}`, 0, url);
  }
};

/**
 * Enhanced directory contents fetcher with rate limiting
 */
const fetchDirectoryContentsWithRateLimit = async (
  path: string = '',
): Promise<GitHubDirectoryResponse> => {
  const url = buildApiUrl(path);

  return requestQueue.add(async () => {
    const response = await fetchWithRateLimit(url);
    return response.json();
  });
};

/**
 * Get featured wallpapers from select categories (limited per category)
 */
export const getFeaturedWallpapers = async (
  limit: number = 3,
): Promise<WallpaperItem[]> => {
  const featuredWallpapers: WallpaperItem[] = [];

  for (const categoryName of FEATURED_CATEGORIES) {
    try {
      console.log(`Loading featured wallpapers from ${categoryName}...`);
      const contents = await fetchDirectoryContentsWithRateLimit(
        `/${categoryName}`,
      );

      const categoryWallpapers = contents
        .filter((item) => item.type === 'file' && isImageFile(item.name))
        .slice(0, limit) // Limit per category
        .map((item) => extractFileInfo(item, categoryName));

      featuredWallpapers.push(...categoryWallpapers);

      // Add small delay between categories
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.warn(
        `Failed to load featured wallpapers from ${categoryName}:`,
        error,
      );
      // Continue with other categories
    }
  }

  return featuredWallpapers;
};
