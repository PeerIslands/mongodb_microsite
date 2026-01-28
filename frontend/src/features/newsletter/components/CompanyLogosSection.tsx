import '../../../styles/features/newsletter/CompanyLogosSection.css';

export const CompanyLogosSection = () => {
  const companies = [
    { name: 'CVS', logo: 'CVS' },
    { name: 'T-Mobile', logo: 'T-Mobile' },
    { name: 'FICO', logo: 'FICO' },
    { name: 'Target', logo: 'Target' },
  ];

  return (
    <section className="company-logos-section">
      <div className="section-header">
        <h2>Trusted by Industry Leaders</h2>
        <p>Partnering with organizations that drive innovation</p>
      </div>
      <div className="company-logos-grid">
        {companies.map((company) => (
          <div key={company.name} className="company-logo-card">
            <div className="company-logo-placeholder">
              <span>{company.logo}</span>
            </div>
            <p className="company-name">{company.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompanyLogosSection;
