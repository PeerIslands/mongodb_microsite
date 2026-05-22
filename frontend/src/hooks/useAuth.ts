import { useState } from 'react';
import { userService } from '@/api/services/user.service';
import type { User, SignupResponse } from '@/types/models/user';
import { setSessionData, clearSession } from '@/utils/sessionStorage';
import { acquireAzureIdTokenPopup } from '@/config/azureMsal';

type LoginFlowResult = {
  success: boolean;
  requiresTotp?: boolean;
  sessionToken?: string;
  registrationIncomplete?: boolean;
  registrationStatus?: string;
  redirectTo?: string;
  message?: string;
  userEmail?: string;
  isAdmin?: boolean;
  isInternal?: boolean;
  error?: string;
};

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
  login: (email: string, password: string) => Promise<LoginFlowResult>;
  loginWithMicrosoft: () => Promise<LoginFlowResult>;
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

      setLoading(false);

      return { success: true, data: response };
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
        'Signup failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<LoginFlowResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.login({
        user_email: email,
        user_password: password,
      });

      if (response.registration_incomplete) {
        setLoading(false);
        return {
          success: false,
          registrationIncomplete: true,
          registrationStatus: response.registration_status,
          redirectTo: response.redirect_to,
          message: response.message || 'Please complete MFA setup to access your account',
          userEmail: response.user_email,
        };
      }

      if (response.requires_totp) {
        setLoading(false);
        return {
          success: true,
          requiresTotp: true,
          sessionToken: response.session_token,
        };
      }

      setSessionData({
        authToken: response.access_token!,
        userEmail: response.user_email!,
        isAdmin: response.is_admin || false,
        isInternal: response.is_internal || false,
        userId: response.user_email!,
      });

      setLoading(false);
      return {
        success: true,
        isAdmin: response.is_admin,
        isInternal: response.is_internal,
      };
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const loginWithMicrosoft = async (): Promise<LoginFlowResult> => {
    setLoading(true);
    setError(null);

    try {
      const idToken = await acquireAzureIdTokenPopup();
      const response = await userService.loginWithAzure(idToken);

      if (response.registration_incomplete) {
        setLoading(false);
        return {
          success: false,
          registrationIncomplete: true,
          registrationStatus: response.registration_status,
          redirectTo: response.redirect_to,
          message: response.message || 'Please complete MFA setup to access your account',
          userEmail: response.user_email,
        };
      }

      if (response.requires_totp) {
        setLoading(false);
        return {
          success: true,
          requiresTotp: true,
          sessionToken: response.session_token,
        };
      }

      setSessionData({
        authToken: response.access_token!,
        userEmail: response.user_email!,
        isAdmin: response.is_admin || false,
        isInternal: response.is_internal || false,
        userId: response.user_email!,
      });

      setLoading(false);
      return {
        success: true,
        isAdmin: response.is_admin,
        isInternal: response.is_internal,
      };
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        'Microsoft sign-in failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = (): void => {
    setUser(null);
    setUserId(null);
    clearSession();
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
    loginWithMicrosoft,
    logout,
    clearError,
  };
};
