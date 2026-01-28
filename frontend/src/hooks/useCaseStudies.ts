import { useState, useEffect, useCallback } from 'react';
import { caseStudiesService } from '@/api/services/case-studies.service';
import type { CaseStudyDetail } from '@/types/models/case-study';
import type { CaseStudyCardData } from '@/features/case-studies/components/CaseStudyCard';
import { withCache } from '@/utils/requestCache';

interface UseCaseStudiesOptions {
  /** Filter by industry */
  industry?: string;
  /** Filter by status */
  status?: 'published' | 'draft';
  /** Only fetch featured case studies */
  featured?: boolean;
  /** Maximum number of case studies to fetch */
  limit?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseCaseStudiesReturn {
  caseStudies: CaseStudyCardData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Transform API response to CaseStudyCardData format
 */
const transformToCaseStudyCardData = (caseStudy: CaseStudyDetail): CaseStudyCardData => ({
  id: caseStudy.id,
  slug: caseStudy.slug,
  industry: caseStudy.industry,
  title: caseStudy.title,
  description: caseStudy.description,
  metrics: caseStudy.metrics || [],
});

/**
 * useCaseStudies - Custom hook for fetching case study data from API
 * 
 * Fetches case study data from the backend API with optional filters.
 * 
 * @example
 * // Fetch all published case studies
 * const { caseStudies, isLoading, error } = useCaseStudies({ status: 'published' });
 * 
 * @example
 * // Fetch featured case studies for home page
 * const { caseStudies } = useCaseStudies({ featured: true, status: 'published' });
 */
export const useCaseStudies = (options: UseCaseStudiesOptions = {}): UseCaseStudiesReturn => {
  const {
    industry,
    status,
    featured,
    limit,
    autoFetch = true,
  } = options;

  const [caseStudies, setCaseStudies] = useState<CaseStudyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseStudies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create cache key based on filter params
      const cacheKey = `case-studies-${industry || 'all'}-${status || 'all'}-${featured || 'all'}-${limit || 'all'}`;

      // Fetch from API with caching
      const apiData = await withCache(cacheKey, () =>
        caseStudiesService.getAll({ 
          industry, 
          status, 
          featured 
        })
      );

      // Transform to card data format
      const transformedData = apiData.map(transformToCaseStudyCardData);

      // Apply limit if specified
      const limitedData = limit && limit > 0 ? transformedData.slice(0, limit) : transformedData;
      
      setCaseStudies(limitedData);
    } catch (err) {
      console.error('Failed to fetch case studies:', err);
      setError('Failed to load case studies. Please try again later.');
      setCaseStudies([]);
    } finally {
      setIsLoading(false);
    }
  }, [industry, status, featured, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchCaseStudies();
    }
  }, [autoFetch, fetchCaseStudies]);

  return {
    caseStudies,
    isLoading,
    error,
    refetch: fetchCaseStudies,
  };
};

export default useCaseStudies;
