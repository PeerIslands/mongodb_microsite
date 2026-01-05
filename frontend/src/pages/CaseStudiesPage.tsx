import '@/styles/pages/CaseStudiesPage.css';

// Image assets
const imgLayer12 = "/assets/case-studies-new/a00874ec357d32de3a0d3a617f907a1da3a07b88.png";
const imgImage7 = "/assets/case-studies-new/1992af9511ede106c0908c9e30a9386f55d2cc82.png";
const imgImage3 = "/assets/case-studies-new/c70fc2801acfe42d15a61803ec00aa2b035e32b4.png";
const imgImage2 = "/assets/case-studies-new/99d2e399b777d4a0dde9a45b4c3ff7b4d2b790eb.png";
const imgFrame1000005948 = "/assets/case-studies-new/a401ec2944fcba6806c218c1611a5a559a7bfe1a.svg";
const imgFrame1000005949 = "/assets/case-studies-new/a68befd4fe716f2d231406079dc34da3498d95a7.svg";
const imgLine1 = "/assets/case-studies-new/c5856a59e1303e46c0d0b7ea6c2a0c4b392318b5.svg";
const imgFrame = "/assets/case-studies-new/4d0ced906c95d14e4492ca441650b1b2fb686eaf.svg";
const imgVector = "/assets/case-studies-new/5867f5b1dcf982e39477dd64d1e05b0045792c21.svg";
const imgVector1 = "/assets/case-studies-new/012b6c0e3ac25a90c78ce51c6fd2f886eb353e68.svg";

/**
 * Case Studies Detail Page - Healthcare Case Study
 * Real-Time Prescription Eligibility at Scale
 */
