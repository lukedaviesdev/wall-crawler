import express from 'express';
import {
  getWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
  getFeaturedWallpapers,
  createWallpaper,
  createMultipleWallpapers,
  updateWallpaper,
  incrementDownloadCount,
  incrementViewCount,
} from '@/lib/database/wallpapers';

const router = express.Router();

/**
 * GET /api/wallpapers
 * Get wallpapers with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      categoryName,
      isFeatured,
      search,
      orderBy,
      orderDirection,
      limit,
    } = req.query;

    const filters = {
      categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
      categoryName: categoryName as string,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      search: search as string,
      orderBy: ['name', 'size', 'download_count', 'view_count', 'created_at'].includes(orderBy as string)
        ? (orderBy as 'name' | 'size' | 'download_count' | 'view_count' | 'created_at')
        : undefined,
      orderDirection: orderDirection as 'ASC' | 'DESC',
      limit: limit ? parseInt(limit as string, 10) : undefined,
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
 * Get featured wallpapers
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const wallpapers = getFeaturedWallpapers(limit);

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
 * Get wallpapers by category ID
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID',
        message: 'Category ID must be a number',
      });
    }

    const wallpapers = getWallpapersByCategory(categoryId, limit);

    res.json({
      success: true,
      data: wallpapers,
      count: wallpapers.length,
      categoryId,
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
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

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
router.post('/', async (req, res) => {
  try {
    const wallpaperData = req.body;

    // Basic validation
    const requiredFields = ['github_id', 'name', 'path', 'category_id', 'category_name', 'download_url', 'html_url', 'size'];
    const missingFields = requiredFields.filter(field => !wallpaperData[field]);

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
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
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
router.post('/bulk', async (req, res) => {
  try {
    const { wallpapers } = req.body;

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
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallpaper ID',
        message: 'Wallpaper ID must be a number',
      });
    }

    const updates = req.body;
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
router.post('/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

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
router.post('/:id/view', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

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
