import '@/styles/features/about/AboutPartnerships.css';

// Import award images
import testRigorLogo from '@/assets/about/test-rigor-logo.png';
import microsoftLogo from '@/assets/about/microsoft-logo.svg';
import googleCloudLogo from '@/assets/about/google-cloud-logo.png';
import awsLogo from '@/assets/about/aws-logo.png';
import arizeLogo from '@/assets/about/arize-logo.png';
import temporalLogo from '@/assets/about/temporal-logo.png';

/**
 * About Partnerships Section - AI Native partnerships and badges
 */
const AboutPartnerships = () => {
  return (
    <section className="about-partnerships">
      <div className="about-partnerships__container">
        <h2 className="about-partnerships__title">
          Our AI Native Partnerships
        </h2>
        <p className="about-partnerships__subtitle">
          That enable and accelerate transformation
        </p>

        <div className="about-partnerships__logos">
          <img src={microsoftLogo} alt="Microsoft Partner" className="about-partnerships__logo" />
          <img src={temporalLogo} alt="Temporal Partner" className="about-partnerships__logo about-partnerships__logo-secondary" />
          <img src={googleCloudLogo} alt="Google Cloud Partner" className="about-partnerships__logo" />
          <img src={awsLogo} alt="AWS Partner" className="about-partnerships__logo about-partnerships__logo-secondary" />
          <img src={arizeLogo} alt="Arize Partner" className="about-partnerships__logo about-partnerships__logo-secondary" />
          <img src={testRigorLogo} alt="Test Rigor Partner" className="about-partnerships__logo about-partnerships__logo-secondary" />
        </div>
      </div>
    </section>
  );
};

export default AboutPartnerships;
