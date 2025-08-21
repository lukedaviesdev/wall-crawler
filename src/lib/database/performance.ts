// Database performance monitoring and optimization utilities
import { getDb as getDatabase } from './connection';

export interface QueryPerformance {
  query: string;
  executionTime: number;
  rowsAffected?: number;
  timestamp: string;
}

// Simple query performance tracker
export class DatabasePerformanceMonitor {
  private static queries: QueryPerformance[] = [];
  private static maxLogEntries = 100;

  static logQuery(query: string, startTime: number, rowsAffected?: number) {
    const executionTime = Date.now() - startTime;

    // Only log slow queries (> 100ms) in production
    if (process.env.NODE_ENV === 'production' && executionTime < 100) {
      return;
    }

    this.queries.push({
      query: query.replace(/\s+/g, ' ').trim(),
      executionTime,
      rowsAffected,
      timestamp: new Date().toISOString(),
    });

    // Keep only recent entries
    if (this.queries.length > this.maxLogEntries) {
      this.queries = this.queries.slice(-this.maxLogEntries);
    }

    // Log slow queries
    if (executionTime > 1000) {
      console.warn(`🐌 Slow query detected: ${executionTime}ms - ${query}`);
    }
  }

  static getSlowQueries(threshold = 100): QueryPerformance[] {
    return this.queries.filter((q) => q.executionTime > threshold);
  }

  static getAverageExecutionTime(): number {
    if (this.queries.length === 0) return 0;
    const total = this.queries.reduce((sum, q) => sum + q.executionTime, 0);
    return total / this.queries.length;
  }

  static reset() {
    this.queries = [];
  }
}

// Enhanced prepared statement wrapper with performance monitoring
export const createPerformantQuery = <T = any>(sql: string) => {
  const database = getDatabase();
  const stmt = database.prepare(sql);

  return {
    get: (parameters?: any): T | undefined => {
      const startTime = Date.now();
      const result = stmt.get(parameters) as T | undefined;
      DatabasePerformanceMonitor.logQuery(sql, startTime, result ? 1 : 0);
      return result;
    },

    all: (parameters?: any): T[] => {
      const startTime = Date.now();
      const results = stmt.all(parameters) as T[];
      DatabasePerformanceMonitor.logQuery(sql, startTime, results.length);
      return results;
    },

    run: (parameters?: any) => {
      const startTime = Date.now();
      const result = stmt.run(parameters);
      DatabasePerformanceMonitor.logQuery(sql, startTime, result.changes);
      return result;
    },
  };
};

// Database optimization utilities
export const optimizeDatabase = () => {
  const database = getDatabase();

  console.log('🔧 Running database optimization...');

  // Analyze tables and update query planner statistics
  database.exec('ANALYZE');

  // Vacuum database to reclaim space and reorganize
  database.exec('VACUUM');

  // Update table statistics
  database.exec('UPDATE sqlite_stat1 SET stat = stat');

  console.log('✅ Database optimization completed');
};

// Get database performance metrics
export const getDatabaseMetrics = () => {
  const database = getDatabase();

  // Cache hit ratio
  const cacheInfo = database.pragma('cache_size', { simple: true });

  // WAL mode info
  const walInfo = database.pragma('wal_checkpoint', { simple: true });

  // Database size
  const sizeInfo = database.pragma('page_count', { simple: true }) as number;
  const pageSize = database.pragma('page_size', { simple: true }) as number;

  return {
    cacheSize: cacheInfo,
    walCheckpoint: walInfo,
    databaseSizeKB: Math.round((sizeInfo * pageSize) / 1024),
    slowQueries: DatabasePerformanceMonitor.getSlowQueries(),
    averageQueryTime: DatabasePerformanceMonitor.getAverageExecutionTime(),
  };
};

// Common optimized queries
export const optimizedQueries = {
  // Get wallpapers with category info in single query
  getWallpapersWithCategory: createPerformantQuery<{
    id: number;
    name: string;
    category_name: string;
    download_url: string;
    is_featured: number;
  }>(`
    SELECT 
      w.id, w.name, w.category_name, w.download_url, w.is_featured,
      c.slug as category_slug
    FROM wallpapers w
    INNER JOIN categories c ON w.category_id = c.id
    ORDER BY w.created_at DESC
    LIMIT ?
  `),

  // Count queries for pagination
  countWallpapersByCategory: createPerformantQuery<{ count: number }>(`
    SELECT COUNT(*) as count 
    FROM wallpapers 
    WHERE category_id = ?
  `),

  // Search with full-text capabilities
  searchWallpapers: createPerformantQuery<{
    id: number;
    name: string;
    category_name: string;
  }>(`
    SELECT id, name, category_name
    FROM wallpapers 
    WHERE name LIKE ? OR category_name LIKE ?
    ORDER BY 
      CASE 
        WHEN name LIKE ? THEN 1
        WHEN category_name LIKE ? THEN 2
        ELSE 3
      END,
      download_count DESC
    LIMIT ?
  `),

  // Batch update for view counts
  batchUpdateViewCounts: createPerformantQuery(`
    UPDATE wallpapers 
    SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${Array(10).fill('?').join(',')})
  `),
};
