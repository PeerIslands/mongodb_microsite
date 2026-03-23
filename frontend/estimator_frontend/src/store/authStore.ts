"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { useFormStore } from "@estimator/components/store/formStore";
import {
  clearSession,
  getUserEmail,
  getUserId,
  isAdmin,
  isAuthenticated,
} from "@/utils/sessionStorage";
import type { UserResponse } from "@estimator/lib/api";

type AuthState = {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  syncFromMicrosite: () => void;
};

const buildUserFromMicrositeSession = (): UserResponse | null => {
  if (typeof window === "undefined" || !isAuthenticated()) {
    return null;
  }

  const email = getUserEmail();
  if (!email) {
    return null;
  }

  return {
    _id: getUserId() || email,
    username: email,
    role: isAdmin() ? "admin" : "user",
    created_at: new Date().toISOString(),
  };
};

const buildAuthState = (): AuthState => {
  const user = buildUserFromMicrositeSession();
  return {
    user,
    token: typeof window !== "undefined" && isAuthenticated() ? "session" : null,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
  };
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      ...buildAuthState(),

      logout: () => {
        clearSession();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        useFormStore.getState().reset();
      },

      loadUser: async () => {
        set({ isLoading: true });
        set({
          ...buildAuthState(),
          isLoading: false,
        });
      },

      syncFromMicrosite: () => {
        set(buildAuthState());
      },

      clearError: () => set({ error: null }),
    }),
    { name: "estimatorAuthStore" }
  )
);
