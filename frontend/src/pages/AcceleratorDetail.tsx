import { useState, useEffect } from 'react';
import '@/styles/pages/AcceleratorDetail.css';
import Header from '@/features/home/components/Header';
import Footer from '@/features/home/components/Footer';
import FeaturesSection from '@/features/accelerators/components/FeaturesSection';
import BenefitsSection from '@/features/accelerators/components/BenefitsSection';
import DemoVideoSection from '@/features/accelerators/components/DemoVideoSection';
import DownloadSection from '@/features/accelerators/components/DownloadSection';

// Mock data
const mockAcceleratorData = {
  id: '1',
  slug: 'hbase-mongodb-accelerator',
  name: 'HBase → MongoDB Accelerator',
  tagline: 'Automated migration toolkit for seamless HBase to MongoDB Atlas transition',
  logo: '/assets/accelerators/logos/logo-hbase.png',
  heroImage: '/assets/accelerators/heroes/hero-hbase.jpg',
  
  overview: {
    description: 'Our HBase to MongoDB Accelerator is a comprehensive toolkit designed to streamline and automate your migration journey. With intelligent schema discovery, automated data mapping, and real-time synchronization capabilities, we reduce migration time by 40% while ensuring 99.9% data accuracy. Built by migration experts with years of experience, this accelerator handles the complexity of transforming HBase column families into MongoDB\'s flexible document model.',
    use_cases: [
      'Enterprise data warehouse migrations',
      'Real-time analytics platform transitions',
      'Big data modernization projects',
      'Cloud migration initiatives'
    ],
    ideal_for: [
      'Organizations running HBase in production',
      'Teams planning cloud migration',
      'Companies seeking to modernize their data stack',
      'Enterprises needing zero-downtime migrations'
    ],
    tech_stack: ['HBase', 'MongoDB Atlas', 'Apache Spark', 'Python', 'Kubernetes']
  },
  
  features: [
    {
      icon: '🔍',
      title: 'Automated Schema Discovery',
      description: 'Automatically analyzes your HBase table structures, column families, and qualifiers to generate an optimized MongoDB schema design. Identifies patterns and suggests denormalization strategies.'
    },
    {
      icon: '🔄',
      title: 'Intelligent Data Mapping',
      description: 'Smart mapping engine that converts HBase row keys, column families, and qualifiers into MongoDB documents. Handles complex data types, timestamps, and nested structures seamlessly.'
    },
    {
      icon: '⚡',
      title: 'Real-time Incremental Sync',
      description: 'Continuous data synchronization during migration ensures zero data loss and enables gradual cutover. Monitor sync progress in real-time with detailed dashboards.'
    },
    {
      icon: '✅',
      title: 'Data Validation Engine',
      description: 'Comprehensive validation suite that verifies data integrity post-migration. Automated checks for row counts, data types, and business logic consistency.'
    },
    {
      icon: '📊',
      title: 'Performance Optimization',
      description: 'Built-in profiling and optimization recommendations. Automatically creates indexes, optimizes document structures, and suggests sharding strategies for scale.'
    },
    {
      icon: '🛡️',
      title: 'Rollback & Recovery',
      description: 'Safe migration with automated rollback capabilities. Create checkpoints, test migrations, and recover quickly if needed. Full audit trail of all operations.'
    }
  ],
  
  benefits: [
    {
      title: '40% Faster Migration',
      metric: '40%',
      description: 'Reduce your migration timeline significantly with automated tools',
      category: 'Time'
    },
    {
      title: '99.9% Data Accuracy',
      metric: '99.9%',
      description: 'Ensure complete data fidelity with validation checks',
      category: 'Performance'
    },
    {
      title: 'Zero Downtime',
      metric: '0 hrs',
      description: 'Migrate without service interruption using incremental sync',
      category: 'Risk'
    },
    {
      title: '50% Cost Reduction',
      metric: '50%',
      description: 'Lower TCO with MongoDB Atlas cloud-native architecture',
      category: 'Cost'
    }
  ],
  
  demo_video: {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/assets/accelerators/videos/video-thumbnail-hbase.jpg',
    duration: '8:45',
    title: 'HBase to MongoDB Migration Walkthrough'
  },
  
  downloads: [
    {
      id: '1',
      name: 'HBase Migration Toolkit v2.3',
      description: 'Complete toolkit including CLI tools, schema analyzer, and migration scripts',
      file_url: '/downloads/hbase-toolkit-v2.3.zip',
      file_type: 'zip',
      file_size: '45 MB',
      version: '2.3.0',
      release_date: '2024-12-01',
      download_count: 1234
    },
    {
      id: '2',
      name: 'Migration Guide PDF',
      description: 'Step-by-step migration guide with best practices and troubleshooting',
      file_url: '/downloads/hbase-migration-guide.pdf',
      file_type: 'pdf',
      file_size: '8 MB',
      version: '2.0',
      release_date: '2024-11-15',
      download_count: 2456
    }
  ],
  
  technical_specs: {
    supported_versions: ['HBase 1.x', 'HBase 2.x'],
    prerequisites: ['Java 8+', 'Python 3.8+', 'MongoDB Atlas account', 'Network access to HBase cluster'],
    limitations: ['Requires read access to HBase', 'Large datasets may need staged migration'],
    compatibility: ['Linux', 'macOS', 'Docker', 'Kubernetes']
  },
  
  documentation: {
    getting_started_url: 'https://docs.example.com/hbase/quickstart',
    full_docs_url: 'https://docs.example.com/hbase',
    api_reference_url: 'https://docs.example.com/hbase/api',
    github_url: 'https://github.com/example/hbase-accelerator',
    support_url: 'https://support.example.com'
  }
};

