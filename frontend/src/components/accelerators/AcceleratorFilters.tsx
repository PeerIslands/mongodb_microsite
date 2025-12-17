import { useState } from 'react';
import '@/styles/components/accelerators/AcceleratorFilters.css';

interface AcceleratorFiltersProps {
  onFilterChange: (filters: any) => void;
}

const AcceleratorFilters = ({ onFilterChange }: AcceleratorFiltersProps) => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sourceTech: 'all',
    status: 'all'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      category: 'all',
      sourceTech: 'all',
      status: 'all'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="accelerator-filters">
      {/* Search */}
      <div className="filter-search">
        <input
          type="text"
          placeholder="Search accelerators..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Filter Options */}
      <div className="filter-options">
        {/* Category */}
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Migration">Migration</option>
            <option value="Modernization">Modernization</option>
            <option value="Integration">Integration</option>
          </select>
        </div>

        {/* Source Technology */}
        <div className="filter-group">
          <label className="filter-label">Source Technology</label>
          <select
            value={filters.sourceTech}
            onChange={(e) => handleFilterChange('sourceTech', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sources</option>
            <option value="HBase">HBase</option>
            <option value="Cassandra">Cassandra</option>
            <option value="Cosmos DB">Cosmos DB</option>
            <option value="Oracle">Oracle</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MySQL">MySQL</option>
            <option value="Monolithic">Monolithic</option>
          </select>
        </div>

        {/* Status */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="beta">Beta</option>
          </select>
        </div>

        {/* Reset Button */}
        <button onClick={handleReset} className="reset-button">
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default AcceleratorFilters;

