import {
  getCategories as getDatabaseCategories,
  getCategoryBySlug,
  getWallpapersByCategory as getDatabaseWallpapersByCategory,
  getFeaturedWallpapers as getDatabaseFeaturedWallpapers,
  createCategory,
  createWallpaper,
  updateSyncMeta,
} from '@/lib/database';
import {
  getCategoriesLight,
  getWallpapersByCategory as getGitHubWallpapersByCategory,
} from '@/lib/github-api';

import type { DatabaseCategory, DatabaseWallpaper } from '@/types/database';
import type { WallpaperItem, WallpaperCategory } from '@/types/wallpaper';

/**
 * Convert database category to wallpaper category
 */
const convertDatabaseCategory = (
  databaseCategory: DatabaseCategory,
): WallpaperCategory => ({
  name: databaseCategory.name,
  slug: databaseCategory.slug,
  path: databaseCategory.path,
  count: databaseCategory.wallpaper_count,
  description: databaseCategory.description,
});

/**
 * Convert database wallpaper to wallpaper item
 */
const convertDatabaseWallpaper = (
  databaseWallpaper: DatabaseWallpaper,
): WallpaperItem => ({
  id: databaseWallpaper.github_id,
  name: databaseWallpaper.name,
  path: databaseWallpaper.path,
  sha: databaseWallpaper.github_id,
  size: databaseWallpaper.size,
  download_url: databaseWallpaper.download_url,
  html_url: databaseWallpaper.html_url,
  category: databaseWallpaper.category_name,
  resolution:
    databaseWallpaper.width && databaseWallpaper.height
      ? {
          width: databaseWallpaper.width,
          height: databaseWallpaper.height,
        }
      : undefined,
  aspectRatio: databaseWallpaper.aspect_ratio,
  dominantColor: databaseWallpaper.dominant_color,
});

/**
 * Convert GitHub wallpaper to database wallpaper
 */
const convertGitHubWallpaper = (
  githubWallpaper: WallpaperItem,
  categoryId: number,
  isFeatured: boolean = false,
): Omit<DatabaseWallpaper, 'id' | 'created_at' | 'updated_at'> => ({
  github_id: githubWallpaper.sha,
  name: githubWallpaper.name,
  path: githubWallpaper.path,
  category_id: categoryId,
  category_name: githubWallpaper.category,
  download_url: githubWallpaper.download_url,
  html_url: githubWallpaper.html_url,
  size: githubWallpaper.size,
  width: githubWallpaper.resolution?.width,
  height: githubWallpaper.resolution?.height,
  aspect_ratio: githubWallpaper.aspectRatio,
  dominant_color: githubWallpaper.dominantColor,
  is_featured: isFeatured,
  download_count: 0,
  view_count: 0,
});

/**
 * Smart service: Get categories (DB first, then GitHub + cache)
 */
export const getCategories = async (): Promise<WallpaperCategory[]> => {
  // Check database first
  const databaseCategories = getDatabaseCategories();

  if (databaseCategories.length > 0) {
    console.log(`📁 Found ${databaseCategories.length} categories in database`);
    return databaseCategories.map(convertDatabaseCategory);
  }

  // Fallback to GitHub API and cache results
  console.log('📁 No categories in database, fetching from GitHub...');
  try {
    const githubCategories = await getCategoriesLight();

    // Cache categories in database
    const cachedCategories: WallpaperCategory[] = [];
    for (const githubCategory of githubCategories) {
      try {
        const databaseCategory = {
          name: githubCategory.name,
          slug: githubCategory.slug,
          path: githubCategory.path,
          description:
            githubCategory.description || `${githubCategory.name} wallpapers`,
          wallpaper_count: 0,
        };
        const created = createCategory(databaseCategory);
        cachedCategories.push(convertDatabaseCategory(created));
      } catch (error) {
        console.warn(`Failed to cache category ${githubCategory.name}:`, error);
        // Still include in response even if caching failed
        cachedCategories.push(githubCategory);
      }
    }

    console.log(`✅ Cached ${cachedCategories.length} categories in database`);
    return cachedCategories;
  } catch (error) {
    console.error('Failed to fetch categories from GitHub:', error);
    return [];
  }
};

