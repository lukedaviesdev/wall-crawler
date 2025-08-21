import { requestSchemas, validators } from '@/lib/validation/schemas';

import type { Request, Response, NextFunction } from 'express';

// Request validation middleware factory
export const validateRequest = (
  schema: 'wallpaperQuery' | 'categoryParams' | 'wallpaperCreate',
) => {
  return (request: Request, res: Response, next: NextFunction) => {
    let validation;

    switch (schema) {
      case 'wallpaperQuery':
        validation = requestSchemas.wallpaperQuery(request.query);
        break;
      case 'categoryParams':
        validation = requestSchemas.categoryParams(request.params);
        break;
      case 'wallpaperCreate':
        validation = requestSchemas.wallpaperCreate(request.body);
        break;
      default:
        return res.status(500).json({
          success: false,
          error: 'Invalid validation schema',
        });
    }

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Attach validated data to request for use in handlers
    if ('validated' in validation) {
      request.query = { ...request.query, ...validation.validated };
    }

    next();
  };
};

// Sanitize input middleware
export const sanitizeInput = (
  request: Request,
  res: Response,
  next: NextFunction,
) => {
  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      // Basic XSS prevention - strip dangerous characters
      return value
        .replace(/[<>'"&]/g, '')
        .trim()
        .slice(0, 1000); // Limit length
    }
    return value;
  };

  // Sanitize query parameters
  for (const [key, value] of Object.entries(request.query)) {
    request.query[key] = sanitizeValue(value);
  }

  // Sanitize body parameters
  if (request.body && typeof request.body === 'object') {
    for (const [key, value] of Object.entries(request.body)) {
      request.body[key] = sanitizeValue(value);
    }
  }

  next();
};

// Rate limiting tracking middleware
export const trackApiUsage = (
  request: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log API usage for monitoring
  const timestamp = new Date().toISOString();
  const ip = request.ip || request.connection.remoteAddress;
  const userAgent = request.get('User-Agent');
  const endpoint = `${request.method} ${request.path}`;

  // Simple logging (in production, use proper logging service)
  console.log(`[${timestamp}] API: ${endpoint} | IP: ${ip} | UA: ${userAgent}`);

  next();
};

// Security headers middleware
export const securityHeaders = (
  request: Request,
  res: Response,
  next: NextFunction,
) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP for API responses
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none';",
  );

  next();
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  request: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('API Error:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  });
};
