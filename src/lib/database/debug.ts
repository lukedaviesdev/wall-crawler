/**
 * Debug utilities for inspecting the SQLite database
 */

import { getDb as getDatabase } from './connection';

import type {
  DatabaseCategory,
  DatabaseWallpaper,
  DatabaseSyncMeta,
  DatabaseAnalytics,
} from '@/types/database';

/**
 * Export current database state to console and download as JSON
 */
export const exportDatabaseState = (): void => {
  const database = getDatabase();

  // Query all data from SQLite database
  const categories = database
    .prepare('SELECT * FROM categories')
    .all() as DatabaseCategory[];
  const wallpapers = database
    .prepare('SELECT * FROM wallpapers')
    .all() as DatabaseWallpaper[];
  const syncMeta = database
    .prepare('SELECT * FROM sync_meta')
    .all() as DatabaseSyncMeta[];
  const analytics = database
    .prepare('SELECT * FROM analytics')
    .all() as DatabaseAnalytics[];

  const state = {
    categories,
    wallpapers,
    syncMeta,
    analytics,
    summary: {
      categoriesCount: categories.length,
      wallpapersCount: wallpapers.length,
      syncMetaCount: syncMeta.length,
      analyticsCount: analytics.length,
    },
  };

  console.log('📊 Current Database State:', state);

  // Also create a downloadable JSON file
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallcrawler-db-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Clear all database data (useful for testing)
 */
export const clearDatabase = (): void => {
  const database = getDatabase();

  // Clear all tables in SQLite database
  database.prepare('DELETE FROM analytics').run();
  database.prepare('DELETE FROM wallpapers').run();
  database.prepare('DELETE FROM sync_meta').run();
  database.prepare('DELETE FROM categories').run();

  console.log('🗑️ Database cleared. All tables emptied.');
};

/**
 * Get quick database summary
 */
export const getDatabaseSummary = () => {
  const database = getDatabase();

  // Get counts from SQLite database
  const categoriesCount = database
    .prepare('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };
  const wallpapersCount = database
    .prepare('SELECT COUNT(*) as count FROM wallpapers')
    .get() as { count: number };
  const syncMetaCount = database
    .prepare('SELECT COUNT(*) as count FROM sync_meta')
    .get() as { count: number };
  const analyticsCount = database
    .prepare('SELECT COUNT(*) as count FROM analytics')
    .get() as { count: number };

  const summary = {
    categories: categoriesCount.count,
    wallpapers: wallpapersCount.count,
    syncMeta: syncMetaCount.count,
    analytics: analyticsCount.count,
  };

  console.log('📊 Database Summary:', summary);

  if (summary.categories > 0) {
    const categories = database
      .prepare('SELECT slug FROM categories')
      .all() as { slug: string }[];
    console.log(
      '📁 Categories:',
      categories.map((c) => c.slug),
    );
  }

  if (summary.wallpapers > 0) {
    const wallpapersByCategory = database
      .prepare(
        `
      SELECT category_name, COUNT(*) as count 
      FROM wallpapers 
      GROUP BY category_name
    `,
      )
      .all() as { category_name: string; count: number }[];

    const categoryMap = wallpapersByCategory.reduce(
      (accumulator, row) => {
        accumulator[row.category_name] = row.count;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    console.log('🖼️ Wallpapers by category:', categoryMap);
  }

  return summary;
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).wallcrawlerDebug = {
    exportState: exportDatabaseState,
    clearDatabase,
    getSummary: getDatabaseSummary,
  };

  console.log('🔧 Debug utilities available at window.wallcrawlerDebug');
  console.log('  - wallcrawlerDebug.getSummary() - Quick database stats');
  console.log(
    '  - wallcrawlerDebug.exportState() - Export full database state',
  );
  console.log('  - wallcrawlerDebug.clearDatabase() - Clear all data');
}
