import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import '@/styles/features/accelerators/AcceleratorTabs.css';
import type { AcceleratorDetail } from '@/types/models/accelerator';

interface AcceleratorTabsProps {
  accelerators: AcceleratorDetail[];
  activeAcceleratorId: string;
  onTabChange: (accelerator: AcceleratorDetail) => void;
}

const TABS_PER_PAGE = 4;

const AcceleratorTabs = ({ accelerators, activeAcceleratorId, onTabChange }: AcceleratorTabsProps) => {
  const tabsGroupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerMaxWidth, setContainerMaxWidth] = useState<number | null>(null);

  const totalPages = Math.ceil(accelerators.length / TABS_PER_PAGE);
  const hasScrolling = accelerators.length > TABS_PER_PAGE;
  
  // Generate stable page identifiers for dots
  const pageIds = useMemo(() => 
    Array.from({ length: totalPages }, (_, i) => `accelerator-page-${i}`),
    [totalPages]
  );

  // Find the active tab index
  const activeIndex = accelerators.findIndex(acc => acc.id === activeAcceleratorId);

  // Calculate container width based on first 4 tabs
  const calculateContainerWidth = useCallback(() => {
    if (!hasScrolling) {
      setContainerMaxWidth(null);
      return;
    }

    const tabsToMeasure = tabRefs.current.slice(0, TABS_PER_PAGE);
    if (tabsToMeasure.some(tab => !tab)) return;

    // Calculate total width of first 4 tabs
    let totalTabsWidth = 0;
    tabsToMeasure.forEach(tab => {
      if (tab) {
        totalTabsWidth += tab.offsetWidth;
      }
    });

    // Add gaps between tabs (8px gap × 3 gaps for 4 tabs) + padding (4px × 2)
    const gapWidth = 8 * (TABS_PER_PAGE - 1);
    const paddingWidth = 4 * 2;
    const totalWidth = totalTabsWidth + gapWidth + paddingWidth;

    setContainerMaxWidth(totalWidth);
  }, [hasScrolling]);

  // Update scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);

    // Calculate current page based on scroll position
    if (scrollWidth > clientWidth) {
      const maxScroll = scrollWidth - clientWidth;
      const scrollPercentage = scrollLeft / maxScroll;
      const page = Math.round(scrollPercentage * (totalPages - 1));
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Scroll to a specific page
  const scrollToPage = useCallback((page: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    const targetScroll = (page / (totalPages - 1)) * maxScroll;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }, [totalPages]);

  // Handle left/right button clicks
  const handleScrollLeft = () => {
    if (currentPage > 0) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleScrollRight = () => {
    if (currentPage < totalPages - 1) {
      scrollToPage(currentPage + 1);
    }
  };

  // Update indicator position
  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    const tabsGroup = tabsGroupRef.current;

    if (activeTab && tabsGroup) {
      const groupRect = tabsGroup.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - groupRect.left,
        width: tabRect.width,
      });
    }
  }, [activeIndex, accelerators]);

  // Calculate container width on mount and resize
  useEffect(() => {
    // Use requestAnimationFrame to ensure tabs are rendered
    const rafId = requestAnimationFrame(() => {
      calculateContainerWidth();
      // Update scroll state after width is calculated
      setTimeout(updateScrollState, 0);
    });

    const handleResize = () => {
      calculateContainerWidth();
      setTimeout(updateScrollState, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateContainerWidth, accelerators, updateScrollState]);

  // Initialize and update scroll state
  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [updateScrollState]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab && scrollContainerRef.current) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <section className="accelerator-tabs">
      <div className={`tabs-wrapper ${hasScrolling ? 'has-scrolling' : ''}`}>
        {/* Left arrow button */}
        {hasScrolling && (
          <button
            className={`scroll-arrow scroll-arrow-left ${canScrollLeft ? '' : 'disabled'}`}
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div 
          className="tabs-container" 
          ref={scrollContainerRef}
          style={containerMaxWidth ? { maxWidth: `${containerMaxWidth}px` } : undefined}
        >
          <div className="tabs-group" ref={tabsGroupRef}>
            {/* Sliding indicator */}
            <div
              className="tab-indicator"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
              }}
            />
            {accelerators.map((acc, index) => (
              <button
                key={acc.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                className={`tab-item ${activeAcceleratorId === acc.id ? 'active' : ''}`}
                onClick={() => onTabChange(acc)}
              >
                {acc.title}
              </button>
            ))}
          </div>
        </div>

        {/* Right arrow button */}
        {hasScrolling && (
          <button
            className={`scroll-arrow scroll-arrow-right ${canScrollRight ? '' : 'disabled'}`}
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dots indicator */}
      {hasScrolling && (
        <div className="scroll-dots">
          {pageIds.map((pageId, pageIndex) => (
            <button
              key={pageId}
              className={`scroll-dot ${pageIndex === currentPage ? 'active' : ''}`}
              onClick={() => scrollToPage(pageIndex)}
              aria-label={`Go to page ${pageIndex + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default AcceleratorTabs;
