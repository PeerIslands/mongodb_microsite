import { useState } from 'react';
import '@/styles/pages/AcceleratorsPage.css';

// Mock data for accelerators (will be replaced with API call)
const acceleratorsData = [
  {
    id: 'hbase',
    name: 'HBase → MongoDB Accelerator',
    title: 'HBase Migration Toolkit',
    subtitle: 'Automated Schema & Data Mover',
    description: 'Eliminate Hadoop Complexity Subhead: A specialized toolkit designed to intelligently map HBase column families to MongoDB document models with zero manual coding.',
    videoThumbnail: '/assets/accelerators/videos/video-thumbnail-hbase.jpg',
    metrics: [
      { value: '40%', description: 'Skip the manual ETL coding phase.' },
      { value: 'Risk-Free', description: 'Validated patterns ensure 100% data accuracy.' },
      { value: 'Cost Efficiency', description: 'Reduce TCO by moving off heavy Hadoop infrastructure.' }
    ],
    features: [
      {
        icon: '/assets/accelerators/icons/high-volume-ingestion.svg',
        title: 'High-Volume Ingestion',
        description: 'Multi-threaded parallel processing for TB-scale transfers.'
      },
      {
        icon: '/assets/accelerators/icons/validation-engine.svg',
        title: 'Validation Engine',
        description: 'Built-in row count and checksum verification.'
      },
      {
        icon: '/assets/accelerators/icons/automated-schema-mapping.svg',
        title: 'Automated Schema Mapping',
        description: 'Intelligently converts HBase Column Families to BSON.'
      },
      {
        icon: '/assets/accelerators/icons/preserves-data-fidelity.svg',
        title: 'Preserves Data Fidelity',
        description: 'Handles complex versioning and timestamps automatically.'
      }
    ],
    downloadTitle: 'Ready to accelerate your Migration?',
    downloadSubtitle: 'Technical Specifications for our automated toolkit',
    downloadFile: 'Technical Datasheet • PDF (2.4 MB)',
    downloadUrl: '#'
  },
  {
    id: 'cassandra',
    name: 'Cassandra → Mongo Toolkit',
    title: 'Cassandra Migration Toolkit',
    subtitle: 'Automated Data Transfer & Validation',
    description: 'Seamless Cassandra to MongoDB migration with intelligent schema conversion and data validation.',
    videoThumbnail: '/assets/accelerators/videos/video-thumbnail-cassandra.jpg',
    metrics: [
      { value: '50%', description: 'Faster migration with parallel processing.' },
      { value: '99.9%', description: 'Data accuracy with validation checks.' },
      { value: 'Zero Downtime', description: 'Live migration without service interruption.' }
    ],
    features: [
      {
        icon: '🔍',
        title: 'Schema Discovery',
        description: 'Automatically analyzes Cassandra table structures.'
      },
      {
        icon: '⚡',
        title: 'Fast Transfer',
        description: 'Optimized for high-throughput data movement.'
      },
      {
        icon: '🔄',
        title: 'Type Mapping',
        description: 'Intelligent CQL to BSON type conversion.'
      },
      {
        icon: '✅',
        title: 'Validation Suite',
        description: 'Comprehensive post-migration validation.'
      }
    ],
    downloadTitle: 'Ready for Cassandra Migration?',
    downloadSubtitle: 'Complete migration guide and toolkit',
    downloadFile: 'Cassandra Toolkit • PDF (3.1 MB)',
    downloadUrl: '#'
  },
  {
    id: 'cosmos',
    name: 'Cosmos → Mongo Mapping Tool',
    title: 'Cosmos DB Mapping Tool',
    subtitle: 'Azure to MongoDB Migration',
    description: 'Intelligent mapping tool for seamless Cosmos DB to MongoDB Atlas transitions with minimal downtime.',
    videoThumbnail: '/assets/accelerators/videos/video-thumbnail-cosmos.jpg',
    metrics: [
      { value: '35%', description: 'Cost reduction moving from Cosmos DB.' },
      { value: 'Auto-Sync', description: 'Real-time data synchronization during migration.' },
      { value: 'API Compatible', description: 'Maintains API compatibility during transition.' }
    ],
    features: [
      {
        icon: '🌐',
        title: 'Azure Integration',
        description: 'Native Azure Cosmos DB connectivity.'
      },
      {
        icon: '🔄',
        title: 'Data Mapping',
        description: 'Intelligent partition key to shard key mapping.'
      },
      {
        icon: '⚡',
        title: 'Performance Tuning',
        description: 'Optimizes MongoDB configuration for workload.'
      },
      {
        icon: '📊',
        title: 'Cost Analysis',
        description: 'TCO comparison and optimization recommendations.'
      }
    ],
    downloadTitle: 'Ready to Migrate from Cosmos DB?',
    downloadSubtitle: 'Migration guide and mapping tool',
    downloadFile: 'Cosmos Mapping Tool • PDF (2.8 MB)',
    downloadUrl: '#'
  },
  {
    id: 'mcp',
    name: 'MCP-based Migration Demo',
    title: 'MCP Migration Framework',
    subtitle: 'Microservices Pattern Demo',
    description: 'Demonstrate microservices migration patterns using MCP architecture optimized for MongoDB flexibility.',
    videoThumbnail: '/assets/accelerators/videos/video-thumbnail-mcp.jpg',
    metrics: [
      { value: '60%', description: 'Faster app modernization timeline.' },
      { value: 'Scalable', description: 'Cloud-native microservices architecture.' },
      { value: 'Flexible', description: 'MongoDB document model optimization.' }
    ],
    features: [
      {
        icon: '🏗️',
        title: 'Pattern Library',
        description: 'Pre-built microservices patterns for MongoDB.'
      },
      {
        icon: '🔧',
        title: 'Service Templates',
        description: 'Ready-to-use service templates and configurations.'
      },
      {
        icon: '📦',
        title: 'Containerized',
        description: 'Docker and Kubernetes ready deployments.'
      },
      {
        icon: '🎯',
        title: 'Best Practices',
        description: 'MongoDB-optimized architectural patterns.'
      }
    ],
    downloadTitle: 'Ready to Modernize with MCP?',
    downloadSubtitle: 'Complete MCP framework and patterns',
    downloadFile: 'MCP Framework Guide • PDF (4.2 MB)',
    downloadUrl: '#'
  }
];

