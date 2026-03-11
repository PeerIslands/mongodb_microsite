/**
 * Home popup API.
 * Public: get config (when enabled). Image is loaded from getHomePopupImageUrl().
 * Admin: get/update config, upload image.
 */

import apiClient from '../client';

const BASE = '/api/v1/home-popup';

export interface HomePopupPublicConfig {
  image_url: string;
  title_text: string;
  cta_text: string;
  cta_link: string;
}

export interface HomePopupAdminConfig {
  image_url: string | null;
  title_text: string;
  cta_text: string;
  cta_link: string;
  enabled: boolean;
}

export interface HomePopupUpdatePayload {
  title_text?: string;
  cta_text?: string;
  cta_link?: string;
  enabled?: boolean;
}

/**
 * Public config for the home page popup. Returns null if disabled or no image.
 */
export async function getPublicConfig(): Promise<HomePopupPublicConfig | null> {
  const { data } = await apiClient.get<HomePopupPublicConfig | null>(BASE);
  return data;
}

/**
 * Absolute URL for the popup background image (backend proxy).
 */
export function getHomePopupImageUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return base ? `${base}${BASE}/image` : '';
}

// --- Admin (requires auth) ---

export async function getAdminConfig(): Promise<HomePopupAdminConfig> {
  const { data } = await apiClient.get<HomePopupAdminConfig>(`${BASE}/admin`);
  return data;
}

export async function updateAdminConfig(payload: HomePopupUpdatePayload): Promise<HomePopupAdminConfig> {
  const { data } = await apiClient.put<HomePopupAdminConfig>(`${BASE}/admin`, payload);
  return data;
}

export async function uploadPopupImage(file: File): Promise<HomePopupAdminConfig> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<HomePopupAdminConfig>(`${BASE}/admin/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
