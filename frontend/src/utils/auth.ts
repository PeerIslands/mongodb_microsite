import { clearSession } from './sessionStorage';
import * as sessionStorage from './sessionStorage';

/**
 * Centralized authentication utilities
 */

let isLoggingOut = false;

/**
 * Handle token expiration - clear session and prompt for fresh login
 */
export const handleTokenExpiration = (): void => {
  if (isLoggingOut) {
    return; // Prevent multiple simultaneous logout calls
  }

  isLoggingOut = true;

  try {
    // Clear session storage
    clearSession();

    // Show toast notification (will be handled by component that calls this)
    // Redirect to home page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    } else {
      // If already on home page, trigger a reload to update UI
      window.location.reload();
    }
  } catch (error) {
    console.error('Error handling token expiration:', error);
  } finally {
    // Reset flag after a delay to allow redirect
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
};

/**
 * Logout function - clear session and redirect
 */
export const logout = (): void => {
  if (isLoggingOut) {
    return; // Prevent multiple simultaneous logout calls
  }

  isLoggingOut = true;

  try {
    // Clear session storage
    clearSession();

    // Redirect to home page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    } else {
      // If already on home page, trigger a reload to update UI
      window.location.reload();
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Reset flag after a delay to allow redirect
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
};

// Re-export session storage utilities for convenience
export * from './sessionStorage';
