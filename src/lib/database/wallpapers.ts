import { getDb as getDatabase } from './connection';

import type {
  DatabaseWallpaper,
  DatabaseWallpaperFilters,
} from '@/types/database';

/**
 * Get wallpapers with optional filtering
 */
export const getWallpapers = (
  filters: DatabaseWallpaperFilters = {},
): DatabaseWallpaper[] => {
  const database = getDatabase();

  // Build dynamic query
  let query = 'SELECT * FROM wallpapers WHERE 1=1';
  const parameters: unknown[] = [];

  // Apply filters
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
    parameters.push(filters.isFeatured ? 1 : 0); // SQLite boolean conversion
  }

  if (filters.search) {
    query += ' AND (name LIKE ? OR category_name LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    parameters.push(searchTerm, searchTerm);
  }

  // Add ordering
  const orderBy = filters.orderBy || 'created_at';
  const direction = filters.orderDirection || 'DESC';
  query += ` ORDER BY ${orderBy} ${direction}`;

  // Add limit and offset
  if (filters.limit) {
    query += ' LIMIT ?';
    parameters.push(filters.limit);

    if (filters.offset) {
      query += ' OFFSET ?';
      parameters.push(filters.offset);
    }
  }

  const stmt = database.prepare(query);
  const results = stmt.all(...parameters) as DatabaseWallpaper[];

  // Convert SQLite integers back to booleans
  return results.map((wallpaper) => ({
    ...wallpaper,
    is_featured: Boolean(wallpaper.is_featured),
  }));
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
  const result = stmt.get(id) as DatabaseWallpaper | undefined;

  if (result) {
    // Convert SQLite integer to boolean
    result.is_featured = Boolean(result.is_featured);
    return result;
  }

  return null;
};

/**
 * Get wallpaper by GitHub ID
 */
export const getWallpaperByGithubId = (
  githubId: string,
): DatabaseWallpaper | null => {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM wallpapers WHERE github_id = ?');
  const result = stmt.get(githubId) as DatabaseWallpaper | undefined;

  if (result) {
    result.is_featured = Boolean(result.is_featured);
    return result;
  }

  return null;
};

/**
 * Create wallpaper
 */
export const createWallpaper = (
  wallpaper: Omit<DatabaseWallpaper, 'id' | 'created_at' | 'updated_at'>,
): DatabaseWallpaper => {
  const database = getDatabase();

  // Check if wallpaper already exists by github_id
  const existing = getWallpaperByGithubId(wallpaper.github_id);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const stmt = database.prepare(`
    INSERT INTO wallpapers (
      github_id, name, path, category_id, category_name, download_url, html_url,
      size, width, height, aspect_ratio, dominant_color, is_featured,
      download_count, view_count, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    wallpaper.width || null,
    wallpaper.height || null,
    wallpaper.aspect_ratio || null,
    wallpaper.dominant_color || null,
    wallpaper.is_featured ? 1 : 0, // Convert boolean to integer
    wallpaper.download_count || 0,
    wallpaper.view_count || 0,
    now,
    now,
  );

  // Get the created wallpaper
  const created = getWallpaperById(result.lastInsertRowid as number);
  if (!created) {
    throw new Error('Failed to create wallpaper');
  }

  return created;
};

/**
 * Update wallpaper
 */
export const updateWallpaper = (
  id: number,
  updates: Partial<Omit<DatabaseWallpaper, 'id' | 'created_at'>>,
): boolean => {
  const database = getDatabase();

  // Build dynamic update query
  const fields = Object.keys(updates).filter(
    (key) => key !== 'id' && key !== 'created_at',
  );
  if (fields.length === 0) return false;

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => {
    const value = updates[field as keyof typeof updates];
    // Convert booleans to integers for SQLite
    if (field === 'is_featured' && typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  });

  const stmt = database.prepare(`
    UPDATE wallpapers
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(...values, id);
  return result.changes > 0;
};

/**
 * Increment download count
 */
export const incrementDownloadCount = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(`
    UPDATE wallpapers
    SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Increment view count
 */
export const incrementViewCount = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(`
    UPDATE wallpapers
    SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Delete wallpaper
 */
export const deleteWallpaper = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM wallpapers WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Create multiple wallpapers in a transaction (for bulk imports)
 */
export const createMultipleWallpapers = (
  wallpapers: Omit<DatabaseWallpaper, 'id' | 'created_at' | 'updated_at'>[],
): boolean => {
  const database = getDatabase();
  const insert = database.prepare(`
    INSERT OR IGNORE INTO wallpapers (
      github_id, name, path, category_id, category_name, download_url, html_url,
      size, width, height, aspect_ratio, dominant_color, is_featured,
      download_count, view_count, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = database.transaction(
    (
      wallpaperItems: Omit<
        DatabaseWallpaper,
        'id' | 'created_at' | 'updated_at'
      >[],
    ) => {
      const now = new Date().toISOString();
      for (const wallpaper of wallpaperItems) {
        insert.run(
          wallpaper.github_id,
          wallpaper.name,
          wallpaper.path,
          wallpaper.category_id,
          wallpaper.category_name,
          wallpaper.download_url,
          wallpaper.html_url,
          wallpaper.size,
          wallpaper.width || null,
          wallpaper.height || null,
          wallpaper.aspect_ratio || null,
          wallpaper.dominant_color || null,
          wallpaper.is_featured ? 1 : 0,
          wallpaper.download_count || 0,
          wallpaper.view_count || 0,
          now,
          now,
        );
      }
    },
  );

  try {
    transaction(wallpapers);
    return true;
  } catch (error) {
    console.error('Failed to create multiple wallpapers:', error);
    return false;
  }
};
