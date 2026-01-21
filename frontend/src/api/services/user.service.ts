import apiClient from '../client';
import type { CreateUserDto, LoginDto, SignupResponse, LoginResponse, User, UserProfile, UserProfileUpdate } from '@/types/models/user';

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

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  },

  // Get all users (debug)
  async getAllUsers(skip: number = 0, limit: number = 100): Promise<{ total: number; users: User[] }> {
    const response = await apiClient.get<{ total: number; users: User[] }>('/api/v1/users', {
      params: { skip, limit }
    });
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
};

export type { CreateUserDto, LoginDto, SignupResponse, LoginResponse, UserProfile, UserProfileUpdate };

