/**
 * Newsletter Access Request Types
 * Types for newsletter access control system
 */

export interface NewsletterAccessRequest {
  _id: string;
  user_email: string;
  user_id?: string;
  newsletter_id?: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
  admin_note?: string;
}

export interface NewsletterAccessRequestCreate {
  user_email: string;
  newsletter_id?: string;
}

export interface NewsletterAccessAction {
  request_id: string;
  action: 'approve' | 'deny';
  admin_note?: string;
}

export interface NewsletterAccessCheckResponse {
  has_access: boolean;
  user_email?: string;
  pending_request: boolean;
  message: string;
}

export interface PendingRequestsCountResponse {
  count: number;
}

export interface NewsletterAccessActionResponse {
  success: boolean;
  message: string;
  request_id: string;
  action: string;
}
