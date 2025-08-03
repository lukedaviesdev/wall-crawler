import { getDb as getDatabase } from './connection';

import type { DatabaseCategory } from '@/types/database';

/**
 * Get all categories sorted by name
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
  const result = stmt.get(slug) as DatabaseCategory | undefined;
  return result || null;
};

/**
 * Get category by ID
 */
export const getCategoryById = (id: number): DatabaseCategory | null => {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM categories WHERE id = ?');
  const result = stmt.get(id) as DatabaseCategory | undefined;
  return result || null;
};

/**
 * Create new category
 */
export const createCategory = (
  category: Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'>,
): DatabaseCategory => {
  const database = getDatabase();

  // Check if category already exists
  const existing = getCategoryBySlug(category.slug);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const stmt = database.prepare(`
    INSERT INTO categories (slug, name, path, description, wallpaper_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    category.slug,
    category.name,
    category.path,
    category.description || null,
    category.wallpaper_count || 0,
    now,
    now,
  );

  // Get the created category
  const created = getCategoryById(result.lastInsertRowid as number);
  if (!created) {
    throw new Error('Failed to create category');
  }

  return created;
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

/**
 * Update category
 */
export const updateCategory = (
  id: number,
  updates: Partial<Omit<DatabaseCategory, 'id' | 'created_at'>>,
): boolean => {
  const database = getDatabase();

  // Build dynamic update query
  const fields = Object.keys(updates).filter(
    (key) => key !== 'id' && key !== 'created_at',
  );
  if (fields.length === 0) return false;

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => updates[field as keyof typeof updates]);

  const stmt = database.prepare(`
    UPDATE categories
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(...values, id);
  return result.changes > 0;
};

/**
 * Delete category
 */
export const deleteCategory = (id: number): boolean => {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Get categories with wallpaper counts
 */
export const getCategoriesWithCounts = (): DatabaseCategory[] => {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT
      c.*,
      COUNT(w.id) as actual_count
    FROM categories c
    LEFT JOIN wallpapers w ON c.id = w.category_id
    GROUP BY c.id
    ORDER BY c.name ASC
  `);

  return stmt.all() as DatabaseCategory[];
};
