// SQLite database connection with better-sqlite3
import { join } from 'path';

import Database from 'better-sqlite3';

// Database configuration
const DB_PATH = join(process.cwd(), 'data', 'wallpapers.db');
const DB_VERSION = 1;

// Singleton database instance
let database: Database.Database | null = null;

/**
 * Initialize database schema
 */
const initializeSchema = (): void => {
  const database_ = getDb();

  // Create categories table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      wallpaper_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create wallpapers table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS wallpapers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      download_url TEXT NOT NULL,
      html_url TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      aspect_ratio TEXT,
      dominant_color TEXT,
      is_featured INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `);

  // Create sync metadata table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('pending', 'syncing', 'completed', 'failed')),
      last_sync_at TEXT,
      wallpaper_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create analytics table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      wallpaper_id INTEGER,
      category_name TEXT,
      metadata TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallpaper_id) REFERENCES wallpapers (id) ON DELETE SET NULL
    )
  `);

  // Create performance indexes
  database_.exec(`
    CREATE INDEX IF NOT EXISTS idx_wallpapers_category_id ON wallpapers(category_id);
    CREATE INDEX IF NOT EXISTS idx_wallpapers_github_id ON wallpapers(github_id);
    CREATE INDEX IF NOT EXISTS idx_wallpapers_is_featured ON wallpapers(is_featured);
    CREATE INDEX IF NOT EXISTS idx_wallpapers_category_name ON wallpapers(category_name);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_sync_meta_category_name ON sync_meta(category_name);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_wallpaper_id ON analytics(wallpaper_id);
  `);
};

/**
 * Check and run database migrations
 */
const runMigrations = (): void => {
  const database_ = getDb();
  const version = database_.pragma('user_version', { simple: true }) as number;

  if (version < DB_VERSION) {
    console.log(
      `🔄 Running database migrations from v${version} to v${DB_VERSION}`,
    );

    // Future migrations would go here
    // if (version < 1) { /* migration code */ }
    // if (version < 2) { /* migration code */ }

    database_.pragma(`user_version = ${DB_VERSION}`);
    console.log(`✅ Database migrations completed to v${DB_VERSION}`);
  }
};

/**
 * Get database connection (singleton pattern with lazy initialization)
 */
export const getDb = (): Database.Database => {
  if (!database) {
    console.log(`📁 Connecting to SQLite database: ${DB_PATH}`);

    database = new Database(DB_PATH, {
      fileMustExist: false,
      timeout: 5000,
    });

    // Enable performance optimizations
    database.pragma('journal_mode = WAL');
    database.pragma('synchronous = NORMAL');
    database.pragma('cache_size = 1000');
    database.pragma('temp_store = memory');
    database.pragma('mmap_size = 268435456'); // 256MB

    // Initialize schema and run migrations
    initializeSchema();
    runMigrations();

    console.log('✅ SQLite database connected and initialized');
  }

  return database;
};

/**
 * Close database connection
 */
export const closeDb = (): void => {
  if (database) {
    database.close();
    database = null;
    console.log('📁 Database connection closed');
  }
};

/**
 * Create a backup of the database
 */
export const createBackup = (backupPath: string): boolean => {
  try {
    const database_ = getDb();
    database_.backup(backupPath);
    console.log(`💾 Database backed up to: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create database backup:', error);
    return false;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = () => {
  const database_ = getDb();

  const categoriesCount = database_
    .prepare('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };
  const wallpapersCount = database_
    .prepare('SELECT COUNT(*) as count FROM wallpapers')
    .get() as { count: number };
  const lastSyncResult = database_
    .prepare('SELECT MAX(last_synced) as lastSync FROM sync_meta')
    .get() as { lastSync: string | null };

  return {
    categories: categoriesCount.count,
    wallpapers: wallpapersCount.count,
    lastSync: lastSyncResult.lastSync,
    databasePath: DB_PATH,
    version: DB_VERSION,
  };
};

// Auto-close database on process exit
process.on('exit', closeDb);
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);
