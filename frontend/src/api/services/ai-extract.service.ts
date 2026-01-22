import apiClient from '../client';

export interface AIExtractedData {
  title: string;
  companyName: string;
  description: string;
  industry: string;
  techStack: string[];
  migrationType: string;
  challenges: string;
  approach: string;
  metrics: Array<{ label: string; value: string }>;
  businessOutcomes: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialPosition: string;
}

export interface AIExtractResponse {
  success: boolean;
  data: AIExtractedData;
  message: string;
}

export const aiExtractService = {
  /**
   * Extract case study data from uploaded document using AI
   */
  extractCaseStudy: async (file: File): Promise<AIExtractResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AIExtractResponse>(
      '/api/v1/ai-extract/case-study',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for AI processing
      }
    );

    return response.data;
  },
};
