import '../../../styles/features/newsletter/ContentSection.css';

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection = ({ 
  title, 
  subtitle, 
  children, 
  className = '' 
}: ContentSectionProps) => {
  return (
    <section className={`content-section ${className}`}>
      <div className="content-section-header">
        <h2 className="content-section-title">{title}</h2>
        {subtitle && <p className="content-section-subtitle">{subtitle}</p>}
      </div>
      <div className="content-section-body">
        {children}
      </div>
    </section>
  );
};

export default ContentSection;
