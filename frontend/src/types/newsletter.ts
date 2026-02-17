/**
 * Newsletter Types
 * Simplified interface for public newsletter display
 */

export interface Newsletter {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  html_content: string | null;
  created_at: string;
  updated_at: string;
  has_access?: boolean;
}

