import { useState } from 'react';
import { userService } from '@/api/services/user.service';
import type { User, SignupResponse } from '@/types/models/user';

interface UseAuthReturn {
  user: User | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
  signup: (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string,
    company: string,
    jobFunction: string,
    businessPhone: string,
    country: string
  ) => Promise<{ success: boolean; data?: SignupResponse; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresTotp?: boolean; sessionToken?: string; isAdmin?: boolean; isInternal?: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string,
    company: string,
    jobFunction: string,
    businessPhone: string,
    country: string
  ): Promise<{ success: boolean; data?: SignupResponse; error?: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.signup({
        first_name: firstName,
        last_name: lastName,
        user_email: email,
        user_password: password,
        company: company,
        job_function: jobFunction,
        business_phone: businessPhone,
        country: country,
      });
      
      // Store user ID from response
      setUserId(response.user_id);
      localStorage.setItem('userId', response.user_id);
      
      setLoading(false);
      
      // UPDATED: Return full response data (includes totp_setup)
      return { success: true, data: response };
    } catch (err: unknown) {
      const errorMessage = (err as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.detail || (err as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; requiresTotp?: boolean; sessionToken?: string; isAdmin?: boolean; isInternal?: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.login({
        user_email: email,
        user_password: password,
      });
      
      // Check if TOTP verification is required
      if (response.requires_totp) {
        // Don't store tokens yet - need TOTP verification first
        setLoading(false);
        return { 
          success: true,
          requiresTotp: true,
          sessionToken: response.session_token,
        };
      }
      
      // Standard login (no TOTP) - store tokens immediately
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('userEmail', response.user_email);
      localStorage.setItem('isAdmin', String(response.is_admin));
      localStorage.setItem('isInternal', String(response.is_internal));
      
      setLoading(false);
      return { 
        success: true, 
        isAdmin: response.is_admin, 
        isInternal: response.is_internal 
      };
    } catch (err: unknown) {
      const errorMessage = (err as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.detail || (err as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = (): void => {
    setUser(null);
    setUserId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isInternal');
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    userId,
    loading,
    error,
    signup,
    login,
    logout,
    clearError,
  };
};

