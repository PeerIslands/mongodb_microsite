/**
 * PDF Download Service - API service for PDF download lead capture.
 *
 * This service handles submitting lead capture data when non-logged-in
 * users download PDFs from accelerators or case studies.
 */

import apiClient from '../client';

/**
 * Request payload for PDF download lead capture.
 */
export interface PDFDownloadRequest {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_function: string;
  country: string;
  business_phone: string;
  resource_type: 'accelerator' | 'case_study';
  resource_id: string;
  resource_title: string;
}

/**
 * Response from PDF download lead capture API.
 */
export interface PDFDownloadResponse {
  id: string;
  message: string;
}

export const pdfDownloadService = {
  /**
   * Submit lead capture data for a PDF download.
   *
   * This is called when a non-logged-in user fills out the download form
   * to get access to a PDF resource.
   *
   * @param data - Lead capture data including contact info and resource details
   * @returns Response with record ID and success message
   */
  async submitDownloadForm(data: PDFDownloadRequest): Promise<PDFDownloadResponse> {
    const response = await apiClient.post<PDFDownloadResponse>('/api/v1/pdf-downloads', data);
    return response.data;
  },
};

export default pdfDownloadService;