/**
 * Smart service: Get wallpapers by category (DB first, then GitHub + cache)
 */
export const getWallpapersByCategory = async (
  categorySlug: string,
): Promise<WallpaperItem[]> => {
  // Check database first
  const databaseCategory = getCategoryBySlug(categorySlug);

  if (databaseCategory) {
    const databaseWallpapers = getDatabaseWallpapersByCategory(
      databaseCategory.id,
    );

    if (databaseWallpapers.length > 0) {
      console.log(
        `🖼️  Found ${databaseWallpapers.length} wallpapers for ${categorySlug} in database`,
      );
      return databaseWallpapers.map(convertDatabaseWallpaper);
    }
  }

  // Fallback to GitHub API and cache results
  console.log(
    `🖼️  No wallpapers for ${categorySlug} in database, fetching from GitHub...`,
  );
  try {
    const githubWallpapers = await getGitHubWallpapersByCategory(categorySlug);

    if (!databaseCategory) {
      console.warn(
        `Category ${categorySlug} not found in database, skipping cache`,
      );
      return githubWallpapers;
    }

    // Cache wallpapers in database
    const cachedWallpapers: WallpaperItem[] = [];
    const featuredCategories = [
      'anime',
      'abstract',
      'nature',
      'architecture',
      'digital',
    ];
    const isFeatured = featuredCategories.includes(categorySlug);

    for (const githubWallpaper of githubWallpapers) {
      try {
        const databaseWallpaper = convertGitHubWallpaper(
          githubWallpaper,
          databaseCategory.id,
          isFeatured,
        );
        const created = createWallpaper(databaseWallpaper);
        cachedWallpapers.push(convertDatabaseWallpaper(created));
      } catch (error) {
        // Skip if already exists (duplicate github_id)
        if (
          error instanceof Error &&
          error.message.includes('UNIQUE constraint failed')
        ) {
          cachedWallpapers.push(githubWallpaper);
        } else {
          console.warn(
            `Failed to cache wallpaper ${githubWallpaper.name}:`,
            error,
          );
          cachedWallpapers.push(githubWallpaper);
        }
      }
    }

    // Update sync metadata
    updateSyncMeta(categorySlug, 'completed', cachedWallpapers.length);

    console.log(
      `✅ Cached ${cachedWallpapers.length} wallpapers for ${categorySlug}`,
    );
    return cachedWallpapers;
  } catch (error) {
    console.error(
      `Failed to fetch wallpapers for ${categorySlug} from GitHub:`,
      error,
    );
    updateSyncMeta(
      categorySlug,
      'failed',
      0,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return [];
  }
};

/**
 * Smart service: Get featured wallpapers (DB first, then selective GitHub + cache)
 */
export const getFeaturedWallpapers = async (
  limit: number = 18,
): Promise<WallpaperItem[]> => {
  // Check database first
  const databaseFeaturedWallpapers = getDatabaseFeaturedWallpapers(limit);

  if (databaseFeaturedWallpapers.length >= Math.min(limit, 10)) {
    console.log(
      `⭐ Found ${databaseFeaturedWallpapers.length} featured wallpapers in database`,
    );
    return databaseFeaturedWallpapers.map(convertDatabaseWallpaper);
  }

  // Fallback: fetch from a few featured categories
  console.log(
    '⭐ Insufficient featured wallpapers in database, fetching from GitHub...',
  );
  const featuredCategories = ['anime', 'abstract', 'nature'];
  const wallpapersPerCategory = Math.ceil(limit / featuredCategories.length);

  const allWallpapers: WallpaperItem[] = [];

  for (const categorySlug of featuredCategories) {
    try {
      const categoryWallpapers = await getWallpapersByCategory(categorySlug);
      allWallpapers.push(...categoryWallpapers.slice(0, wallpapersPerCategory));

      // Respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn(
        `Failed to fetch featured wallpapers from ${categorySlug}:`,
        error,
      );
    }
  }

  return allWallpapers.slice(0, limit);
};
