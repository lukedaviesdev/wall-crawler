/**
 * Debug utilities for inspecting the localStorage database
 */

import { getDb as getDatabase } from './connection';

/**
 * Export current database state to console and download as JSON
 */
export const exportDatabaseState = (): void => {
  const database = getDatabase();

  const state = {
    categories: Array.from(database.categories.values()),
    wallpapers: Array.from(database.wallpapers.values()),
    syncMeta: Array.from(database.syncMeta.values()),
    analytics: database.analytics,
    summary: {
      categoriesCount: database.categories.size,
      wallpapersCount: database.wallpapers.size,
      syncMetaCount: database.syncMeta.size,
      analyticsCount: database.analytics.length,
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
  localStorage.removeItem('wallcrawler_categories');
  localStorage.removeItem('wallcrawler_wallpapers');
  localStorage.removeItem('wallcrawler_sync_meta');
  localStorage.removeItem('wallcrawler_analytics');

  console.log('🗑️ Database cleared. Refresh the page to start fresh.');
};

/**
 * Get quick database summary
 */
export const getDatabaseSummary = (): void => {
  const database = getDatabase();

  const summary = {
    categories: database.categories.size,
    wallpapers: database.wallpapers.size,
    syncMeta: database.syncMeta.size,
    analytics: database.analytics.length,
  };

  console.log('📊 Database Summary:', summary);

  if (database.categories.size > 0) {
    console.log('📁 Categories:', Array.from(database.categories.keys()));
  }

  if (database.wallpapers.size > 0) {
    const wallpapersByCategory = Array.from(
      database.wallpapers.values(),
    ).reduce(
      (accumulator, wallpaper) => {
        accumulator[wallpaper.category_name] =
          (accumulator[wallpaper.category_name] || 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    console.log('🖼️ Wallpapers by category:', wallpapersByCategory);
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
