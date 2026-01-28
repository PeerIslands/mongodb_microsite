import { useMemo } from 'react';
import BlogCard, { BlogCardData } from './BlogCard';
import './BlogGrid.css';

interface BlogGridProps {
  blogs: BlogCardData[];
  maxItems?: number;
}

/**
 * BlogGrid - Grid container for blog cards
 * Displays blog posts in a responsive grid layout
 */
const BlogGrid = ({ blogs, maxItems }: BlogGridProps) => {
  // Optionally limit the number of displayed blogs
  const displayedBlogs = useMemo(() => {
    if (maxItems && maxItems > 0) {
      return blogs.slice(0, maxItems);
    }
    return blogs;
  }, [blogs, maxItems]);

  if (displayedBlogs.length === 0) {
    return (
      <div className="blog-grid__empty">
        <p>No blog posts available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="blog-grid">
      {displayedBlogs.map((blog) => (
        <BlogCard key={blog.id} data={blog} />
      ))}
    </div>
  );
};

export default BlogGrid;

