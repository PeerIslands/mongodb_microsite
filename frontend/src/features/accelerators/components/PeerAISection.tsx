import '@/styles/features/accelerators/PeerAISection.css';

const PeerAISection = () => {
  const handleExploreClick = () => {
    const acceleratorTabs = document.querySelector('.accelerator-tabs');
    if (acceleratorTabs) {
      acceleratorTabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const capabilities = [
    'Automated legacy code & schema discovery',
    'AI-assisted architecture & service design',
    'Code generation & refactoring',
    'Test generation & validation',
    'Migration co-pilots with rollback safety',
    'Documentation & knowledge extraction',
  ];

  const deliveryModel = [
    'Senior architects & polyglot engineers',
    'PeerAI acceleration Bots',
    'Outcome-driven delivery pods',
  ];

  return (
    <section className="peerai-section">
      <div className="peerai-container">
        {/* Header */}
        <div className="peerai-header">
          <h2 className="peerai-title">
            PeerAI <span className="peerai-title-gradient">Accelerated Modernization</span> Platform
          </h2>
          <p className="peerai-tagline">
            Deliver Modernization Faster — Without Cutting Corners using PeerAI
          </p>
          <p className="peerai-description">
            A proprietary suite of AI agents that accelerates modernization across the SDLC.
          </p>
        </div>

        {/* Content Grid */}
        <div className="peerai-content-grid">
          {/* Capabilities Card */}
          <div className="peerai-card">
            <div className="peerai-card-header">
              <div className="peerai-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="peerai-card-title">Capabilities</h3>
            </div>
            <ul className="peerai-list">
              {capabilities.map((item, index) => (
                <li key={index} className="peerai-list-item">
                  <span className="peerai-list-bullet" />
                  <span className="peerai-list-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Model Card */}
          <div className="peerai-card">
            <div className="peerai-card-header">
              <div className="peerai-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="peerai-card-title">Service as Software POD Delivery</h3>
            </div>
            <p className="peerai-card-subtitle">
              Executed through a blended model combining:
            </p>
            <ul className="peerai-list">
              {deliveryModel.map((item, index) => (
                <li key={index} className="peerai-list-item">
                  <span className="peerai-list-bullet" />
                  <span className="peerai-list-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Explore Button */}
        <div className="peerai-cta">
          <button className="peerai-explore-button" onClick={handleExploreClick}>
            Explore Accelerators
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PeerAISection;