const CaseStudiesPage = () => {
  return (
    <div className="case-studies-container">
      {/* Background decorative layers */}
      <div className="bg-layer bg-layer-1">
        <img src={imgLayer12} alt="" />
      </div>
      <div className="bg-layer bg-layer-2">
        <img src={imgLayer12} alt="" />
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <img src={imgImage7} alt="" className="hero-bg-image" />
        
        <div className="hero-content">
          <div className="industry-badge">Healthcare & Life Sciences</div>
          <h1 className="hero-title">Real-Time Prescription Eligibility at Scale</h1>
          <p className="hero-subtitle">Major Healthcare Conglomerate</p>
          <p className="hero-description">
            How a Fortune 500 Conglomerate cut data processing from 4 hours to 4 minutes by 
            migrating from legacy DB2 to MongoDB Atlas.
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="statistics-section">
        <div className="stat-item">
          <h2 className="stat-value">98%</h2>
          <p className="stat-label">Time Reduction</p>
        </div>
        <div className="stat-item">
          <h2 className="stat-value">4 Min</h2>
          <p className="stat-label">Ingestion Speed</p>
        </div>
        <div className="stat-item">
          <h2 className="stat-value">100%</h2>
          <p className="stat-label">Data Accuracy</p>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="architecture-section">
        <h2 className="section-title">From Batch Bottlenecks to Real-Time Streams</h2>
        <p className="section-subtitle">
          Visualizing the shift from a rigid DB2 legacy environment to an event-driven MongoDB Atlas architecture.
        </p>

        <div className="architecture-diagrams">
          <div className="diagram-item">
            <h3 className="diagram-title">LEGACY CONSTRAINT: DB2 BATCH</h3>
            <img src={imgFrame1000005948} alt="Legacy DB2 Architecture" className="diagram-image" />
            <p className="diagram-description">
              Relying on legacy DB2 batch jobs created a critical data lag. Files took 4 hours to process, 
              forcing retail pharmacies to dispense prescriptions based on outdated patient coverage.
            </p>
          </div>

          <div className="diagram-item">
            <h3 className="diagram-title">TARGET ARCHITECTURE: ATLAS + KAFKA</h3>
            <img src={imgFrame1000005949} alt="MongoDB Atlas Architecture" className="diagram-image diagram-flipped" />
            <p className="diagram-description">
              A complete re-architecture to MongoDB Atlas on GCP. By decoupling the monolith and utilizing 
              Kafka event streaming, we enabled instant data availability for millions of patients.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <p className="impact-quote">
          By modernizing a mission‑critical eligibility system, pharmacies and business units receive 
          timely, accurate data. Customer experience improves with correct Rx pricing and coverage.
        </p>
        <p className="impact-attribution">Healthcare IT Director</p>
      </section>

      {/* Download CTA */}
      <div className="download-cta">
        <button className="download-btn">Download Full Case Study (PDF)</button>
      </div>

      {/* Related Case Studies */}
      <section className="related-studies">
        <div className="study-card">
          <div className="card-glow"></div>
          <div className="card-badge">Fintech</div>
          <h3 className="card-title">Revolutionizing Payments</h3>
          <p className="card-metric">12x Faster<br />Development</p>
          <p className="card-details">80% Less Testing Effort<br />5x Documentation Boost</p>
          <p className="card-description">
            Migrated complex payment workflows to an AI-native architecture, reducing release cycles 
            from months to weeks.
          </p>
          <a href="#" className="card-link">
            Read Success Story
            <img src={imgFrame} alt="" />
          </a>
        </div>

        <div className="study-card">
          <div className="card-glow"></div>
          <div className="card-badge">CPG / Retail</div>
          <h3 className="card-title">Unprecedented Velocity</h3>
          <p className="card-metric">94%<br />Performance Gain</p>
          <p className="card-details">6 Apps Delivered in 3 Months<br />3x Faster Asset Search</p>
          <p className="card-description">
            Modernized the creative asset platform, enabling real-time search and retrieval for global design teams.
          </p>
          <a href="#" className="card-link">
            Read Success Story
            <img src={imgFrame} alt="" />
          </a>
        </div>

        <div className="study-card">
          <div className="card-glow"></div>
          <div className="card-badge">Healthcare Startup</div>
          <h3 className="card-title">AI-Native Transformation</h3>
          <p className="card-metric">60% Faster<br />Go-to-Market</p>
          <p className="card-details">10x Code Gen Speed<br />85% Manual Work Removed</p>
          <p className="card-description">
            Compressed the product roadmap for a Revenue Cycle Management startup using agentic AI workflows.
          </p>
          <a href="#" className="card-link">
            Read Success Story
            <img src={imgFrame} alt="" />
          </a>
        </div>
      </section>

      {/* View All CTA */}
      <div className="view-all-cta">
        <button className="view-all-btn">View all case study</button>
      </div>

      {/* Footer */}
      <footer className="case-study-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={imgImage2} alt="PeerAI" className="logo-peerai" />
                <img src={imgLine1} alt="" className="logo-divider" />
                <img src={imgImage3} alt="MongoDB" className="logo-mongodb" />
              </div>
              <div className="footer-social">
                <a href="#"><img src={imgVector} alt="Discord" /></a>
                <a href="#"><img src={imgVector1} alt="Twitter" /></a>
              </div>
            </div>

            <div className="footer-nav">
              <div className="footer-nav-group">
                <h4>Product</h4>
                <ul>
                  <li><a href="#">Features</a></li>
                  <li><a href="#">Integrations</a></li>
                  <li><a href="#">Pricing</a></li>
                  <li><a href="#">Changelog</a></li>
                  <li><a href="#">Roadmap</a></li>
                </ul>
              </div>

              <div className="footer-nav-group">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">Our team</a></li>
                  <li><a href="#">Our values</a></li>
                  <li><a href="#">Blog</a></li>
                </ul>
              </div>

              <div className="footer-nav-group">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Downloads</a></li>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-text">
              <h3>Join our newsletter</h3>
              <p>Keep up to date with everything Reflect</p>
            </div>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <span>·</span>
              <a href="#">Terms of Conditions</a>
            </div>
            <div className="footer-copyright">
              <p>PeerAI, LLC. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CaseStudiesPage;

