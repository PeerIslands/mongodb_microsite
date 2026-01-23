import '@/styles/features/about/AboutCertifications.css';

interface Certification {
  count: string;
  label: string;
}

const certifications: Certification[] = [
  {
    count: '200+',
    label: 'MongoDB Certifications',
  },
  {
    count: '30+',
    label: 'Confluent Developer Certifications',
  },
  {
    count: '75+',
    label: 'Databricks Spark Developer Certifications',
  },
  {
    count: '65+',
    label: 'AWS Certifications',
  },
  {
    count: '50+',
    label: 'Azure Certifications',
  },
  {
    count: '25+',
    label: 'GCP Certifications',
  },
];

/**
 * About Certifications Section - Certification stats with logos
 */
const AboutCertifications = () => {
  return (
    <section className="about-certifications">
      <div className="about-certifications__container">
        <h2 className="about-certifications__title">
          Our Expert Engineering Workforce
        </h2>
        <div className="about-certifications__grid">
          {certifications.map((cert, index) => (
            <div key={index} className="about-certifications__item">
              <span className="about-certifications__count">{cert.count}</span>
              <span className="about-certifications__label">{cert.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutCertifications;
