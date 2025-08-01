import { getDb as getDatabase } from './connection';

import type { DatabaseSyncMeta, DatabaseAnalytics } from '@/types/database';

// === SYNC METADATA OPERATIONS ===

/**
 * Update sync metadata
 */
export const updateSyncMeta = (
  categoryName: string,
  status: DatabaseSyncMeta['sync_status'],
  count?: number,
  error?: string,
): boolean => {
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO sync_meta (category_name, last_synced, sync_status, wallpaper_count, error_message)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)
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
  return (stmt.get(categoryName) as DatabaseSyncMeta) || null;
};

/**
 * Get all sync metadata
 */
export const getAllSyncMeta = (): DatabaseSyncMeta[] => {
  const database = getDatabase();
  const stmt = database.prepare(
    'SELECT * FROM sync_meta ORDER BY last_synced DESC',
  );
  return stmt.all() as DatabaseSyncMeta[];
};

// === ANALYTICS OPERATIONS ===

/**
 * Track an event
 */
export const trackEvent = (
  eventType: string,
  category?: string,
  wallpaperId?: number,
  metadata?: Record<string, unknown>,
): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO analytics (event_type, category, wallpaper_id, metadata)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    eventType,
    category || null,
    wallpaperId || null,
    metadata ? JSON.stringify(metadata) : null,
  );
  return result.changes > 0;
};

/**
 * Get analytics data
 */
export const getAnalytics = (
  eventType?: string,
  category?: string,
  limit?: number,
): DatabaseAnalytics[] => {
  const database = getDatabase();

  let query = 'SELECT * FROM analytics WHERE 1=1';
  const parameters: unknown[] = [];

  if (eventType) {
    query += ' AND event_type = ?';
    parameters.push(eventType);
  }

  if (category) {
    query += ' AND category = ?';
    parameters.push(category);
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    parameters.push(limit);
  }

  const stmt = database.prepare(query);
  return stmt.all(...parameters) as DatabaseAnalytics[];
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
} => {
  const database = getDatabase();

  const categoriesStmt = database.prepare(
    'SELECT COUNT(*) as count FROM categories',
  );
  const wallpapersStmt = database.prepare(
    'SELECT COUNT(*) as count FROM wallpapers',
  );
  const lastSyncStmt = database.prepare(
    'SELECT MAX(last_synced) as last_sync FROM sync_meta',
  );
  const downloadsStmt = database.prepare(
    'SELECT SUM(download_count) as total FROM wallpapers',
  );
  const viewsStmt = database.prepare(
    'SELECT SUM(view_count) as total FROM wallpapers',
  );

  const categoriesResult = categoriesStmt.get() as { count: number };
  const wallpapersResult = wallpapersStmt.get() as { count: number };
  const lastSyncResult = lastSyncStmt.get() as { last_sync: string | null };
  const downloadsResult = downloadsStmt.get() as { total: number | null };
  const viewsResult = viewsStmt.get() as { total: number | null };

  return {
    categories: categoriesResult.count,
    wallpapers: wallpapersResult.count,
    lastSync: lastSyncResult.last_sync,
    totalDownloads: downloadsResult.total || 0,
    totalViews: viewsResult.total || 0,
  };
};

/**
 * Get sync status for all categories
 */
export const getSyncStatus = (): {
  categoryName: string;
  status: DatabaseSyncMeta['sync_status'];
  lastSynced: string;
  wallpaperCount: number;
  errorMessage?: string;
}[] => {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT
      category_name,
      sync_status as status,
      last_synced,
      wallpaper_count,
      error_message
    FROM sync_meta
    ORDER BY last_synced DESC
  `);

  return stmt.all() as {
    categoryName: string;
    status: DatabaseSyncMeta['sync_status'];
    lastSynced: string;
    wallpaperCount: number;
    errorMessage?: string;
  }[];
};
