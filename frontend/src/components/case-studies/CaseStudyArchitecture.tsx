import '@/styles/components/case-studies/CaseStudyArchitecture.css';

export interface ArchitectureColumn {
  title: string;
  description: string;
}

export interface CaseStudyArchitectureData {
  sectionTitle: string;
  subtitle: string;
  legacyColumn: ArchitectureColumn;
  targetColumn: ArchitectureColumn;
}

interface CaseStudyArchitectureProps {
  data: CaseStudyArchitectureData;
}

/**
 * CaseStudyArchitecture - Architecture comparison section
 * Shows the shift from legacy to target architecture
 */
const CaseStudyArchitecture = ({ data }: CaseStudyArchitectureProps) => {
  return (
    <section className="case-study-architecture">
      {/* Decorative glow elements */}
      <div className="case-study-architecture__glow case-study-architecture__glow--left" />
      <div className="case-study-architecture__glow case-study-architecture__glow--right" />

      <div className="case-study-architecture__container">
        {/* Section title */}
        <h2 className="case-study-architecture__title">
          {data.sectionTitle}
        </h2>

        {/* Subtitle */}
        <p className="case-study-architecture__subtitle">
          {data.subtitle}
        </p>

        {/* Columns container */}
        <div className="case-study-architecture__columns">
          {/* Legacy column */}
          <div className="case-study-architecture__column case-study-architecture__column--legacy">
            <div className="case-study-architecture__column-inner">
              <span className="case-study-architecture__column-title">
                {data.legacyColumn.title}
              </span>
              <p className="case-study-architecture__column-description">
                {data.legacyColumn.description}
              </p>
            </div>
          </div>

          {/* Target column */}
          <div className="case-study-architecture__column case-study-architecture__column--target">
            <div className="case-study-architecture__column-inner">
              <span className="case-study-architecture__column-title">
                {data.targetColumn.title}
              </span>
              <p className="case-study-architecture__column-description">
                {data.targetColumn.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudyArchitecture;


