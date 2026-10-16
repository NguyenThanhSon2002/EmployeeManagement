/**
 * Core API Client for Frontend-Backend Communication
 * Handles Base URL, Headers, Bearer Token injection, and Uniform Envelope parsing.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp?: string;
    request_id?: string;
    pagination?: {
      page: number;
      size: number;
      total_elements: number;
      total_pages: number;
      has_next?: boolean;
      has_previous?: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; rejected_value: unknown; message: string }>;
  };
}

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ field: string; rejected_value: unknown; message: string }>;

  constructor(status: number, code: string, message: string, details?: Array<{ field: string; rejected_value: unknown; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle blob/download responses
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('spreadsheetml') || contentType.includes('octet-stream') || contentType.includes('text/csv'))) {
    if (!response.ok) {
      throw new ApiError(response.status, 'DOWNLOAD_FAILED', 'Không thể tải file báo cáo');
    }
    const blob = await response.blob();
    return blob as unknown as T;
  }

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as unknown as T,
    error: {
      code: 'PARSE_ERROR',
      message: 'Không thể phân tích dữ liệu JSON từ máy chủ',
    },
  }));

  if (!response.ok || !data.success) {
    const error = data.error || {
      code: 'UNKNOWN_ERROR',
      message: response.statusText || 'Đã xảy ra lỗi không xác định',
    };
    throw new ApiError(response.status, error.code, error.message, error.details);
  }

  return data.data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
