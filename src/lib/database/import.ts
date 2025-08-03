import { createCategory } from './categories';
import { getDb as getDatabase } from './connection';
import { updateSyncMeta } from './metadata';
import { createMultipleWallpapers } from './wallpapers';

import type {
  DatabaseCategory,
  DatabaseWallpaper,
  DatabaseSyncMeta,
} from '@/types/database';

export interface ExportedData {
  categories: DatabaseCategory[];
  wallpapers: DatabaseWallpaper[];
  syncMeta: DatabaseSyncMeta[];
  analytics: any[];
  summary: {
    categoriesCount: number;
    wallpapersCount: number;
    syncMetaCount: number;
    analyticsCount: number;
  };
}

/**
 * Import data from exported localStorage JSON
 */
export const importFromJson = async (
  data: ExportedData,
): Promise<{
  success: boolean;
  categoriesImported: number;
  wallpapersImported: number;
  syncMetaImported: number;
  errors: string[];
}> => {
  const database = getDatabase();
  const errors: string[] = [];
  let categoriesImported = 0;
  let wallpapersImported = 0;
  let syncMetaImported = 0;

  console.log('🔄 Starting data import from JSON...');
  console.log(
    `📊 Data summary: ${data.summary.categoriesCount} categories, ${data.summary.wallpapersCount} wallpapers`,
  );

  // Use a transaction for better performance and atomicity
  const importTransaction = database.transaction(() => {
    try {
      // 1. Import categories first (wallpapers depend on categories)
      console.log('📁 Importing categories...');
      for (const category of data.categories) {
        try {
          const categoryData = {
            slug: category.slug,
            name: category.name,
            path: category.path,
            description: category.description,
            wallpaper_count: category.wallpaper_count || 0,
          };
          createCategory(categoryData);
          categoriesImported++;
        } catch (error) {
          const errorMessage = `Failed to import category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(errorMessage);
          errors.push(errorMessage);
        }
      }

      // 2. Import wallpapers in batches
      console.log('🖼️ Importing wallpapers...');
      if (data.wallpapers.length > 0) {
        const wallpaperData = data.wallpapers.map((wallpaper) => ({
          github_id: wallpaper.github_id,
          name: wallpaper.name,
          path: wallpaper.path,
          category_id: wallpaper.category_id,
          category_name: wallpaper.category_name,
          download_url: wallpaper.download_url,
          html_url: wallpaper.html_url,
          size: wallpaper.size,
          width: wallpaper.width,
          height: wallpaper.height,
          aspect_ratio: wallpaper.aspect_ratio,
          dominant_color: wallpaper.dominant_color,
          is_featured: wallpaper.is_featured || false,
          download_count: wallpaper.download_count || 0,
          view_count: wallpaper.view_count || 0,
        }));

        const success = createMultipleWallpapers(wallpaperData);
        if (success) {
          wallpapersImported = wallpaperData.length;
        } else {
          errors.push('Failed to import wallpapers in batch');
        }
      }

      // 3. Import sync metadata
      console.log('📊 Importing sync metadata...');
      for (const syncMeta of data.syncMeta) {
        try {
          const success = updateSyncMeta(
            syncMeta.category_name,
            syncMeta.sync_status,
            syncMeta.wallpaper_count,
            syncMeta.error_message,
          );
          if (success) {
            syncMetaImported++;
          }
        } catch (error) {
          const errorMessage = `Failed to import sync meta for ${syncMeta.category_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(errorMessage);
          errors.push(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      errors.push(errorMessage);
      throw error; // Re-throw to rollback transaction
    }
  });

  try {
    importTransaction();

    console.log(`✅ Import completed successfully!`);
    console.log(
      `📁 Categories imported: ${categoriesImported}/${data.categories.length}`,
    );
    console.log(
      `🖼️ Wallpapers imported: ${wallpapersImported}/${data.wallpapers.length}`,
    );
    console.log(
      `📊 Sync metadata imported: ${syncMetaImported}/${data.syncMeta.length}`,
    );

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred during import`);
    }

    return {
      success: true,
      categoriesImported,
      wallpapersImported,
      syncMetaImported,
      errors,
    };
  } catch (error) {
    console.error('❌ Import failed:', error);
    return {
      success: false,
      categoriesImported: 0,
      wallpapersImported: 0,
      syncMetaImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
};

/**
 * Import data from a JSON file path
 */
export const importFromFile = async (
  filePath: string,
): Promise<{
  success: boolean;
  categoriesImported: number;
  wallpapersImported: number;
  syncMetaImported: number;
  errors: string[];
}> => {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as ExportedData;

    return await importFromJson(data);
  } catch (error) {
    console.error(`❌ Failed to read import file ${filePath}:`, error);
    return {
      success: false,
      categoriesImported: 0,
      wallpapersImported: 0,
      syncMetaImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
};

/**
 * Clear all data from database (for fresh imports)
 */
export const clearDatabase = (): boolean => {
  const database = getDatabase();

  try {
    const clearTransaction = database.transaction(() => {
      database.exec('DELETE FROM analytics');
      database.exec('DELETE FROM sync_meta');
      database.exec('DELETE FROM wallpapers');
      database.exec('DELETE FROM categories');

      // Reset auto-increment sequences
      database.exec(
        'DELETE FROM sqlite_sequence WHERE name IN ("categories", "wallpapers", "sync_meta", "analytics")',
      );
    });

    clearTransaction();
    console.log('🗑️ Database cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    return false;
  }
};
