import { getDb as getDatabase } from './connection';

import type {
  DatabaseWallpaper,
  DatabaseWallpaperFilters,
} from '@/types/database';

/**
 * Get wallpapers with filters
 */
export const getWallpapers = (
  filters: DatabaseWallpaperFilters = {},
): DatabaseWallpaper[] => {
  const database = getDatabase();

  let query = 'SELECT * FROM wallpapers WHERE 1=1';
  const parameters: unknown[] = [];

  if (filters.categoryId) {
    query += ' AND category_id = ?';
    parameters.push(filters.categoryId);
  }

  if (filters.categoryName) {
    query += ' AND category_name = ?';
    parameters.push(filters.categoryName);
  }

  if (filters.isFeatured !== undefined) {
    query += ' AND is_featured = ?';
    parameters.push(filters.isFeatured ? 1 : 0);
  }

  if (filters.search) {
    query += ' AND (name LIKE ? OR category_name LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    parameters.push(searchTerm, searchTerm);
  }

  // Order by
  const orderBy = filters.orderBy || 'created_at';
  const direction = filters.orderDirection || 'DESC';
  query += ` ORDER BY ${orderBy} ${direction}`;

  // Limit
  if (filters.limit) {
    query += ' LIMIT ?';
    parameters.push(filters.limit);
  }

  const stmt = database.prepare(query);
  return stmt.all(...parameters) as DatabaseWallpaper[];
};

/**
 * Get wallpapers by category
 */
export const getWallpapersByCategory = (
  categoryId: number,
  limit?: number,
): DatabaseWallpaper[] => {
  return getWallpapers({ categoryId, limit });
};

/**
 * Get featured wallpapers
 */
export const getFeaturedWallpapers = (limit?: number): DatabaseWallpaper[] => {
  return getWallpapers({ isFeatured: true, limit, orderBy: 'view_count' });
};

/**
 * Get wallpaper by ID
 */
export const getWallpaperById = (id: number): DatabaseWallpaper | null => {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM wallpapers WHERE id = ?');
  return (stmt.get(id) as DatabaseWallpaper) || null;
};

/**
 * Create wallpaper
 */
export const createWallpaper = (
  wallpaper: Omit<DatabaseWallpaper, 'id' | 'created_at' | 'updated_at'>,
): DatabaseWallpaper => {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO wallpapers (
      github_id, name, path, category_id, category_name, download_url, html_url,
      size, width, height, aspect_ratio, dominant_color, is_featured,
      download_count, view_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    wallpaper.github_id,
    wallpaper.name,
    wallpaper.path,
    wallpaper.category_id,
    wallpaper.category_name,
    wallpaper.download_url,
    wallpaper.html_url,
    wallpaper.size,
    wallpaper.width,
    wallpaper.height,
    wallpaper.aspect_ratio,
    wallpaper.dominant_color,
    wallpaper.is_featured,
    wallpaper.download_count,
    wallpaper.view_count,
  );

  // Get the created wallpaper
  const getWallpaperStmt = database.prepare(
    'SELECT * FROM wallpapers WHERE id = ?',
  );
  return getWallpaperStmt.get(result.lastInsertRowid) as DatabaseWallpaper;
};

/**
 * Increment download count
 */
export const incrementDownloadCount = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(
    'UPDATE wallpapers SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  );
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Increment view count
 */
export const incrementViewCount = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(
    'UPDATE wallpapers SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  );
  const result = stmt.run(id);
  return result.changes > 0;
};
