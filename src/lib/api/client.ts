// API client for communicating with the backend server
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Generic API request handler
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error ${response.status}:`, data);
      return {
        success: false,
        error: data.error || 'Request failed',
        message: data.message || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

/**
 * API client methods
 */
export const apiClient = {
  // Categories
  categories: {
    getAll: (withCounts = false) =>
      apiRequest(`/categories${withCounts ? '?withCounts=true' : ''}`),

    getBySlug: (slug: string) =>
      apiRequest(`/categories/${slug}`),

    create: (data: any) =>
      apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: any) =>
      apiRequest(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateCount: (id: number, count: number) =>
      apiRequest(`/categories/${id}/count`, {
        method: 'PUT',
        body: JSON.stringify({ count }),
      }),
  },

  // Wallpapers
  wallpapers: {
    getAll: (filters: any = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiRequest(`/wallpapers${query}`);
    },

    getFeatured: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return apiRequest(`/wallpapers/featured${query}`);
    },

    getByCategory: (categoryId: number, limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return apiRequest(`/wallpapers/category/${categoryId}${query}`);
    },

    getById: (id: number) =>
      apiRequest(`/wallpapers/${id}`),

    create: (data: any) =>
      apiRequest('/wallpapers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createBulk: (wallpapers: any[]) =>
      apiRequest('/wallpapers/bulk', {
        method: 'POST',
        body: JSON.stringify({ wallpapers }),
      }),

    update: (id: number, data: any) =>
      apiRequest(`/wallpapers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    incrementDownload: (id: number) =>
      apiRequest(`/wallpapers/${id}/download`, {
        method: 'POST',
      }),

    incrementView: (id: number) =>
      apiRequest(`/wallpapers/${id}/view`, {
        method: 'POST',
      }),
  },

  // Sync operations
  sync: {
    getStatus: () =>
      apiRequest('/sync/status'),

    syncCategories: () =>
      apiRequest('/sync/categories', {
        method: 'POST',
      }),

    getMeta: () =>
      apiRequest('/sync/meta'),

    getMetaByCategory: (categoryName: string) =>
      apiRequest(`/sync/meta/${categoryName}`),

    updateMeta: (categoryName: string, data: any) =>
      apiRequest(`/sync/meta/${categoryName}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    importJson: (data: any) =>
      apiRequest('/sync/import/json', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    importFile: (filePath: string) =>
      apiRequest('/sync/import/file', {
        method: 'POST',
        body: JSON.stringify({ filePath }),
      }),

    clearDatabase: () =>
      apiRequest('/sync/clear', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: 'CLEAR_ALL_DATA' }),
      }),
  },

  // Analytics
  analytics: {
    getStats: () =>
      apiRequest('/analytics/stats'),

    getEvents: (filters: any = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiRequest(`/analytics/events${query}`);
    },

    getSummary: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiRequest(`/analytics/summary${query}`);
    },

    trackEvent: (data: any) =>
      apiRequest('/analytics/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cleanup: (olderThanDays: number) =>
      apiRequest('/analytics/cleanup', {
        method: 'DELETE',
        body: JSON.stringify({ olderThanDays }),
      }),
  },
};

export default apiClient;
