import '../../../styles/features/newsletter/NewsletterHeader.css';

export const NewsletterHeader = () => {
  return (
    <header className="newsletter-header">
      <div className="newsletter-header-content">
        <div className="newsletter-logo-section">
          <h1 className="newsletter-title">MongoDB & PeerAI Partnership Newsletter</h1>
          <p className="newsletter-subtitle">Driving Innovation Through Data-Driven Solutions</p>
        </div>
        <div className="newsletter-date">
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>
    </header>
  );
};

export default NewsletterHeader;
