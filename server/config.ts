// Server configuration
export const config = {
  // Server settings
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Frontend settings
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database settings
  dbPath: process.env.DB_PATH || './data/wallpapers.db',

  // GitHub API settings
  githubToken: process.env.GITHUB_TOKEN,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;
