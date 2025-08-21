import express from 'express';

import {
  trackEvent,
  getAnalytics,
  getAnalyticsSummary,
  cleanupAnalytics,
  getStats,
  getCategoryStats,
} from '@/lib/database';

const router = express.Router();

/**
 * GET /api/analytics/stats
 * Get database statistics
 */
router.get('/stats', async (_request, res) => {
  try {
    const stats = getStats();
    const categoryStats = getCategoryStats();

    res.json({
      success: true,
      data: {
        overview: stats,
        categories: categoryStats,
      },
    });
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/events
 * Get analytics events with optional filtering
 */
router.get('/events', async (request, res) => {
  try {
    const { eventType, categoryName, limit, startDate, endDate } =
      request.query;

    const events = getAnalytics(
      eventType as string,
      categoryName as string,
      limit ? parseInt(limit as string, 10) : undefined,
      startDate as string,
      endDate as string,
    );

    res.json({
      success: true,
      data: events,
      count: events.length,
      filters: {
        eventType,
        categoryName,
        limit,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error getting analytics events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/summary
 * Get analytics summary by event type
 */
router.get('/summary', async (request, res) => {
  try {
    const { startDate, endDate } = request.query;

    const summary = getAnalyticsSummary(startDate as string, endDate as string);

    res.json({
      success: true,
      data: summary,
      count: summary.length,
      filters: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analytics/events
 * Track a new analytics event
 */
router.post('/events', async (request, res) => {
  try {
    const { eventType, categoryName, wallpaperId, metadata } = request.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'eventType is required',
      });
    }

    const success = trackEvent(eventType, categoryName, wallpaperId, metadata);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to track event',
        message: 'Database insert failed',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      data: {
        eventType,
        categoryName,
        wallpaperId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/analytics/cleanup
 * Clean up old analytics data
 */
router.delete('/cleanup', async (request, res) => {
  try {
    const { olderThanDays } = request.body;

    if (
      !olderThanDays ||
      typeof olderThanDays !== 'number' ||
      olderThanDays < 1
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid olderThanDays',
        message: 'olderThanDays must be a positive number',
      });
    }

    const deletedCount = cleanupAnalytics(olderThanDays);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old analytics records`,
      data: {
        deletedCount,
        olderThanDays,
      },
    });
  } catch (error) {
    console.error('Error cleaning up analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
