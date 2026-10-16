/**
 * Environment configuration helper for Dual-Mode integration.
 * In development and production, VITE_USE_MOCK controls whether
 * to make real HTTP API calls or fallback to in-memory mock datasets.
 */

export const isMockEnabled = (): boolean => {
  // In test runner (Vitest/Jest), always use mock datasets for isolation and speed
  if (import.meta.env.MODE === 'test') {
    return true;
  }
  return import.meta.env.VITE_USE_MOCK === 'true';
};

export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '/api/v1';
};

export const getDefaultAuthPassword = (): string => {
  return import.meta.env.VITE_DEFAULT_AUTH_PASSWORD || 'Admin@123';
};
