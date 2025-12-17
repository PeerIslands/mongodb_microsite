import '@/styles/components/CaseStudies.css';
import caseStudiesBg from '@/assets/case-studies-bg.png';
import arrowIcon from '@/assets/case-studies-arrow.svg';
import caseStudyCard1 from '@/assets/case-study-card-1.png';
import caseStudyCard2 from '@/assets/case-study-card-2.png';

const CaseStudies = () => {
  return (
    <section className="case-studies">
      {/* Background image - matches Figma node 17:1577 */}
      <div className="case-studies-background">
        <img 
          src={caseStudiesBg} 
          alt="" 
          className="case-studies-bg-image"
          onError={(e) => {
            console.error('Failed to load case studies background image:', e);
          }}
          onLoad={() => {
            console.log('Case studies background image loaded successfully');
          }}
        />
      </div>
      
      {/* Title - matches Figma node 17:1578 */}
      <h2 className="case-studies-title">
        <span>Featured</span>
        <span>Case Studies</span>
      </h2>
      
      {/* First case study card - matches Figma node 17:1404 */}
      <div className="case-study-card case-study-card-1">
        {/* Gradient overlay - matches Figma node 17:1405 */}
        <div className="case-study-card-gradient"></div>
        
        {/* Card image container - matches Figma node 17:1406 */}
        <div className="case-study-card-image-container">
          <img src={caseStudyCard1} alt="" className="case-study-card-image" />
        </div>
        
        {/* Button container - matches Figma node 17:1407 */}
        <div className="case-study-button-container">
          {/* Button with arrow - matches Figma node 17:1408 */}
          <a href="#" className="case-study-button">
            <div className="case-study-button-icon">
              <img src={arrowIcon} alt="" className="case-study-arrow" />
            </div>
          </a>
        </div>
      </div>
      
      {/* Second case study card - matches Figma node 17:1435 */}
      <div className="case-study-card case-study-card-2">
        {/* Gradient overlay - matches Figma node 17:1436 */}
        <div className="case-study-card-gradient"></div>
        
        {/* Card image container - matches Figma node 17:1437 */}
        <div className="case-study-card-image-container">
          <img src={caseStudyCard2} alt="" className="case-study-card-image" />
        </div>
        
        {/* Button container - matches Figma node 17:1438 */}
        <div className="case-study-button-container">
          {/* Button with arrow - matches Figma node 17:1439 */}
          <a href="#" className="case-study-button">
            <div className="case-study-button-icon">
              <img src={arrowIcon} alt="" className="case-study-arrow" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
