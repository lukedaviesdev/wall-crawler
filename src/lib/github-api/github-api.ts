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
 * Fetch directory contents from GitHub API
 */
const fetchDirectoryContents = async (
  path: string = '',
): Promise<GitHubDirectoryResponse> => {
  const url = buildApiUrl(path);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new GitHubApiError(
        `Failed to fetch ${path || 'root'}: ${response.statusText}`,
        response.status,
        url,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw error;
    }
    throw new GitHubApiError(
      `Network error fetching ${path || 'root'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      url,
    );
  }
};

/**
 * Get all available categories from the repository
 */
export const getCategories = async (): Promise<WallpaperCategory[]> => {
  const contents = await fetchDirectoryContents();

  const categories = contents
    .filter((item) => item.type === 'dir')
    .map((item) => ({
      name: item.name,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      path: item.path,
      count: 0, // Will be populated separately if needed
      description: `${item.name} wallpapers`,
    }));

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
