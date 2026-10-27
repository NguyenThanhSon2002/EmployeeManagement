import { api } from '@/shared/api/apiClient';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  roles: string[];
  employee_id?: number;
  full_name?: string;
  must_change_password?: boolean;
  branch_id?: number;
  branch_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export const authService = {
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  async getCurrentUser(): Promise<UserInfo> {
    return api.get<UserInfo>('/auth/me');
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Không có refresh token');
    }
    const data = await api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return api.post<void>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
