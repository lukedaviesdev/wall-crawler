import { getDb as getDatabase } from './connection';

import type { DatabaseSyncMeta, DatabaseAnalytics } from '@/types/database';

// === SYNC METADATA OPERATIONS ===

/**
 * Update sync metadata for a category
 */
export const updateSyncMeta = (
  categoryName: string,
  status: DatabaseSyncMeta['sync_status'],
  count?: number,
  error?: string,
): boolean => {
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO sync_meta (
      category_name, sync_status, last_synced, wallpaper_count, error_message, updated_at
    )
    VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = stmt.run(categoryName, status, count || 0, error || null);
  return result.changes > 0;
};

/**
 * Get sync metadata for a category
 */
export const getSyncMeta = (categoryName: string): DatabaseSyncMeta | null => {
  const database = getDatabase();
  const stmt = database.prepare(
    'SELECT * FROM sync_meta WHERE category_name = ?',
  );
  const result = stmt.get(categoryName) as DatabaseSyncMeta | undefined;
  return result || null;
};

/**
 * Get all sync metadata
 */
export const getAllSyncMeta = (): DatabaseSyncMeta[] => {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM sync_meta
    ORDER BY last_synced DESC NULLS LAST
  `);
  return stmt.all() as DatabaseSyncMeta[];
};

/**
 * Delete sync metadata for a category
 */
export const deleteSyncMeta = (categoryName: string): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(
    'DELETE FROM sync_meta WHERE category_name = ?',
  );
  const result = stmt.run(categoryName);
  return result.changes > 0;
};

// === ANALYTICS OPERATIONS ===

/**
 * Track an event
 */
export const trackEvent = (
  eventType: string,
  categoryName?: string,
  wallpaperId?: number,
  metadata?: Record<string, unknown>,
): boolean => {
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT INTO analytics (event_type, wallpaper_id, category_name, metadata)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    eventType,
    wallpaperId || null,
    categoryName || null,
    metadata ? JSON.stringify(metadata) : null,
  );

  return result.changes > 0;
};

/**
 * Get analytics data with optional filtering
 */
export const getAnalytics = (
  eventType?: string,
  categoryName?: string,
  limit?: number,
  startDate?: string,
  endDate?: string,
): DatabaseAnalytics[] => {
  const database = getDatabase();

  // Build dynamic query
  let query = 'SELECT * FROM analytics WHERE 1=1';
  const parameters: unknown[] = [];

  if (eventType) {
    query += ' AND event_type = ?';
    parameters.push(eventType);
  }

  if (categoryName) {
    query += ' AND category_name = ?';
    parameters.push(categoryName);
  }

  if (startDate) {
    query += ' AND timestamp >= ?';
    parameters.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    parameters.push(endDate);
  }

  query += ' ORDER BY timestamp DESC';

  if (limit) {
    query += ' LIMIT ?';
    parameters.push(limit);
  }

  const stmt = database.prepare(query);
  const results = stmt.all(...parameters) as DatabaseAnalytics[];

  // Parse metadata JSON
  return results.map((event) => ({
    ...event,
    metadata: event.metadata ? JSON.parse(event.metadata as string) : null,
  }));
};

/**
 * Get analytics summary by event type
 */
export const getAnalyticsSummary = (
  startDate?: string,
  endDate?: string,
): { eventType: string; count: number }[] => {
  const database = getDatabase();

  let query = `
    SELECT event_type as eventType, COUNT(*) as count
    FROM analytics
    WHERE 1=1
  `;
  const parameters: unknown[] = [];

  if (startDate) {
    query += ' AND timestamp >= ?';
    parameters.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    parameters.push(endDate);
  }

  query += ' GROUP BY event_type ORDER BY count DESC';

  const stmt = database.prepare(query);
  return stmt.all(...parameters) as { eventType: string; count: number }[];
};

/**
 * Delete old analytics data
 */
export const cleanupAnalytics = (olderThanDays: number): number => {
  const database = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const stmt = database.prepare('DELETE FROM analytics WHERE timestamp < ?');
  const result = stmt.run(cutoffDate.toISOString());
  return result.changes;
};

// === STATISTICS OPERATIONS ===

/**
 * Get database statistics
 */
export const getStats = (): {
  categories: number;
  wallpapers: number;
  lastSync: string | null;
  totalDownloads: number;
  totalViews: number;
  featuredWallpapers: number;
  syncedCategories: number;
} => {
  const database = getDatabase();

  // Get counts
  const categoriesResult = database
    .prepare('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };
  const wallpapersResult = database
    .prepare('SELECT COUNT(*) as count FROM wallpapers')
    .get() as { count: number };
  const featuredResult = database
    .prepare('SELECT COUNT(*) as count FROM wallpapers WHERE is_featured = 1')
    .get() as { count: number };
  const syncedResult = database
    .prepare(
      'SELECT COUNT(*) as count FROM sync_meta WHERE sync_status = "completed"',
    )
    .get() as { count: number };

  // Get last sync
  const lastSyncResult = database
    .prepare('SELECT MAX(last_synced) as lastSync FROM sync_meta')
    .get() as { lastSync: string | null };

  // Get totals
  const totalsResult = database
    .prepare(
      `
    SELECT
      COALESCE(SUM(download_count), 0) as totalDownloads,
      COALESCE(SUM(view_count), 0) as totalViews
    FROM wallpapers
  `,
    )
    .get() as { totalDownloads: number; totalViews: number };

  return {
    categories: categoriesResult.count,
    wallpapers: wallpapersResult.count,
    featuredWallpapers: featuredResult.count,
    syncedCategories: syncedResult.count,
    lastSync: lastSyncResult.lastSync,
    totalDownloads: totalsResult.totalDownloads,
    totalViews: totalsResult.totalViews,
  };
};

/**
 * Get sync status for all categories
 */
export const getSyncStatus = (): {
  categoryName: string;
  status: DatabaseSyncMeta['sync_status'];
  lastSynced: string | null;
  wallpaperCount: number;
  errorMessage?: string;
}[] => {
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT
      category_name as categoryName,
      sync_status as status,
      last_synced as lastSynced,
      wallpaper_count as wallpaperCount,
      error_message as errorMessage
    FROM sync_meta
    ORDER BY last_synced DESC NULLS LAST
  `);

  return stmt.all() as {
    categoryName: string;
    status: DatabaseSyncMeta['sync_status'];
    lastSynced: string | null;
    wallpaperCount: number;
    errorMessage?: string;
  }[];
};

/**
 * Get category statistics
 */
export const getCategoryStats = (): {
  categoryName: string;
  wallpaperCount: number;
  featuredCount: number;
  totalDownloads: number;
  totalViews: number;
}[] => {
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT
      category_name as categoryName,
      COUNT(*) as wallpaperCount,
      SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featuredCount,
      SUM(download_count) as totalDownloads,
      SUM(view_count) as totalViews
    FROM wallpapers
    GROUP BY category_name
    ORDER BY wallpaperCount DESC
  `);

  return stmt.all() as {
    categoryName: string;
    wallpaperCount: number;
    featuredCount: number;
    totalDownloads: number;
    totalViews: number;
  }[];
};
