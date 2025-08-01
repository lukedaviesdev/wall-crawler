import { getDb as getDatabase } from './connection';

import type { DatabaseCategory } from '@/types/database';

/**
 * Get all categories
 */
export const getCategories = (): DatabaseCategory[] => {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM categories ORDER BY name ASC');
  return stmt.all() as DatabaseCategory[];
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = (slug: string): DatabaseCategory | null => {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM categories WHERE slug = ?');
  return (stmt.get(slug) as DatabaseCategory) || null;
};

/**
 * Create new category
 */
export const createCategory = (
  category: Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'>,
): DatabaseCategory => {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO categories (name, slug, path, description, wallpaper_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    category.name,
    category.slug,
    category.path,
    category.description,
    category.wallpaper_count,
  );

  // Get the created category
  const getCategoryStmt = database.prepare(
    'SELECT * FROM categories WHERE id = ?',
  );
  return getCategoryStmt.get(result.lastInsertRowid) as DatabaseCategory;
};

/**
 * Update category wallpaper count
 */
export const updateCategoryCount = (
  categoryId: number,
  count: number,
): boolean => {
  const database = getDatabase();
  const stmt = database.prepare(`
    UPDATE categories
    SET wallpaper_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(count, categoryId);
  return result.changes > 0;
};