const AcceleratorDetail = () => {
  // Extract slug from URL pathname
  const slug = window.location.pathname.split('/accelerators/')[1];
  const [accelerator, setAccelerator] = useState(mockAcceleratorData);

  useEffect(() => {
    // In production, fetch accelerator data by slug
    // const data = await fetch(`/api/v1/accelerators/${slug}`);
    console.log('Loading accelerator:', slug);
  }, [slug]);

  return (
    <div className="accelerator-detail">
      <Header />
      
      {/* Hero Section */}
      <section className="detail-hero">
        <div className="detail-hero-content">
          <div className="hero-logo">
            <img src={accelerator.logo} alt={`${accelerator.name} logo`} />
          </div>
          <h1 className="detail-title">{accelerator.name}</h1>
          <p className="detail-tagline">{accelerator.tagline}</p>
          <div className="hero-ctas">
            <a href="#downloads" className="btn-primary-detail">
              Download Toolkit
            </a>
            <a href={accelerator.documentation.getting_started_url} className="btn-secondary-detail">
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="detail-overview">
        <div className="detail-container">
          <h2 className="section-heading">Overview</h2>
          <p className="overview-description">{accelerator.overview.description}</p>
          
          <div className="overview-grid">
            <div className="overview-card">
              <h3 className="overview-card-title">Use Cases</h3>
              <ul className="overview-list">
                {accelerator.overview.use_cases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>
            
            <div className="overview-card">
              <h3 className="overview-card-title">Ideal For</h3>
              <ul className="overview-list">
                {accelerator.overview.ideal_for.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="overview-card">
              <h3 className="overview-card-title">Tech Stack</h3>
              <div className="tech-tags">
                {accelerator.overview.tech_stack.map((tech, index) => (
                  <span key={index} className="tech-tag">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection features={accelerator.features} />

      {/* Benefits Section */}
      <BenefitsSection benefits={accelerator.benefits} />

      {/* Demo Video Section */}
      <DemoVideoSection video={accelerator.demo_video} />

      {/* Technical Specifications */}
      <section className="detail-technical">
        <div className="detail-container">
          <h2 className="section-heading">Technical Specifications</h2>
          <div className="technical-grid">
            <div className="technical-card">
              <h3 className="technical-title">Supported Versions</h3>
              <ul className="technical-list">
                {accelerator.technical_specs.supported_versions.map((version, index) => (
                  <li key={index}>{version}</li>
                ))}
              </ul>
            </div>
            
            <div className="technical-card">
              <h3 className="technical-title">Prerequisites</h3>
              <ul className="technical-list">
                {accelerator.technical_specs.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
            
            <div className="technical-card">
              <h3 className="technical-title">Compatibility</h3>
              <div className="compatibility-tags">
                {accelerator.technical_specs.compatibility.map((platform, index) => (
                  <span key={index} className="compatibility-tag">{platform}</span>
                ))}
              </div>
            </div>
            
            <div className="technical-card">
              <h3 className="technical-title">Limitations</h3>
              <ul className="technical-list">
                {accelerator.technical_specs.limitations.map((limitation, index) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <DownloadSection 
        downloads={accelerator.downloads} 
        documentation={accelerator.documentation}
      />

      <Footer />
    </div>
  );
};

export default AcceleratorDetail;

