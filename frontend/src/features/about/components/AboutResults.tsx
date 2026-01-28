import '@/styles/features/about/AboutResults.css';

interface ResultStat {
  value: string;
  label: string;
}

const resultStats: ResultStat[] = [
  {
    value: '100+',
    label: 'Modernization projects delivered',
  },
  {
    value: '75%',
    label: 'Average accelerations achieved on projects',
  },
  {
    value: '10+',
    label: 'Prebuilt Accelerators & newer ones in works',
  },
];

/**
 * About Results Section - Proven results statistics
 */
const AboutResults = () => {
  return (
    <section className="about-results">
      <div className="about-results__container">
        <h2 className="about-results__title">
          Significant Experience Executing Complex Engagements in Mission Critical Situations
        </h2>
        <div className="about-results__grid">
          {resultStats.map((stat, index) => (
            <div key={index} className="about-results__stat">
              <span className="about-results__stat-value">{stat.value}</span>
              <span className="about-results__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutResults;
