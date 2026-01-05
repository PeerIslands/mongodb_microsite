import { useState } from 'react';
import '@/styles/pages/AcceleratorsShowcase.css';
import Header from '@/features/home/components/Header';
import Footer from '@/features/home/components/Footer';
import AcceleratorCard from '../components/accelerators/AcceleratorCard';
import AcceleratorFilters from '../components/accelerators/AcceleratorFilters';

interface FilterState {
  search: string;
  category: string;
  sourceTech: string;
  status: string;
}

// Mock data - will be replaced with API calls
const mockAccelerators = [
  {
    id: '1',
    slug: 'hbase-mongodb-accelerator',
    name: 'HBase → MongoDB Accelerator',
    tagline: 'Automated migration toolkit for seamless HBase to MongoDB Atlas transition',
    category: 'Migration',
    sourceTech: 'HBase',
    targetTech: 'MongoDB Atlas',
    cardImage: '/assets/accelerators/cards/accelerator-hbase.png',
    logo: '/assets/accelerators/logos/logo-hbase.png',
    status: 'active',
    featured: true,
    downloads: 1234,
    views: 5678
  },
  {
    id: '2',
    slug: 'cassandra-mongodb-toolkit',
    name: 'Cassandra → MongoDB Toolkit',
    tagline: 'Comprehensive migration suite for Cassandra to MongoDB database transformation',
    category: 'Migration',
    sourceTech: 'Cassandra',
    targetTech: 'MongoDB Atlas',
    cardImage: '/assets/accelerators/cards/accelerator-cassandra.png',
    logo: '/assets/accelerators/logos/logo-cassandra.png',
    status: 'active',
    featured: true,
    downloads: 892,
    views: 4234
  },
  {
    id: '3',
    slug: 'cosmos-mongodb-mapping',
    name: 'Cosmos DB → MongoDB Mapping Tool',
    tagline: 'Intelligent schema mapping and data synchronization for Cosmos DB migrations',
    category: 'Migration',
    sourceTech: 'Cosmos DB',
    targetTech: 'MongoDB Atlas',
    cardImage: '/assets/accelerators/cards/accelerator-cosmos.png',
    logo: '/assets/accelerators/logos/logo-cosmos.png',
    status: 'active',
    featured: false,
    downloads: 567,
    views: 2891
  },
  {
    id: '4',
    slug: 'mcp-migration-demo',
    name: 'MCP-based Migration Demo',
    tagline: 'Microservices migration pattern demonstration with MongoDB optimization',
    category: 'Modernization',
    sourceTech: 'Monolithic',
    targetTech: 'Microservices',
    cardImage: '/assets/accelerators/cards/accelerator-mcp.png',
    logo: '/assets/accelerators/logos/logo-mcp.png',
    status: 'active',
    featured: false,
    downloads: 445,
    views: 1789
  }
];

const AcceleratorsShowcase = () => {
  const [accelerators] = useState(mockAccelerators);
  const [filteredAccelerators, setFilteredAccelerators] = useState(mockAccelerators);

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...accelerators];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(acc => acc.category === filters.category);
    }

    if (filters.sourceTech && filters.sourceTech !== 'all') {
      filtered = filtered.filter(acc => acc.sourceTech === filters.sourceTech);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(acc => acc.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(acc => 
        acc.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        acc.tagline.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredAccelerators(filtered);
  };

  return (
    <div className="accelerators-showcase">
      <Header />
      
      {/* Hero Section */}
      <section className="showcase-hero">
        <div className="showcase-hero-content">
          <h1 className="showcase-title">Reusable IP Accelerators</h1>
          <p className="showcase-description">
            Accelerate your MongoDB migration and modernization with our proven toolkits. 
            Reduce project timelines by up to 40% with automated migration and validation tools.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="showcase-main">
        <div className="showcase-container">
          {/* Filters */}
          <AcceleratorFilters onFilterChange={handleFilterChange} />

          {/* Results Count */}
          <div className="results-header">
            <h2 className="results-count">
              {filteredAccelerators.length} {filteredAccelerators.length === 1 ? 'Accelerator' : 'Accelerators'}
            </h2>
            <p className="results-description">
              {filteredAccelerators.length === accelerators.length 
                ? 'Showing all available accelerators' 
                : 'Filtered results'}
            </p>
          </div>

          {/* Accelerators Grid */}
          <div className="accelerators-grid">
            {filteredAccelerators.map(accelerator => (
              <AcceleratorCard key={accelerator.id} accelerator={accelerator} />
            ))}
          </div>

          {/* Empty State */}
          {filteredAccelerators.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No accelerators found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </section>

      {/* Download CTA Section - Figma Node 204-174 (Group 1000005950) */}
      <section className="showcase-cta-section">
        <div className="showcase-cta-container">
          <h2 className="showcase-cta-title">Ready to accelerate your Migration?</h2>
          <p className="showcase-cta-subtitle">Technical Specifications for our automated tooltik</p>
          <p className="showcase-cta-file-info">Technical Datasheet • PDF (2.4 MB)</p>
          <div className="showcase-cta-button-wrapper">
            <a href="/downloads/accelerator-spec.pdf" className="showcase-cta-button">
              <span className="showcase-cta-button-text">Download Accelerator Spec</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AcceleratorsShowcase;

