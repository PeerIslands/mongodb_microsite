import { useState } from 'react';
import {
  CaseStudyArchitecture,
  CaseStudyDetailSection,
  mockCaseStudyDetail,
} from '@/features/case-studies/components';
import type { CaseStudyDetail } from '@/types/models/case-study';
// import { caseStudiesService } from '@/api/services/case-studies.service';
import '@/styles/pages/CaseStudiesPage.css';

/**
 * Case Studies Page - Showcases featured case study carousel and detail view
 * 
 * When a user clicks on a case study card, the page scrolls down to reveal
 * the detailed case study information.
 */
const CaseStudiesPage = () => {
  // State to track the selected case study
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudyDetail | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  /**
   * Handle when a user clicks on a case study card
   * For now, uses mock data. Will be replaced with API call.
   */
  const handleCardClick = async (caseStudyId: string) => {
    console.log('Card clicked:', caseStudyId);

    // TODO: Replace with actual API call
    // try {
    //   const caseStudyData = await caseStudiesService.getById(caseStudyId);
    //   setSelectedCaseStudy(caseStudyData);
    //   setIsDetailVisible(true);
    // } catch (error) {
    //   console.error('Failed to fetch case study:', error);
    // }

    // For now, use mock data
    setSelectedCaseStudy(mockCaseStudyDetail);
    setIsDetailVisible(true);
  };

  return (
    <div className="case-studies-page">
      {/* Success Stories Hero + Featured Carousel */}
      <CaseStudyArchitecture onCardClick={handleCardClick} />

      {/* Case Study Detail Section - revealed when a card is clicked */}
      <CaseStudyDetailSection 
        caseStudy={selectedCaseStudy} 
        isVisible={isDetailVisible} 
      />
    </div>
  );
};

export default CaseStudiesPage;
