/**
 * Resolve event media URL (thumbnail, video) to an absolute URL.
 * Backend returns relative paths (e.g. /api/v1/events/{id}/files/thumbnail);
 * frontend uses VITE_API_BASE_URL so the correct host is used in every environment.
 */
export function getAbsoluteEventMediaUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) return url;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
