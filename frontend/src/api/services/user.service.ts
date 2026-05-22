import apiClient from '../client';
import type { CreateUserDto, LoginDto, SignupResponse, LoginResponse, User, UserProfile, UserProfileUpdate, GetUsersResponse } from '@/types/models/user';

export interface GetUsersFilters {
  skip?: number;
  limit?: number;
  is_admin?: boolean;
  is_internal?: boolean;
  registration_status?: 'pending_mfa' | 'completed';
  search?: string;
}

export const userService = {
  // Register/Signup a new user
  async signup(userData: CreateUserDto): Promise<SignupResponse> {
    const response = await apiClient.post<SignupResponse>('/api/v1/saveuser', userData);
    return response.data;
  },

  // Login user (sign_in)
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/sign_in', credentials);
    return response.data;
  },

  /** Exchange Azure AD ID token (from MSAL) for app JWT — internal users only. */
  async loginWithAzure(idToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/azure/token', {
      id_token: idToken,
    });
    return response.data;
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  },

  // Get all users with filters
  async getAllUsers(filters?: GetUsersFilters): Promise<GetUsersResponse> {
    const params: any = {
      skip: filters?.skip || 0,
      limit: filters?.limit || 100,
    };
    
    if (filters?.is_admin !== undefined) {
      params.is_admin = filters.is_admin;
    }
    if (filters?.is_internal !== undefined) {
      params.is_internal = filters.is_internal;
    }
    if (filters?.registration_status) {
      params.registration_status = filters.registration_status;
    }
    if (filters?.search) {
      params.search = filters.search;
    }
    
    const response = await apiClient.get<GetUsersResponse>('/api/v1/users', { params });
    return response.data;
  },

  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/v1/profile');
    return response.data;
  },

  // Update current user profile
  async updateProfile(profileData: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/api/v1/profile', profileData);
    return response.data;
  },

  // Toggle admin status for internal user
  async toggleAdminStatus(userId: string, isAdmin: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/api/v1/users/${userId}/admin-status`,
      null,
      { params: { is_admin: isAdmin } }
    );
    return response.data;
  },

  // Toggle block status for user
  async toggleBlockStatus(userId: string, isBlocked: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/api/v1/users/${userId}/block-status`,
      null,
      { params: { is_blocked: isBlocked } }
    );
    return response.data;
  },

  // Soft delete a user
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/users/${userId}`
    );
    return response.data;
  },
};

export type { CreateUserDto, LoginDto, SignupResponse, LoginResponse, UserProfile, UserProfileUpdate };

