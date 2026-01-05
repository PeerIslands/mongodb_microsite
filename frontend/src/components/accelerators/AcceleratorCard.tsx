import '@/styles/components/accelerators/AcceleratorCard.css';
import arrowIcon from '../../assets/9676e79a76f01cf2ed247a83e933b0c8e983525f.svg';

interface AcceleratorCardProps {
  accelerator: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    category: string;
    sourceTech: string;
    targetTech: string;
    cardImage: string;
    logo: string;
    status: string;
    featured: boolean;
    downloads: number;
    views: number;
  };
}

const AcceleratorCard = ({ accelerator }: AcceleratorCardProps) => {
  const handleClick = () => {
    window.location.href = `/accelerators/${accelerator.slug}`;
  };

  return (
    <div className="accelerator-card" onClick={handleClick}>
      {/* Gradient Overlay */}
      <div className="accelerator-card-gradient"></div>
      
      {/* Card Image */}
      <div className="accelerator-card-image-container">
        <img 
          src={accelerator.cardImage} 
          alt={accelerator.name} 
          className="accelerator-card-image"
          onError={(e) => {
            // Fallback to gradient background
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      
      {/* Logo Overlay */}
      <div className="accelerator-logo-container">
        <img 
          src={accelerator.logo} 
          alt={`${accelerator.name} logo`}
          className="accelerator-logo"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      
      {/* Badges */}
      <div className="accelerator-badges">
        {accelerator.featured && (
          <span className="badge badge-featured">Featured</span>
        )}
        {accelerator.status === 'coming_soon' && (
          <span className="badge badge-coming-soon">Coming Soon</span>
        )}
      </div>
      
      {/* Content */}
      <div className="accelerator-card-content">
        <h3 className="accelerator-card-title">{accelerator.name}</h3>
        <p className="accelerator-card-tagline">{accelerator.tagline}</p>
        
        {/* Meta Info */}
        <div className="accelerator-meta">
          <span className="meta-item">
            <span className="meta-icon">📦</span>
            {accelerator.downloads.toLocaleString()} downloads
          </span>
          <span className="meta-item">
            <span className="meta-icon">👁️</span>
            {accelerator.views.toLocaleString()} views
          </span>
        </div>
        
        {/* Category Badge */}
        <div className="accelerator-category">
          <span className="category-badge">{accelerator.category}</span>
          <span className="tech-flow">
            {accelerator.sourceTech} → {accelerator.targetTech}
          </span>
        </div>
        
        {/* Link */}
        <div className="accelerator-link">
          <span className="accelerator-link-text">Learn More</span>
          <img src={arrowIcon} alt="" className="accelerator-link-arrow" />
        </div>
      </div>
    </div>
  );
};

export default AcceleratorCard;







