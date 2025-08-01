import Database from 'better-sqlite3';

// Database configuration
const DB_PATH = 'data/wallpapers.db';

// Initialize database connection
let database: Database.Database | null = null;

/**
 * Get or create database connection
 */
export const getDb = (): Database.Database => {
  if (!database) {
    database = new Database(DB_PATH, { fileMustExist: false });

    // Enable WAL mode for better concurrency
    database.pragma('journal_mode = WAL');
    database.pragma('synchronous = NORMAL');

    initializeSchema();
  }
  return database;
};

/**
 * Initialize database schema
 */
const initializeSchema = (): void => {
  const database_ = getDb();

  // Create categories table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      description TEXT NOT NULL,
      wallpaper_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
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
      aspect_ratio TEXT CHECK(aspect_ratio IN ('portrait', 'landscape', 'square')),
      dominant_color TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );
  `);

  // Create sync metadata table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE,
      last_synced TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('pending', 'syncing', 'completed', 'failed')),
      wallpaper_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create analytics table
  database_.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      category TEXT,
      wallpaper_id INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallpaper_id) REFERENCES wallpapers (id) ON DELETE SET NULL
    );
  `);

  // Create indexes for performance
  database_.exec(`
    CREATE INDEX IF NOT EXISTS idx_wallpapers_category_id ON wallpapers(category_id);
    CREATE INDEX IF NOT EXISTS idx_wallpapers_is_featured ON wallpapers(is_featured);
    CREATE INDEX IF NOT EXISTS idx_wallpapers_download_count ON wallpapers(download_count DESC);
    CREATE INDEX IF NOT EXISTS idx_sync_meta_category ON sync_meta(category_name);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
  `);
};

/**
 * Close database connection
 */
export const closeDb = (): void => {
  if (database) {
    database.close();
    database = null;
  }
};
