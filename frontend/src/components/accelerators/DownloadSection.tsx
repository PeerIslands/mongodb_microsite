import '@/styles/components/accelerators/DownloadSection.css';

interface Download {
  id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  version: string;
  release_date: string;
  download_count: number;
}

interface Documentation {
  getting_started_url: string;
  full_docs_url: string;
  api_reference_url: string;
  github_url: string;
  support_url: string;
}

interface DownloadSectionProps {
  downloads: Download[];
  documentation: Documentation;
}

const DownloadSection = ({ downloads, documentation }: DownloadSectionProps) => {
  const handleDownload = (download: Download) => {
    // Track download analytics
    console.log('Download:', download.name);
    // In production: window.open(download.file_url, '_blank');
    alert(`Downloading: ${download.name}\n(${download.file_size})`);
  };

  return (
    <section id="downloads" className="download-section">
      <div className="download-container">
        <h2 className="section-heading">Downloads & Resources</h2>
        
        {/* Download Cards */}
        <div className="downloads-grid">
          {downloads.map((download) => (
            <div key={download.id} className="download-card">
              <div className="download-icon">
                {download.file_type === 'zip' && '📦'}
                {download.file_type === 'pdf' && '📄'}
                {download.file_type === 'exe' && '⚙️'}
              </div>
              <div className="download-content">
                <h3 className="download-name">{download.name}</h3>
                <p className="download-description">{download.description}</p>
                
                <div className="download-meta">
                  <span className="meta-badge">v{download.version}</span>
                  <span className="meta-item">{download.file_size}</span>
                  <span className="meta-item">{download.file_type.toUpperCase()}</span>
                </div>
                
                <div className="download-stats">
                  <span className="download-count">
                    📥 {download.download_count.toLocaleString()} downloads
                  </span>
                  <span className="release-date">
                    Released: {new Date(download.release_date).toLocaleDateString()}
                  </span>
                </div>
                
                <button 
                  className="download-button"
                  onClick={() => handleDownload(download)}
                >
                  <span>Download Now</span>
                  <span className="download-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Documentation Links */}
        <div className="documentation-section">
          <h3 className="documentation-title">Documentation & Support</h3>
          <div className="documentation-grid">
            <a href={documentation.getting_started_url} className="doc-link">
              <div className="doc-icon">🚀</div>
              <div className="doc-content">
                <h4>Quick Start Guide</h4>
                <p>Get up and running in minutes</p>
              </div>
            </a>
            
            <a href={documentation.full_docs_url} className="doc-link">
              <div className="doc-icon">📚</div>
              <div className="doc-content">
                <h4>Full Documentation</h4>
                <p>Complete reference and guides</p>
              </div>
            </a>
            
            <a href={documentation.api_reference_url} className="doc-link">
              <div className="doc-icon">🔧</div>
              <div className="doc-content">
                <h4>API Reference</h4>
                <p>Detailed API documentation</p>
              </div>
            </a>
            
            <a href={documentation.github_url} className="doc-link">
              <div className="doc-icon">💻</div>
              <div className="doc-content">
                <h4>GitHub Repository</h4>
                <p>View source code and contribute</p>
              </div>
            </a>
            
            <a href={documentation.support_url} className="doc-link">
              <div className="doc-icon">💬</div>
              <div className="doc-content">
                <h4>Support & Community</h4>
                <p>Get help from experts</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;