/**
 * Accelerators Page - Tab-based accelerator showcase (Figma Node 76-414)
 */
const AcceleratorsPage = () => {
  const [activeAccelerator, setActiveAccelerator] = useState(acceleratorsData[0]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleAcceleratorChange = (acc: typeof acceleratorsData[0]) => {
    setActiveAccelerator(acc);
    setIsVideoPlaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="accelerators-page">
      {/* Tab Navigation - Figma Node 76:414 */}
      <section className="accelerator-tabs">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeAccelerator.id === 'hbase' ? 'active' : ''}`}
            onClick={() => handleAcceleratorChange(acceleratorsData[0])}
          >
            HBase → MongoDB Accelerator
          </button>
          <div className="tabs-group">
            <button
              className={`tab-item ${activeAccelerator.id === 'cassandra' ? 'active' : ''}`}
              onClick={() => handleAcceleratorChange(acceleratorsData[1])}
            >
              Cassandra → Mongo Toolkit
            </button>
            <button
              className={`tab-item ${activeAccelerator.id === 'cosmos' ? 'active' : ''}`}
              onClick={() => handleAcceleratorChange(acceleratorsData[2])}
            >
              Cosmos → Mongo Mapping Tool
            </button>
            <button
              className={`tab-item ${activeAccelerator.id === 'mcp' ? 'active' : ''}`}
              onClick={() => handleAcceleratorChange(acceleratorsData[3])}
            >
              MCP-based Migration Demo
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="single-hero">
        <div className="single-hero-content">
          <h1 className="single-hero-title">{activeAccelerator.title}</h1>
          <p className="single-hero-subtitle">{activeAccelerator.subtitle}</p>
          <p className="single-hero-description">{activeAccelerator.description}</p>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-hero-section">
        <div className="video-hero-container">
          <div className="video-hero-wrapper">
            {!isVideoPlaying ? (
              <div className="video-thumbnail-large" onClick={() => setIsVideoPlaying(true)}>
                <img src={activeAccelerator.videoThumbnail} alt="Video preview" />
                <div className="video-overlay">
                  <button className="play-button-large">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <path d="M4 2L16 9L4 16V2Z" />
                    </svg>
                  </button>
                </div>
                <div className="video-copy-hint">Copy to Clipboard</div>
              </div>
            ) : (
              <div className="video-player-large">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title={activeAccelerator.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="metrics-section">
        <div className="metrics-container">
          {activeAccelerator.metrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <h3 className="metric-value">{metric.value}</h3>
              <p className="metric-description">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features + Download Section - Figma Node 199:161 */}
      <section className="features-detail-section">
        <div className="features-detail-container">
          {/* Features Title */}
          <h2 className="features-detail-title">Features</h2>
          
          {/* Features Grid - Left Side */}
          <div className="features-detail-grid">
            {activeAccelerator.features.map((feature, index) => (
              <div key={index} className="feature-detail-card">
                <div className="feature-detail-icon">
                  {feature.icon.endsWith('.svg') ? (
                    <img src={feature.icon} alt={feature.title} className="feature-icon-image" />
                  ) : (
                    feature.icon
                  )}
                </div>
                <h3 className="feature-detail-title-text">{feature.title}</h3>
                <p className="feature-detail-description">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Download CTA - Right Side */}
          <div className="download-cta-section">
            <div className="download-cta-container">
              <h2 className="download-cta-title">{activeAccelerator.downloadTitle}</h2>
              <p className="download-cta-subtitle">{activeAccelerator.downloadSubtitle}</p>
              <p className="download-file-info">{activeAccelerator.downloadFile}</p>
              <a href={activeAccelerator.downloadUrl} className="download-cta-button">
                Download Accelerator Spec
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AcceleratorsPage;

