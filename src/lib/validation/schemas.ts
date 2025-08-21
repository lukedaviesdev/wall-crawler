// Input validation schemas for API security

// Simple validation functions (no external dependencies)
export const validators = {
  // String validation
  isString: (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0,

  // Number validation
  isPositiveInteger: (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value > 0,

  // Safe integer validation (prevents overflow)
  isSafeInteger: (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value),

  // Slug validation (alphanumeric with hyphens)
  isValidSlug: (value: unknown): value is string =>
    typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),

  // URL validation (basic)
  isValidUrl: (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // Search query validation (prevent injection)
  isValidSearchQuery: (value: unknown): value is string =>
    typeof value === 'string' &&
    value.length >= 2 &&
    value.length <= 100 &&
    !/[<>'"&;]/.test(value), // Basic XSS prevention

  // File path validation (prevent path traversal)
  isSafeFilePath: (value: unknown): value is string =>
    typeof value === 'string' &&
    !value.includes('../') &&
    !value.includes('..\\') &&
    !/^\//.test(value) && // No absolute paths
    value.length < 500,

  // GitHub SHA validation
  isValidGitHubSha: (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f0-9]{40}$/.test(value),

  // Pagination validation
  isValidPagination: (page?: unknown, limit?: unknown) => {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 50;

    return {
      isValid: pageNumber >= 1 && limitNumber >= 1 && limitNumber <= 100,
      page: Math.max(1, pageNumber),
      limit: Math.min(100, Math.max(1, limitNumber)),
    };
  },
};

// Request validation schemas
export const requestSchemas = {
  // Wallpaper query parameters
  wallpaperQuery: (query: Record<string, unknown>) => {
    const errors: string[] = [];
    const validated: Record<string, unknown> = {};

    // Category validation
    if (query.categoryName !== undefined) {
      if (!validators.isValidSlug(query.categoryName)) {
        errors.push('Invalid category name format');
      } else {
        validated.categoryName = query.categoryName;
      }
    }

    // Search validation
    if (query.search !== undefined) {
      if (!validators.isValidSearchQuery(query.search)) {
        errors.push('Invalid search query');
      } else {
        validated.search = query.search;
      }
    }

    // Pagination validation
    const pagination = validators.isValidPagination(query.page, query.limit);
    if (!pagination.isValid) {
      errors.push('Invalid pagination parameters');
    } else {
      validated.page = pagination.page;
      validated.limit = pagination.limit;
    }

    // Featured filter
    if (query.isFeatured !== undefined) {
      const featured = query.isFeatured === 'true' || query.isFeatured === true;
      validated.isFeatured = featured;
    }

    return { isValid: errors.length === 0, validated, errors };
  },

  // Category parameters
  categoryParams: (parameters: Record<string, unknown>) => {
    const errors: string[] = [];

    if (parameters.slug && !validators.isValidSlug(parameters.slug)) {
      errors.push('Invalid category slug format');
    }

    if (parameters.id && !validators.isPositiveInteger(Number(parameters.id))) {
      errors.push('Invalid category ID');
    }

    return { isValid: errors.length === 0, errors };
  },

  // Wallpaper creation validation
  wallpaperCreate: (data: Record<string, unknown>) => {
    const errors: string[] = [];
    const required = ['name', 'path', 'category_id', 'download_url'];

    // Check required fields
    for (const field of required) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate specific fields
    if (data.name && !validators.isString(data.name)) {
      errors.push('Invalid name format');
    }

    if (data.download_url && !validators.isValidUrl(data.download_url)) {
      errors.push('Invalid download URL');
    }

    if (
      data.category_id &&
      !validators.isPositiveInteger(Number(data.category_id))
    ) {
      errors.push('Invalid category ID');
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Security headers and CORS configuration
export const securityConfig = {
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS configuration
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com'] // Replace with actual domain
        : true, // Allow all origins in development
    credentials: false, // No cookies needed
    optionsSuccessStatus: 200,
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';",
  },
};
