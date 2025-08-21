import express from 'express'; // Import validation middleware\nimport { validateRequest, sanitizeInput } from '../middleware/validation';

import {
  getCategoryById,
  getCategoryBySlug,
  getWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
  getFeaturedWallpapers,
  createWallpaper,
  createMultipleWallpapers,
  updateWallpaper,
  incrementDownloadCount,
  incrementViewCount,
} from '@/lib/database';
import {
  getWallpapersByCategoryLimited as fetchWallpapersFromGitHub,
  getFeaturedWallpapers as fetchFeaturedFromGitHub,
} from '@/lib/github-api';

const router = express.Router();

/**
 * Helper function to convert WallpaperItem to DatabaseWallpaper format
 */
const convertWallpaperItemToDatabase = (
  wallpaper: any, // GitHub API wallpaper
  categoryId: number,
  categoryName: string,
  isFeatured: boolean = false,
) => ({
  id: 0, // Will be auto-generated
  github_id: wallpaper.sha,
  name: wallpaper.name,
  path: wallpaper.path,
  category_id: categoryId,
  category_name: categoryName,
  download_url: wallpaper.download_url,
  html_url: wallpaper.html_url,
  size: wallpaper.size,
  width: wallpaper.resolution?.width || null,
  height: wallpaper.resolution?.height || null,
  aspect_ratio: wallpaper.aspectRatio || null,
  dominant_color: wallpaper.dominantColor || null,
  is_featured: isFeatured,
  download_count: 0,
  view_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/**
 * GET /api/wallpapers
 * Get wallpapers with optional filtering
 */
router.get('/', async (request, res) => {
  try {
    const {
      categoryId,
      categoryName,
      isFeatured,
      search,
      orderBy,
      orderDirection,
      limit,
      offset,
    } = request.query;

    const filters = {
      categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
      categoryName: categoryName as string,
      isFeatured:
        isFeatured === 'true'
          ? true
          : isFeatured === 'false'
            ? false
            : undefined,
      search: search as string,
      orderBy: [
        'name',
        'size',
        'download_count',
        'view_count',
        'created_at',
      ].includes(orderBy as string)
        ? (orderBy as
            | 'name'
            | 'size'
            | 'download_count'
            | 'view_count'
            | 'created_at')
        : undefined,
      orderDirection: orderDirection as 'ASC' | 'DESC',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const wallpapers = getWallpapers(filters);

    res.json({
      success: true,
      data: wallpapers,
      count: wallpapers.length,
      filters,
    });
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallpapers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/wallpapers/featured
 * Get featured wallpapers (with GitHub API fallback)
 */
router.get('/featured', async (request, res) => {
  try {
    const limit = request.query.limit
      ? parseInt(request.query.limit as string, 10)
      : 18;

    // First try to get from database
    let wallpapers = getFeaturedWallpapers(limit);

    // If database is empty or has very few wallpapers, fetch from GitHub API
    if (wallpapers.length < Math.min(limit, 6)) {
      console.log(
        `🔄 Database has only ${wallpapers.length} featured wallpapers, fetching from GitHub API...`,
      );

      try {
        // Use conservative limit to avoid rate limits (featured pulls from multiple categories)
        const conservativeLimit = Math.min(limit, 9); // Max 9 to stay under rate limits
        const githubWallpapers =
          await fetchFeaturedFromGitHub(conservativeLimit);

        if (githubWallpapers.length > 0) {
          console.log(
            `📥 Fetched ${githubWallpapers.length} wallpapers from GitHub, caching to database...`,
          );

          // Cache the wallpapers in database (resolve category IDs)
          const wallpaperData = githubWallpapers
            .map((wallpaper) => {
              const category = getCategoryBySlug(wallpaper.category);
              return convertWallpaperItemToDatabase(
                wallpaper,
                category?.id || 0,
                wallpaper.category,
                true, // is_featured
              );
            })
            .filter((w) => w.category_id > 0); // Only cache wallpapers with valid categories

          if (wallpaperData.length > 0) {
            createMultipleWallpapers(wallpaperData);
          }

          // Convert GitHub data to database format for consistent response
          wallpapers = wallpaperData;
        }
      } catch (githubError) {
        console.warn('Failed to fetch from GitHub API:', githubError);
        // Continue with database results even if GitHub fails
      }
    }

    res.json({
      success: true,
      data: wallpapers,
      count: wallpapers.length,
    });
  } catch (error) {
    console.error('Error fetching featured wallpapers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured wallpapers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/wallpapers/category/:categoryId
 * Get wallpapers by category ID (with GitHub API fallback)
 *
 * NOTE: Currently implements lazy loading by limiting initial GitHub API fetches.
 * For full pagination, frontend should implement:
 * 1. Initial load from this endpoint (gets first 12-24 wallpapers)
 * 2. Subsequent loads can request more from GitHub API in batches
 * 3. Database serves as cache for already-fetched wallpapers
 */
router.get('/category/:categoryId', async (request, res) => {
  try {
    const categoryId = parseInt(request.params.categoryId, 10);
    const limit = request.query.limit
      ? parseInt(request.query.limit as string, 10)
      : undefined;

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID',
        message: 'Category ID must be a number',
      });
    }

    // Get category info
    const category = getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`,
      });
    }

    // First try to get from database
    let wallpapers = getWallpapersByCategory(categoryId, limit);

    // If database is empty for this category, fetch from GitHub API
    if (wallpapers.length === 0) {
      console.log(
        `🔄 No wallpapers found in database for category '${category.slug}', fetching from GitHub API...`,
      );

      try {
        // Use a reasonable limit for initial load to avoid rate limits
        const initialLimit = limit || 12; // Default to 12 wallpapers for initial load
        const githubWallpapers = await fetchWallpapersFromGitHub(
          category.slug,
          initialLimit,
        );

        if (githubWallpapers.length > 0) {
          console.log(
            `📥 Fetched ${githubWallpapers.length} wallpapers from GitHub for category '${category.slug}', caching to database...`,
          );

          // Cache the wallpapers in database
          const wallpaperData = githubWallpapers.map((wallpaper) =>
            convertWallpaperItemToDatabase(
              wallpaper,
              categoryId,
              category.name,
              false, // is_featured
            ),
          );

          createMultipleWallpapers(wallpaperData);

          // Convert GitHub data to database format for consistent response
          wallpapers = wallpaperData;
        }
      } catch (githubError) {
        console.warn(
          `Failed to fetch category '${category.slug}' from GitHub API:`,
          githubError,
        );
        // Continue with empty database results
      }
    }

    res.json({
      success: true,
      data: wallpapers,
      count: wallpapers.length,
      categoryId,
      categoryName: category.name,
    });
  } catch (error) {
    console.error('Error fetching wallpapers by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallpapers by category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/wallpapers/:id
 * Get wallpaper by ID
 */
router.get('/:id', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallpaper ID',
        message: 'Wallpaper ID must be a number',
      });
    }

    const wallpaper = getWallpaperById(id);

    if (!wallpaper) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found',
        message: `Wallpaper with ID ${id} does not exist`,
      });
    }

    res.json({
      success: true,
      data: wallpaper,
    });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallpaper',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/wallpapers
 * Create a new wallpaper
 */
router.post('/', async (request, res) => {
  try {
    const wallpaperData = request.body;

    // Basic validation
    const requiredFields = [
      'github_id',
      'name',
      'path',
      'category_id',
      'category_name',
      'download_url',
      'html_url',
      'size',
    ];
    const missingFields = requiredFields.filter(
      (field) => !wallpaperData[field],
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`,
      });
    }

    const wallpaper = createWallpaper(wallpaperData);

    res.status(201).json({
      success: true,
      data: wallpaper,
      message: 'Wallpaper created successfully',
    });
  } catch (error) {
    console.error('Error creating wallpaper:', error);

    // Handle duplicate github_id error
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return res.status(409).json({
        success: false,
        error: 'Wallpaper already exists',
        message: 'A wallpaper with this GitHub ID already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create wallpaper',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/wallpapers/bulk
 * Create multiple wallpapers in bulk
 */
router.post('/bulk', async (request, res) => {
  try {
    const { wallpapers } = request.body;

    if (!Array.isArray(wallpapers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'Expected an array of wallpapers',
      });
    }

    const success = createMultipleWallpapers(wallpapers);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Bulk creation failed',
        message: 'Failed to create wallpapers in bulk',
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${wallpapers.length} wallpapers`,
      count: wallpapers.length,
    });
  } catch (error) {
    console.error('Error creating wallpapers in bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create wallpapers in bulk',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/wallpapers/:id
 * Update a wallpaper
 */
router.put('/:id', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallpaper ID',
        message: 'Wallpaper ID must be a number',
      });
    }

    const updates = request.body;
    const success = updateWallpaper(id, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found',
        message: `Wallpaper with ID ${id} does not exist`,
      });
    }

    const updatedWallpaper = getWallpaperById(id);

    res.json({
      success: true,
      data: updatedWallpaper,
      message: 'Wallpaper updated successfully',
    });
  } catch (error) {
    console.error('Error updating wallpaper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wallpaper',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/wallpapers/:id/download
 * Increment download count
 */
router.post('/:id/download', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallpaper ID',
        message: 'Wallpaper ID must be a number',
      });
    }

    const success = incrementDownloadCount(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found',
        message: `Wallpaper with ID ${id} does not exist`,
      });
    }

    res.json({
      success: true,
      message: 'Download count incremented',
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment download count',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/wallpapers/:id/view
 * Increment view count
 */
router.post('/:id/view', async (request, res) => {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallpaper ID',
        message: 'Wallpaper ID must be a number',
      });
    }

    const success = incrementViewCount(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found',
        message: `Wallpaper with ID ${id} does not exist`,
      });
    }

    res.json({
      success: true,
      message: 'View count incremented',
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment view count',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
