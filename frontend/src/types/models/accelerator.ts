/**
 * Accelerator Types - TypeScript types matching backend models.
 *
 * Models:
 * - MetricItem: Individual metric with label and value
 * - Accelerator: Basic accelerator response
 * - AcceleratorDetail: Full accelerator details with metrics and file URLs
 * - CreateAcceleratorDto: Data for creating accelerators
 * - UpdateAcceleratorDto: Data for updating accelerators
 * - CreateAcceleratorResponse: Response after creating
 * - UpdateAcceleratorResponse: Response after updating
 * - DeleteAcceleratorResponse: Response after deleting
 */

/** Individual metric with label and value */
export interface MetricItem {
  label: string;
  value: string;
}

/** Accelerator status */
export type AcceleratorStatus = 'draft' | 'published';

/** Basic accelerator response (list view) */
export interface Accelerator {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: AcceleratorStatus;
  feature_on_homepage: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Full accelerator details with metrics and file URLs */
export interface AcceleratorDetail extends Accelerator {
  metrics: MetricItem[];
  thumbnail_url: string;
  video_url: string;
  pdf_url: string;
  /** Direct Blob URL for HLS master playlist (when available); use for segment-chunk playback */
  hls_playlist_url?: string;
}

/** Data for creating a new accelerator */
export interface CreateAcceleratorDto {
  title: string;
  subtitle: string;
  description: string;
  metrics: MetricItem[];
  status?: AcceleratorStatus;
  feature_on_homepage?: boolean;
  pdf_file: File; // Required
  thumbnail_file?: File; // Optional
  video_file?: File; // Optional
}

/** Data for updating an accelerator (all fields optional) */
export interface UpdateAcceleratorDto {
  title?: string;
  subtitle?: string;
  description?: string;
  metrics?: MetricItem[];
  status?: AcceleratorStatus;
  feature_on_homepage?: boolean;
  display_order?: number;
  thumbnail_file?: File;
  video_file?: File;
  pdf_file?: File;
  // File deletion flags
  delete_thumbnail?: boolean;
  delete_video?: boolean;
  delete_pdf?: boolean;
}

/** Single item for reorder API request */
export interface ReorderItem {
  id: string;
  display_order: number;
}

/** Response after creating an accelerator */
export interface CreateAcceleratorResponse {
  id: string;
  message: string;
}

/** Response after updating an accelerator */
export interface UpdateAcceleratorResponse {
  id: string;
  message: string;
}

/** Response after deleting an accelerator */
export interface DeleteAcceleratorResponse {
  id: string;
  message: string;
}

/** Query parameters for fetching accelerators */
export interface AcceleratorQueryParams {
  status?: AcceleratorStatus;
  feature_on_homepage?: boolean;
}

/**
 * Frontend-only types (not in backend model)
 * These types are used for UI components but may not be stored in the database
 */

/** Feature item for display (frontend-only) */
export interface AcceleratorFeature {
  icon: string;
  title: string;
  description: string;
}
