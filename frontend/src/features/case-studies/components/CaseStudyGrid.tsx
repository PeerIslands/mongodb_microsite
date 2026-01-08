import { /* useState, */ useMemo } from 'react';
import { Link } from 'react-router-dom';
import CaseStudyCard, { CaseStudyCardData } from './CaseStudyCard';
import '@/styles/features/case-studies/CaseStudyGrid.css';

interface CaseStudyGridProps {
  caseStudies: CaseStudyCardData[];
  showViewAllButton?: boolean;
}

/**
 * CaseStudyGrid - Grid container for case study cards
 * Includes filter functionality (commented out for future implementation)
 */
const CaseStudyGrid = ({ caseStudies, showViewAllButton = true }: CaseStudyGridProps) => {
  /* ============================================
   * FILTER FUNCTIONALITY - COMMENTED FOR FUTURE
   * ============================================
   * 
   * Uncomment this section when filter functionality is needed.
   * 
   * const [activeFilter, setActiveFilter] = useState<string | null>(null);
   * 
   * // Get unique categories from case studies
   * const categories = useMemo(() => {
   *   const uniqueCategories = [...new Set(caseStudies.map(cs => cs.category))];
   *   return uniqueCategories;
   * }, [caseStudies]);
   * 
   * // Filter case studies based on active filter
   * const filteredCaseStudies = useMemo(() => {
   *   if (!activeFilter) return caseStudies;
   *   return caseStudies.filter(cs => cs.category === activeFilter);
   * }, [caseStudies, activeFilter]);
   * 
   * // Handle filter click
   * const handleFilterClick = (category: string) => {
   *   setActiveFilter(prev => prev === category ? null : category);
   * };
   * 
   * ============================================ */

  // For now, just use all case studies without filtering
  const filteredCaseStudies = useMemo(() => caseStudies, [caseStudies]);

  return (
    <section className="case-study-grid-section">
      <div className="case-study-grid__container">
        {/* ============================================
         * FILTER UI - COMMENTED FOR FUTURE
         * ============================================
         * 
         * <div className="case-study-grid__filters">
         *   <button
         *     className={`case-study-grid__filter-btn ${!activeFilter ? 'case-study-grid__filter-btn--active' : ''}`}
         *     onClick={() => setActiveFilter(null)}
         *   >
         *     All
         *   </button>
         *   {categories.map((category) => (
         *     <button
         *       key={category}
         *       className={`case-study-grid__filter-btn ${activeFilter === category ? 'case-study-grid__filter-btn--active' : ''}`}
         *       onClick={() => handleFilterClick(category)}
         *     >
         *       {category}
         *     </button>
         *   ))}
         * </div>
         * 
         * ============================================ */}

        {/* Case studies grid */}
        <div className="case-study-grid">
          {filteredCaseStudies.map((caseStudy) => (
            <CaseStudyCard key={caseStudy.id} data={caseStudy} />
          ))}
        </div>

        {/* View all button */}
        {showViewAllButton && (
          <div className="case-study-grid__cta">
            <Link to="/case-studies" className="case-study-grid__view-all-btn">
              <span className="case-study-grid__view-all-text">View all case study</span>
            </Link>
          </div>
        )}
        <div className="case-study-grid__button">
          
        </div>
      </div>
    </section>
  );
};

export default CaseStudyGrid;

