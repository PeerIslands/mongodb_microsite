import '@/styles/features/home/Capabilities.css';
import { useNavigate } from 'react-router-dom';
import image4 from '@/assets/image 4.png';
import image5 from '@/assets/image 5.png';
import image6 from '@/assets/image 6.png';
import offeringImage1 from '@/assets/offering_image_1.png';
import offeringImage2 from '@/assets/offerings_image_2.png';
import offeringImage3 from '@/assets/offerings_image_3.png';

const Capabilities = () => {
  const navigate = useNavigate();

  const capabilities = [
    {
      title: 'Application Modernization',
      image: image4,
      section: 'application-modernization',
    },
    {
      title: 'Data & Database Modernization',
      image: image5,
      section: 'data-database-modernization',
    },
    {
      title: 'AI-Native Products',
      image: image6,
      section: 'ai-native-products',
    },
    {
      title: 'AI Quality Engineering & Testing',
      image: offeringImage1,
      section: 'ai-quality-engineering-testing',
    },
    {
      title: 'Data Engineering & Platforms',
      image: offeringImage2,
      section: 'data-engineering-platforms',
    },
    {
      title: 'AI Consulting & Governance',
      image: offeringImage3,
      section: 'ai-consulting-governance',
    },
  ];

  const handleCardClick = (section: string) => {
    navigate(`/offerings#${section}`);
  };

  return (
    <section id="capabilities" className="capabilities">
      <div className="capabilities-content">
        <div className="capabilities-header">
          <h2 className="section-title">End-to-End Modernization Capabilities</h2>
          <p className="section-description">
            From legacy migration to cloud-native architecture, we deliver predictable outcomes using our proven framework.
          </p>
        </div>
        <div className="capabilities-grid">
          {capabilities.map((capability, index) => (
            <div 
              key={index} 
              className="capability-card"
              onClick={() => handleCardClick(capability.section)}
            >
              <div className="capability-card__glow"></div>
              <div className="capability-image-container">
                <img src={capability.image} alt={capability.title} className="capability-image" />
              </div>
              <h3 className="capability-title">{capability.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Capabilities;


