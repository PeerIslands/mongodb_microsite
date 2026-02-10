import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CaseStudyArchitecture,
  CaseStudyDetailSection,
  TestimonialCarousel,
  TestimonialDetailSection,
} from '@/features/case-studies/components';
import type { CaseStudyDetail } from '@/types/models/case-study';
import type { CombinedTestimonial } from '@/types/models/testimonial';
import { caseStudiesService } from '@/api/services/case-studies.service';
import { testimonialsService } from '@/api/services/testimonials.service';
import { useCaseStudies } from '@/hooks/useCaseStudies';
import '@/styles/pages/CaseStudiesPage.css';

/**
 * Case Studies Page - Showcases featured case study carousel and detail view
 * 
 * When a user clicks on a case study card, the page scrolls down to reveal
 * the detailed case study information.
 */
const CaseStudiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use the shared hook to fetch all published case studies
  const { caseStudies, isLoading } = useCaseStudies({ status: 'published' });

  // State to track the selected case study
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudyDetail | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // State for detail loading
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // State to track the selected testimonial
  const [selectedTestimonial, setSelectedTestimonial] = useState<CombinedTestimonial | null>(null);
  const [isTestimonialDetailVisible, setIsTestimonialDetailVisible] = useState(false);

  // State for testimonial detail loading
  const [isTestimonialDetailLoading, setIsTestimonialDetailLoading] = useState(false);

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
    
    // Close testimonial detail if open
    setIsTestimonialDetailVisible(false);
    
    // If detail section is already visible, close it first with a brief delay
    // to create a visual "reload" effect
    if (isDetailVisible) {
      setIsDetailVisible(false);
      // Small delay to allow the close animation before reopening
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    await fetchCaseStudyDetails(caseStudyId);
  };

  /**
   * Fetch testimonial details by ID
   */
  const fetchTestimonialDetails = async (testimonialId: string) => {
    try {
      setIsTestimonialDetailLoading(true);
      // Fetch from combined testimonials
      const testimonials = await testimonialsService.getCombined();
      const testimonial = testimonials.find(t => t.id === testimonialId);
      if (testimonial) {
        setSelectedTestimonial(testimonial);
        setIsTestimonialDetailVisible(true);
      }
    } catch (err) {
      console.error('Failed to fetch testimonial details:', err);
    } finally {
      setIsTestimonialDetailLoading(false);
    }
  };

  /**
   * Handle when a user clicks on a testimonial card
   * Closes any existing detail section, then loads and displays the new one
   */
  const handleTestimonialClick = async (testimonialId: string) => {
    // Close case study detail if open
    setIsDetailVisible(false);
    
    // If testimonial detail section is already visible, close it first with a brief delay
    if (isTestimonialDetailVisible) {
      setIsTestimonialDetailVisible(false);
      // Small delay to allow the close animation before reopening
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    await fetchTestimonialDetails(testimonialId);
  };

  return (
    <div className="case-studies-page">

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

      {/* Testimonial Carousel */}
      <TestimonialCarousel 
        onTestimonialClick={handleTestimonialClick}
      />

      {/* Testimonial Detail Section - revealed when a testimonial is clicked */}
      <TestimonialDetailSection 
        testimonial={selectedTestimonial} 
        isVisible={isTestimonialDetailVisible}
        isLoading={isTestimonialDetailLoading}
      />
    </div>
  );
};

export default CaseStudiesPage;
