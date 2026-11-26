import { apiClient } from './client';
import {
  AuthResponse,
  ChangePasswordPayload,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  User,
} from '../types/user';

export const authApi = {
  async register(data: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register/', data);
    return response.data;
  },

  async login(data: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', data);
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', { refresh: refreshToken });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  },

  async updateProfile(data: ProfileUpdatePayload): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile/', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordPayload): Promise<{ detail: string }> {
    const response = await apiClient.post<{ detail: string }>('/auth/change-password/', data);
    return response.data;
  },
};
