import '@/styles/features/case-studies/CaseStudyTestimonial.css';

export interface CaseStudyTestimonialData {
  quote: string;
  authorName: string;
  authorPosition: string;
  pdfUrl?: string;
}

interface CaseStudyTestimonialProps {
  data: CaseStudyTestimonialData;
}

/**
 * CaseStudyTestimonial - Testimonial section with quote and download CTA
 */
const CaseStudyTestimonial = ({ data }: CaseStudyTestimonialProps) => {
  const handleDownload = () => {
    if (data.pdfUrl) {
      window.open(data.pdfUrl, '_blank');
    }
  };

  return (
    <section className="case-study-testimonial">
      <div className="case-study-testimonial__container">
        {/* Quote */}
        <blockquote className="case-study-testimonial__quote">
          <p className="case-study-testimonial__quote-text">
            {data.quote}
          </p>
        </blockquote>

        {/* Author */}
        <cite className="case-study-testimonial__author">
          {data.authorPosition}
        </cite>

        {/* Download CTA */}
        {data.pdfUrl && (
          <div className="case-study-testimonial__cta">
            <button 
              className="case-study-testimonial__download-btn"
              onClick={handleDownload}
              type="button"
            >
              <span className="case-study-testimonial__download-btn-blur" />
              <span className="case-study-testimonial__download-btn-text">
                Download Full Case Study (PDF)
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CaseStudyTestimonial;

