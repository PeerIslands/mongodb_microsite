import '@/styles/features/about/AboutPartnership.css';

// Import partner logos
import jpmcLogo from '@/assets/about/jpmc-logo.png';
import coinbaseLogo from '@/assets/about/coinbase-logo.png';
import finastraLogo from '@/assets/about/finastra-logo.png';
import morganStanleyLogo from '@/assets/about/morgan-stanley-logo.png';
interface Award {
  value: string;
  label: string;
}

const awards: Award[] = [
  {
    value: '~200',
    label: 'MongoDB Certifications',
  },
  {
    value: '30+',
    label: 'Highest # of Professional Certs',
  },
  {
    value: '2022',
    label: 'Developer of the Year',
  },
  {
    value: '2021 • 22 • 23',
    label: 'Boutique Partner of the Year',
  },
];

interface PartnershipCapability {
  title: string;
  items: string[];
}

const partnershipCapabilities: PartnershipCapability[] = [
  {
    title: 'Launch Partner',
    items: [
      'Atlas Search',
      'Vector Search',
      'Timeseries',
      'Data Lake',
      'Migrator',
      'Serverless',
      'DevOps Toolsets',
    ],
  },
  {
    title: 'Product Dev Partner',
    items: [
      'Mongo Sync',
      'Relational Migrator',
      'DevOps Toolsets',
    ],
  },
];

interface EcosystemSection {
  title: string;
  type: 'tags' | 'logos';
  items: string[];
  logos?: { src: string; alt: string }[];
}

const ecosystemSections: EcosystemSection[] = [
  {
    title: 'Reference Implementations',
    type: 'tags',
    items: [
      'AWS',
      'Google Cloud',
      'Azure',
      'OpenShift',
      'VMware Tanzu',
      'OpenAI',
      'Diagram',
    ],
  },
  {
    title: 'Gen AI',
    type: 'tags',
    items: [
      'OpenAI',
      'Diagram'
    ],
  },
  {
    title: 'Client Experience',
    type: 'logos',
    items: [],
    logos: [
      { src: jpmcLogo, alt: 'JPMorgan Chase & Co.' },
      { src: coinbaseLogo, alt: 'Coinbase' },
      { src: finastraLogo, alt: 'Finastra' },
      { src: morganStanleyLogo, alt: 'Morgan Stanley' },
    ],
  },
];

/**
 * About Partnership Section - MongoDB strategic partnership, awards, and capabilities
 */
const AboutPartnership = () => {
  return (
    <section className="about-partnership">
      <div className="about-partnership__container">
        <div className="about-partnership__header">
          <h2 className="about-partnership__title">
            Strategic Partnership with MongoDB
          </h2>
          <p className="about-partnership__subtitle">
            Go-to partner for building AI solutions on MongoDB
          </p>
        </div>

        <div className="about-partnership__content">
          <div className="about-partnership__awards-grid">
            {awards.map((award, index) => (
              <div key={index} className="about-partnership__award-card">
                <span className="about-partnership__award-value">{award.value}</span>
                <span className="about-partnership__award-label">{award.label}</span>
              </div>
            ))}
          </div>

          {/* Partnership Cards */}
          <div className="about-partnership__cards">
            {/* Partnership Capabilities Card */}
            <div className="about-partnership__card">
              <h3 className="about-partnership__card-title">Partnership Capabilities</h3>
              <div className="about-partnership__capabilities">
                {partnershipCapabilities.map((capability, index) => (
                  <div key={index} className="about-partnership__capability">
                    <h4 className="about-partnership__capability-title">{capability.title}</h4>
                    {capability.items.length > 0 && (
                      <ul className="about-partnership__capability-list">
                        {capability.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ecosystem & Clients Card */}
            <div className="about-partnership__card">
              <h3 className="about-partnership__card-title">Ecosystem & Clients</h3>
              <div className="about-partnership__ecosystem">
                {ecosystemSections.map((section, index) => (
                  <div key={index} className="about-partnership__ecosystem-section">
                    <h4 className="about-partnership__ecosystem-label">{section.title}</h4>
                    {section.type === 'tags' && section.items.length > 0 && (
                      <div className="about-partnership__partner-tags">
                        {section.items.map((item, itemIndex) => (
                          <span key={itemIndex} className="about-partnership__partner-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {section.type === 'logos' && section.logos && section.logos.length > 0 && (
                      <div className="about-partnership__partner-logos">
                        {section.logos.map((logo, logoIndex) => (
                          <img 
                            key={logoIndex}
                            src={logo.src} 
                            alt={logo.alt} 
                            className="about-partnership__partner-logo" 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPartnership;
