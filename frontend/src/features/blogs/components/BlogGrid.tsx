import { useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import BlogCard, { BlogCardData } from './BlogCard';
import 'swiper/css';
import 'swiper/css/navigation';
import './BlogGrid.css';

interface BlogGridProps {
  blogs: BlogCardData[];
  maxItems?: number;
}

/**
 * BlogGrid - Grid container for blog cards
 * Displays blog posts in a responsive grid layout on desktop
 * Shows carousel on tablet/mobile (controlled by CSS)
 */
const BlogGrid = ({ blogs, maxItems }: BlogGridProps) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

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
    <>
      {/* Desktop Grid - shown only on desktop via CSS */}
      <div className="blog-grid blog-grid-desktop">
        {displayedBlogs.map((blog) => (
          <BlogCard key={blog.id} data={blog} />
        ))}
      </div>

      {/* Mobile/Tablet Carousel - shown only on mobile/tablet via CSS */}
      <div className="blog-carousel-wrapper blog-carousel-mobile">
        <button 
          className="blog-carousel-arrow blog-carousel-arrow-left"
          onClick={() => swiperInstance?.slidePrev()}
          aria-label="Previous blogs"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          loop={displayedBlogs.length > 1}
          speed={600}
          autoplay={{
            delay: 5000, // 5 seconds
            disableOnInteraction: false,
          }}
          breakpoints={{
            769: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
          }}
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          className="blog-swiper"
        >
          {displayedBlogs.map((blog) => (
            <SwiperSlide key={blog.id} className="blog-slide">
              <BlogCard data={blog} />
            </SwiperSlide>
          ))}
        </Swiper>
        
        <button
          className="blog-carousel-arrow blog-carousel-arrow-right"
          onClick={() => swiperInstance?.slideNext()}
          aria-label="Next blogs"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default BlogGrid;
