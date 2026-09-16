import apiClient from './client';
import type { Force } from '@/lib/platform/forces';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  badgeNumber: string;
  stationId: string;
  stationName: string;
  districtId?: string;
  districtName?: string;
  stateId?: string;
  stateName?: string;
  /**
   * The officer's department, joined from the `forces` table. Optional: an API
   * older than the departments sends neither field, and the interface has to
   * keep working against one.
   */
  forceId?: string;
  force?: Force;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearTokens();
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/me');
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/me/password', { oldPassword, newPassword });
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiClient.put<User>('/me', data);
  },
};

export default authApi;
