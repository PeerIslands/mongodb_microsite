import { useState, useEffect } from 'react';
import { useBlogs } from '@/features/blogs/hooks';
import { BlogGrid } from '@/features/blogs/components';
import '@/styles/pages/BlogsPage.css';

/**
 * Blogs Page - Dedicated page for all blog content
 * Displays blog posts in a grid layout with header
 */
const BlogsPage = () => {
  const { blogs: allBlogs, isLoading, error } = useBlogs({
    autoFetch: true,
  });

  // Filter to show only published blogs
  const blogs = allBlogs.filter(blog => blog.status === 'published');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from blogs
  const categories = Array.from(new Set(blogs.map(blog => blog.category)));

  // Filter blogs based on search and category
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchTerm === '' || 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || blog.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="blogs-page">
      {/* Hero Section */}
      <section className="blogs-hero">
        <div className="blogs-hero__container">
          <h1 className="blogs-hero__title">Insights & Resources</h1>
          <p className="blogs-hero__subtitle">
            Discover the latest insights, tutorials, and best practices from the MongoDB and PeerAI community
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="blogs-filters">
        <div className="blogs-filters__container">
          {/* Search Bar */}
          <div className="blogs-search">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="blogs-search__input"
            />
            <svg 
              className="blogs-search__icon" 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
            >
              <path 
                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Category Dropdown */}
          <div className="blogs-category-dropdown">
            <select
              id="category-select"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="category-dropdown-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="blogs-content">
        <div className="blogs-content__container">
          {/* Loading State */}
          {isLoading && (
            <div className="blogs-loading">
              <div className="blogs-loading__spinner" />
              <p>Loading articles...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="blogs-error">
              <p>{error}</p>
            </div>
          )}

          {/* Blog Grid */}
          {!isLoading && !error && (
            <>
              <div className="blogs-results-info">
                <p className="blogs-results-count">
                  {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
                  {selectedCategory && ` in ${selectedCategory}`}
                </p>
              </div>

              {filteredBlogs.length > 0 ? (
                <BlogGrid blogs={filteredBlogs} />
              ) : (
                <div className="blogs-empty">
                  <p>No articles found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogsPage;

