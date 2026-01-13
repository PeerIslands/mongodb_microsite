import BlogGrid from './BlogGrid';
import { BlogCardData } from './BlogCard';
import { useBlogs } from '../hooks/useBlogs';
import './BlogSection.css';

interface BlogSectionProps {
  /** Static blog data - if not provided, will fetch from API */
  blogs?: BlogCardData[];
  /** Maximum number of blogs to display */
  maxItems?: number;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** HTML id for scroll navigation */
  id?: string;
}

/**
 * BlogSection - Complete blog section with header and grid
 * 
 * Fetches blog data from API or displays provided static data.
 * 
 * Use the `id` prop to enable scroll-to functionality from navigation.
 * 
 * @example
 * // With static data
 * <BlogSection blogs={myBlogData} />
 * 
 * @example
 * // Fetch from API
 * <BlogSection />
 */
const BlogSection = ({ 
  blogs: staticBlogs,
  maxItems = 6, 
  title = 'Latest from Our Blog',
  subtitle = 'Insights, tutorials, and updates from the MongoDB community',
  id = 'blogs',
}: BlogSectionProps) => {
  // Use the hook to fetch blogs if no static data provided
  const { 
    blogs: fetchedBlogs, 
    isLoading,
    error
  } = useBlogs({
    limit: maxItems,
    featured: true,
    autoFetch: !staticBlogs, // Only fetch if no static blogs provided
  });

  // Use static blogs if provided, otherwise use fetched blogs
  const displayBlogs = staticBlogs || fetchedBlogs;

  return (
    <section className="blog-section" id={id}>
      {/* Background decorations */}
      <div className="blog-section__bg-glow blog-section__bg-glow--left" />
      <div className="blog-section__bg-glow blog-section__bg-glow--right" />
      
      <div className="blog-section__container">
        {/* Section header */}
        <div className="blog-section__header">
          <h2 className="blog-section__title">{title}</h2>
          {subtitle && (
            <p className="blog-section__subtitle">{subtitle}</p>
          )}
        </div>

        {/* Loading state */}
        {isLoading && !staticBlogs ? (
          <div className="blog-section__loading">
            <div className="blog-section__loading-spinner" />
            <p>Loading blogs...</p>
          </div>
        ) : error && !staticBlogs ? (
          <div className="blog-section__error">
            <p>{error}</p>
          </div>
        ) : (
          /* Blog grid */
          <BlogGrid blogs={displayBlogs} maxItems={maxItems} />
        )}
      </div>
    </section>
  );
};

export default BlogSection;

