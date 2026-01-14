import { useState, useEffect, useCallback } from 'react';
import type { BlogCardData } from '../components/BlogCard';
import { blogsService } from '../services/blogs.service';

interface UseBlogsOptions {
  /** Filter by category */
  category?: string;
  /** Only fetch featured blogs */
  featured?: boolean;
  /** Maximum number of blogs to fetch */
  limit?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseBlogsReturn {
  blogs: BlogCardData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * useBlogs - Custom hook for fetching blog data from API
 * 
 * Fetches blog data from the backend API with optional filters.
 * 
 * @example
 * // Fetch all blogs
 * const { blogs, isLoading, error } = useBlogs();
 * 
 * @example
 * // Fetch with filters
 * const { blogs } = useBlogs({ category: 'Tutorial', featured: true });
 */
export const useBlogs = (options: UseBlogsOptions = {}): UseBlogsReturn => {
  const {
    category,
    featured,
    limit,
    autoFetch = true,
  } = options;

  const [blogs, setBlogs] = useState<BlogCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from API
      const apiData = await blogsService.getAll({ 
        category, 
        status: featured ? 'published' : undefined 
      });

      // Apply limit if specified
      const limitedData = limit && limit > 0 ? apiData.slice(0, limit) : apiData;
      
      setBlogs(limitedData);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs. Please try again later.');
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, featured, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchBlogs();
    }
  }, [autoFetch, fetchBlogs]);

  return {
    blogs,
    isLoading,
    error,
    refetch: fetchBlogs,
  };
};

export default useBlogs;

