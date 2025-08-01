import {
  getCategories as getDatabaseCategories,
  createCategory,
  getStats,
} from '@/lib/database';
import { getCategoriesLight } from '@/lib/github-api';

import type { DatabaseCategory } from '@/types/database';
import type { WallpaperCategory } from '@/types/wallpaper';

/**
 * Convert GitHub category to database category
 */
const convertCategory = (
  githubCategory: WallpaperCategory,
): Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'> => ({
  name: githubCategory.name,
  slug: githubCategory.slug,
  path: githubCategory.path,
  description:
    githubCategory.description || `${githubCategory.name} wallpapers`,
  wallpaper_count: 0,
});

/**
 * Sync categories from GitHub to database
 */
export const syncCategories = async (): Promise<{
  success: number;
  failed: number;
  message: string;
}> => {
  try {
    console.log('🔄 Starting category sync...');

    // Get categories from GitHub
    const githubCategories = await getCategoriesLight();
    console.log(`📁 Found ${githubCategories.length} categories on GitHub`);

    // Get existing categories from database
    const existingCategories = getDatabaseCategories();
    const existingSlugs = new Set(existingCategories.map((cat) => cat.slug));

    let successCount = 0;
    let failedCount = 0;

    // Add new categories
    for (const githubCategory of githubCategories) {
      if (!existingSlugs.has(githubCategory.slug)) {
        try {
          const databaseCategory = convertCategory(githubCategory);
          createCategory(databaseCategory);
          console.log(`✅ Added category: ${githubCategory.name}`);
          successCount++;
        } catch (error) {
          console.error(
            `❌ Failed to add category ${githubCategory.name}:`,
            error,
          );
          failedCount++;
        }
      }
    }

    const message = `Categories sync complete: ${successCount} added, ${failedCount} failed, ${existingCategories.length} existing`;
    console.log(`📊 ${message}`);

    return { success: successCount, failed: failedCount, message };
  } catch (error) {
    const errorMessage = `Category sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMessage);
    return { success: 0, failed: 1, message: errorMessage };
  }
};

/**
 * Get sync status
 */
export const getSyncStatus = (): {
  isInitialized: boolean;
  stats: { categories: number; wallpapers: number; lastSync: string | null };
  needsInitialSync: boolean;
} => {
  const stats = getStats();
  const isInitialized = stats.categories > 0;
  const needsInitialSync = stats.wallpapers === 0;

  return { isInitialized, stats, needsInitialSync };
};
