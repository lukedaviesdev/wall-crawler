import express from 'express';

import {
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryCount,
  getCategoriesWithCounts,
} from '@/lib/database';
import { getCategories as fetchCategoriesFromGitHub } from '@/lib/github-api';

const router = express.Router();

/**
 * GET /api/categories
 * Get all categories - fallback to GitHub API if database is empty
 */
router.get('/', async (request, res) => {
  try {
    const withCounts = request.query.withCounts === 'true';

    // First try to get from database
    let categories = withCounts ? getCategoriesWithCounts() : getCategories();

    // If database is empty, fetch from GitHub API and populate database
    if (categories.length === 0) {
      console.log('🔄 Database empty, fetching categories from GitHub API...');

      try {
        const githubCategories = await fetchCategoriesFromGitHub();
        console.log(
          `📥 Found ${githubCategories.length} categories from GitHub`,
        );

        // Save categories to database
        for (const category of githubCategories) {
          try {
            createCategory({
              slug: category.slug,
              name: category.name,
              path: category.path,
              description: category.description || '',
              wallpaper_count: category.wallpaperCount || 0,
            });
          } catch (databaseError) {
            // Skip duplicates or other errors
            console.warn(
              `Warning: Could not save category ${category.slug}:`,
              databaseError,
            );
          }
        }

        // Now get from database with updated data
        categories = withCounts ? getCategoriesWithCounts() : getCategories();
        console.log('✅ Categories populated in database');
      } catch (githubError) {
        console.error('⚠️ Failed to fetch from GitHub API:', githubError);
        // Return empty array if GitHub API fails
        categories = [];
      }
    }

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/categories/:slug
 * Get category by slug
 */
router.get('/:slug', async (request, res) => {
  try {
    const { slug } = request.params;
    const category = getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with slug "${slug}" does not exist`,
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/', async (request, res) => {
  try {
    const { slug, name, path, description, wallpaper_count } = request.body;

    // Validation
    if (!slug || !name || !path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'slug, name, and path are required',
      });
    }

    const categoryData = {
      slug,
      name,
      path,
      description: description || `${name} wallpapers`,
      wallpaper_count: wallpaper_count || 0,
    };

    const category = createCategory(categoryData);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);

    // Handle duplicate slug error
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return res.status(409).json({
        success: false,
        error: 'Category already exists',
        message: 'A category with this slug already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put('/:id', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID',
        message: 'Category ID must be a number',
      });
    }

    const updates = request.body;
    const success = updateCategory(id, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${id} does not exist`,
      });
    }

    const updatedCategory = getCategoryById(id);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/categories/:id/count
 * Update category wallpaper count
 */
router.put('/:id/count', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);
    const { count } = request.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID',
        message: 'Category ID must be a number',
      });
    }

    if (typeof count !== 'number' || count < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid count',
        message: 'Count must be a non-negative number',
      });
    }

    const success = updateCategoryCount(id, count);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${id} does not exist`,
      });
    }

    res.json({
      success: true,
      message: 'Category count updated successfully',
    });
  } catch (error) {
    console.error('Error updating category count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category count',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
