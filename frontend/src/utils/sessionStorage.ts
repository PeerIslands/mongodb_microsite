/**
 * Centralized session storage utility for authentication data.
 * Uses sessionStorage instead of localStorage for better security.
 * Session data is cleared when the browser tab/window is closed.
 */

const SESSION_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_EMAIL: 'userEmail',
  IS_ADMIN: 'isAdmin',
  IS_INTERNAL: 'isInternal',
  USER_ID: 'userId',
} as const;

/**
 * Get authentication token from session storage
 */
export const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token from sessionStorage:', error);
    return null;
  }
};

/**
 * Set authentication token in session storage
 */
export const setAuthToken = (token: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error setting auth token in sessionStorage:', error);
  }
};

/**
 * Get user email from session storage
 */
export const getUserEmail = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEYS.USER_EMAIL);
  } catch (error) {
    console.error('Error getting user email from sessionStorage:', error);
    return null;
  }
};

/**
 * Set user email in session storage
 */
export const setUserEmail = (email: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.USER_EMAIL, email);
  } catch (error) {
    console.error('Error setting user email in sessionStorage:', error);
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEYS.IS_ADMIN) === 'true';
  } catch (error) {
    console.error('Error checking admin status from sessionStorage:', error);
    return false;
  }
};

/**
 * Set admin status in session storage
 */
export const setAdminStatus = (isAdmin: boolean): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.IS_ADMIN, String(isAdmin));
  } catch (error) {
    console.error('Error setting admin status in sessionStorage:', error);
  }
};

/**
 * Check if user is internal
 */
export const isInternal = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEYS.IS_INTERNAL) === 'true';
  } catch (error) {
    console.error('Error checking internal status from sessionStorage:', error);
    return false;
  }
};

/**
 * Set internal status in session storage
 */
export const setInternalStatus = (isInternal: boolean): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.IS_INTERNAL, String(isInternal));
  } catch (error) {
    console.error('Error setting internal status in sessionStorage:', error);
  }
};

/**
 * Get user ID from session storage
 */
export const getUserId = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEYS.USER_ID);
  } catch (error) {
    console.error('Error getting user ID from sessionStorage:', error);
    return null;
  }
};

/**
 * Set user ID in session storage
 */
export const setUserId = (userId: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Error setting user ID in sessionStorage:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Clear all session storage data
 */
export const clearSession = (): void => {
  try {
    Object.values(SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

/**
 * Get all session data as an object
 */
export const getSessionData = (): {
  authToken: string | null;
  userEmail: string | null;
  isAdmin: boolean;
  isInternal: boolean;
  userId: string | null;
} => {
  return {
    authToken: getAuthToken(),
    userEmail: getUserEmail(),
    isAdmin: isAdmin(),
    isInternal: isInternal(),
    userId: getUserId(),
  };
};

/**
 * Set session data from login response
 */
export const setSessionData = (data: {
  authToken: string;
  userEmail: string;
  isAdmin: boolean;
  isInternal: boolean;
  userId?: string;
}): void => {
  setAuthToken(data.authToken);
  setUserEmail(data.userEmail);
  setAdminStatus(data.isAdmin);
  setInternalStatus(data.isInternal);
  if (data.userId) {
    setUserId(data.userId);
  }
};
