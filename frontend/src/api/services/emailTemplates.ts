/**
 * Email Templates API Service
 * 
 * Handles all API calls related to email template management (admin only)
 */

import apiClient from '../client';

export interface TemplateImage {
  filename: string;
  original_path?: string;
  url: string;
  alt_text?: string;
  size_bytes?: number;
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  default_value?: any;
  description?: string;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: 'newsletter' | 'transactional' | 'promotional' | 'notification';
  status: 'draft' | 'active' | 'archived';
  subject: string;
  html_content: string;
  plain_text_content?: string;
  sendgrid_template_id?: string;
  sendgrid_version_id?: string;
  variables: TemplateVariable[];
  images: TemplateImage[];
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  send_count: number;
  test_send_count: number;
  last_sent_at?: string;
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: 'newsletter' | 'transactional' | 'promotional' | 'notification';
  subject: string;
  html_content: string;
  plain_text_content?: string;
  variables?: TemplateVariable[];
  images?: TemplateImage[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: 'newsletter' | 'transactional' | 'promotional' | 'notification';
  status?: 'draft' | 'active' | 'archived';
  subject?: string;
  html_content?: string;
  plain_text_content?: string;
  variables?: TemplateVariable[];
  images?: TemplateImage[];
}

export interface SendTestEmailRequest {
  to_email: string;
  test_data?: Record<string, any>;
}

export interface SendTestEmailResponse {
  success: boolean;
  message_id?: string;
  message: string;
  status: string;
}

export type RecipientFilter = 
  | 'all_users' 
  | 'active_users' 
  | 'internal_users' 
  | 'external_users' 
  | 'custom_list';

export interface SendNewsletterRequest {
  recipient_filter: RecipientFilter;
  custom_emails?: string[];
  test_mode?: boolean;
  variable_data?: Record<string, unknown>;
}

export interface SendNewsletterResponse {
  success: boolean;
  total_recipients: number;
  emails_sent: number;
  emails_failed: number;
  failed_emails?: string[];
  message: string;
  send_job_id?: string;
}

/**
 * Get all email templates
 */
export const getEmailTemplates = async (
  skip = 0,
  limit = 100,
  category?: string,
  status?: string
): Promise<EmailTemplateListResponse> => {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  
  if (category) params.append('category', category);
  if (status) params.append('status_filter', status);
  
  const response = await apiClient.get<EmailTemplateListResponse>(
    `/api/v1/email-templates?${params.toString()}`
  );
  return response.data;
};

/**
 * Get a single email template by ID
 */
export const getEmailTemplate = async (id: string): Promise<EmailTemplate> => {
  const response = await apiClient.get<EmailTemplate>(`/api/v1/email-templates/${id}`);
  return response.data;
};

/**
 * Create a new email template
 */
export const createEmailTemplate = async (
  data: CreateTemplateRequest
): Promise<EmailTemplate> => {
  const response = await apiClient.post<EmailTemplate>('/api/v1/email-templates', data);
  return response.data;
};

/**
 * Update an existing email template
 */
export const updateEmailTemplate = async (
  id: string,
  data: UpdateTemplateRequest
): Promise<EmailTemplate> => {
  const response = await apiClient.put<EmailTemplate>(
    `/api/v1/email-templates/${id}`,
    data
  );
  return response.data;
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/email-templates/${id}`);
};

/**
 * Upload HTML file as new template
 */
export const uploadHTMLTemplate = async (
  name: string,
  subject: string,
  htmlFile: File,
  description?: string,
  category: string = 'newsletter',
  imageFiles?: File[],
  useBlobStorage: boolean = true  // Default to Azure Blob Storage
): Promise<EmailTemplate> => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('subject', subject);
  formData.append('html_file', htmlFile);
  if (description) formData.append('description', description);
  formData.append('category', category);
  formData.append('use_blob_storage', String(useBlobStorage));
  
  // Append image files if provided
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((imageFile) => {
      formData.append('image_files', imageFile);
    });
  }
  
  const response = await apiClient.post<EmailTemplate>(
    '/api/v1/email-templates/upload-html',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large uploads with many images
    }
  );
  return response.data;
};

/**
 * Send test email using template
 */
export const sendTestEmail = async (
  templateId: string,
  request: SendTestEmailRequest
): Promise<SendTestEmailResponse> => {
  const response = await apiClient.post<SendTestEmailResponse>(
    `/api/v1/email-templates/${templateId}/send-test`,
    request
  );
  return response.data;
};

/**
 * Duplicate an existing template
 */
export const duplicateTemplate = async (id: string): Promise<EmailTemplate> => {
  const response = await apiClient.post<EmailTemplate>(
    `/api/v1/email-templates/${id}/duplicate`
  );
  return response.data;
};

/**
 * Update template status
 */
export const updateTemplateStatus = async (
  id: string,
  status: 'draft' | 'active' | 'archived'
): Promise<EmailTemplate> => {
  const response = await apiClient.patch<EmailTemplate>(
    `/api/v1/email-templates/${id}/status`,
    null,
    {
      params: { new_status: status },
    }
  );
  return response.data;
};

/**
 * Send newsletter to multiple recipients
 */
export const sendNewsletter = async (
  templateId: string,
  request: SendNewsletterRequest
): Promise<SendNewsletterResponse> => {
  const response = await apiClient.post<SendNewsletterResponse>(
    `/api/v1/email-templates/${templateId}/send-newsletter`,
    request,
    {
      timeout: 300000, // 5 minutes for bulk sending
    }
  );
  return response.data;
};

export default {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  uploadHTMLTemplate,
  sendTestEmail,
  duplicateTemplate,
  updateTemplateStatus,
  sendNewsletter,
};
