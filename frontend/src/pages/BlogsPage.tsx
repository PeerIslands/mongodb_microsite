import { useState, useEffect } from 'react';
import { useBlogs } from '@/features/blogs/hooks';
import { BlogGrid, NewsletterCarousel } from '@/features/blogs/components';
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
  const [showAll, setShowAll] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

  // Limit to 6 blogs initially
  const INITIAL_DISPLAY_COUNT = 6;
  const displayedBlogs = showAll ? filteredBlogs : filteredBlogs.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreBlogs = filteredBlogs.length > INITIAL_DISPLAY_COUNT;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset showAll when filters change
  useEffect(() => {
    setShowAll(false);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="blogs-page">
      {/* Hero Section */}
      <section className="blogs-hero">
        <div className="blogs-hero__container">
          <h1 className="blogs-hero__title">
            Latest <span className="blogs-hero__title-gradient">Blogs</span>
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="blogs-content">
        <div className="blogs-content__container">
          {/* Inline Search Bar */}
          <div className={`blogs-search-bar ${isSearchExpanded ? 'expanded' : ''}`}>
            {/* Search Input */}
            <div className={`blogs-search ${isSearchExpanded ? 'visible' : ''}`}>
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
            <div className={`blogs-category-dropdown ${isSearchExpanded ? 'visible' : ''}`}>
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

            {/* Toggle Button */}
            <button
              className={`blogs-search-toggle ${isSearchExpanded ? 'expanded' : ''} ${(searchTerm || selectedCategory) ? 'active' : ''}`}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              aria-label="Toggle search filters"
            >
              <svg 
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
            </button>
          </div>
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
                <>
                  <BlogGrid blogs={displayedBlogs} />
                  
                  {/* View More/Less Button */}
                  {hasMoreBlogs && (
                    <div className="blogs-view-more">
                      <button 
                        className="blogs-view-more__button"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : `View More (${filteredBlogs.length - INITIAL_DISPLAY_COUNT} more)`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="blogs-empty">
                  <p>No articles found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterCarousel />
    </div>
  );
};

export default BlogsPage;

