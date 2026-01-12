import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CaseStudyArchitecture,
  CaseStudyDetailSection,
} from '@/features/case-studies/components';
import type { CaseStudyCardData } from '@/features/case-studies/components/CaseStudyCard';
import type { CaseStudyDetail } from '@/types/models/case-study';
import { caseStudiesService } from '@/api/services/case-studies.service';
import '@/styles/pages/CaseStudiesPage.css';

/**
 * Transform API response to CaseStudyCardData format
 */
const transformToCaseStudyCardData = (caseStudy: CaseStudyDetail): CaseStudyCardData => {
  return {
    id: caseStudy.id,
    slug: caseStudy.slug,
    industry: caseStudy.industry,
    title: caseStudy.title,
    description: caseStudy.description,
    metrics: caseStudy.metrics || [],
  };
};

/**
 * Case Studies Page - Showcases featured case study carousel and detail view
 * 
 * When a user clicks on a case study card, the page scrolls down to reveal
 * the detailed case study information.
 */
const CaseStudiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for case studies list
  const [caseStudies, setCaseStudies] = useState<CaseStudyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to track the selected case study
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudyDetail | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  /**
   * Fetch published case studies on component mount
   */
  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await caseStudiesService.getAll({ status: 'published' });
        const transformedData = response.map(transformToCaseStudyCardData);
        setCaseStudies(transformedData);
      } catch (err) {
        console.error('Failed to fetch case studies:', err);
        setError('Failed to load case studies. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseStudies();
  }, []);

  // State for detail loading
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  /**
   * Fetch case study details by ID
   */
  const fetchCaseStudyDetails = async (caseStudyId: string) => {
    try {
      setIsDetailLoading(true);
      const caseStudyData = await caseStudiesService.getById(caseStudyId);
      setSelectedCaseStudy(caseStudyData);
      setIsDetailVisible(true);
    } catch (err) {
      console.error('Failed to fetch case study details:', err);
      setError('Failed to load case study details. Please try again.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  /**
   * Check for case study ID in URL query params on mount
   * If present, automatically load that case study's details
   */
  useEffect(() => {
    const caseStudyId = searchParams.get('id');
    if (caseStudyId) {
      fetchCaseStudyDetails(caseStudyId);
    }
  }, [searchParams]);

  /**
   * Handle when a user clicks on a case study card
   * Closes any existing detail section, then loads and displays the new one
   */
  const handleCardClick = async (caseStudyId: string) => {
    // Update URL with the case study ID for consistency and shareability
    setSearchParams({ id: caseStudyId });
    
    // If detail section is already visible, close it first with a brief delay
    // to create a visual "reload" effect
    if (isDetailVisible) {
      setIsDetailVisible(false);
      // Small delay to allow the close animation before reopening
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    await fetchCaseStudyDetails(caseStudyId);
  };

  return (
    <div className="case-studies-page">
      {/* Error message */}
      {error && (
        <div className="case-studies-page__error">
          <p>{error}</p>
        </div>
      )}

      {/* Success Stories Hero + Featured Carousel */}
      <CaseStudyArchitecture 
        caseStudies={caseStudies}
        isLoading={isLoading}
        onCardClick={handleCardClick} 
      />

      {/* Case Study Detail Section - revealed when a card is clicked */}
      <CaseStudyDetailSection 
        caseStudy={selectedCaseStudy} 
        isVisible={isDetailVisible}
        isLoading={isDetailLoading}
      />
    </div>
  );
};

export default CaseStudiesPage;
