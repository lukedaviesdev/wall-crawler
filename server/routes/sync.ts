import express from 'express';

import {
  importFromJson,
  importFromFile,
  clearDatabase,
  updateSyncMeta,
  getSyncMeta,
  getAllSyncMeta,
  getSyncStatus,
  getStats,
  syncCategories,
  getSyncStatus as getSyncOperationStatus,
} from '@/lib/database';

const router = express.Router();

/**
 * GET /api/sync/status
 * Get overall sync status
 */
router.get('/status', async (_request, res) => {
  try {
    const operationStatus = getSyncOperationStatus();
    const syncStatuses = getSyncStatus();
    const stats = getStats();

    res.json({
      success: true,
      data: {
        operation: operationStatus,
        categories: syncStatuses,
        stats,
      },
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/categories
 * Sync categories from GitHub
 */
router.post('/categories', async (_request, res) => {
  try {
    console.log('🔄 Starting category sync via API...');
    const result = await syncCategories();

    res.json({
      success: true,
      data: result,
      message: 'Category sync completed',
    });
  } catch (error) {
    console.error('Error syncing categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync categories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/meta
 * Get all sync metadata
 */
router.get('/meta', async (_request, res) => {
  try {
    const syncMeta = getAllSyncMeta();

    res.json({
      success: true,
      data: syncMeta,
      count: syncMeta.length,
    });
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/meta/:categoryName
 * Get sync metadata for specific category
 */
router.get('/meta/:categoryName', async (request, res) => {
  try {
    const { categoryName } = request.params;
    const syncMeta = getSyncMeta(categoryName);

    if (!syncMeta) {
      return res.status(404).json({
        success: false,
        error: 'Sync metadata not found',
        message: `No sync metadata found for category "${categoryName}"`,
      });
    }

    res.json({
      success: true,
      data: syncMeta,
    });
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/sync/meta/:categoryName
 * Update sync metadata for category
 */
router.put('/meta/:categoryName', async (request, res) => {
  try {
    const { categoryName } = request.params;
    const { status, count, error } = request.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'status is required',
      });
    }

    const validStatuses = ['pending', 'syncing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const success = updateSyncMeta(categoryName, status, count, error);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update sync metadata',
        message: 'Database update failed',
      });
    }

    const updatedMeta = getSyncMeta(categoryName);

    res.json({
      success: true,
      data: updatedMeta,
      message: 'Sync metadata updated successfully',
    });
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sync metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/import/json
 * Import data from JSON payload
 */
router.post('/import/json', async (request, res) => {
  try {
    const data = request.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'Expected JSON object with categories, wallpapers, etc.',
      });
    }

    console.log('📥 Starting data import from JSON payload...');
    const result = await importFromJson(data);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Import failed',
        message: 'Failed to import data',
        details: result.errors,
      });
    }

    res.json({
      success: true,
      data: {
        categoriesImported: result.categoriesImported,
        wallpapersImported: result.wallpapersImported,
        syncMetaImported: result.syncMetaImported,
        errors: result.errors,
      },
      message: 'Data imported successfully',
    });
  } catch (error) {
    console.error('Error importing JSON data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/import/file
 * Import data from file path
 */
router.post('/import/file', async (request, res) => {
  try {
    const { filePath } = request.body;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path',
        message: 'filePath is required and must be a string',
      });
    }

    console.log(`📁 Starting data import from file: ${filePath}`);
    const result = await importFromFile(filePath);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Import failed',
        message: 'Failed to import data from file',
        details: result.errors,
      });
    }

    res.json({
      success: true,
      data: {
        categoriesImported: result.categoriesImported,
        wallpapersImported: result.wallpapersImported,
        syncMetaImported: result.syncMetaImported,
        errors: result.errors,
      },
      message: 'Data imported successfully from file',
    });
  } catch (error) {
    console.error('Error importing file data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import data from file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/sync/clear
 * Clear all database data
 */
router.delete('/clear', async (request, res) => {
  try {
    const { confirm } = request.body;

    if (confirm !== 'CLEAR_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required',
        message: 'Set confirm to "CLEAR_ALL_DATA" to proceed',
      });
    }

    console.log('🗑️ Clearing all database data...');
    const success = clearDatabase();

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to clear database',
        message: 'Database clear operation failed',
      });
    }

    res.json({
      success: true,
      message: 'Database cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear database',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
