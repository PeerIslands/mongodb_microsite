import '@/styles/features/home/Capabilities.css';
import arrowIcon from '@/assets/9676e79a76f01cf2ed247a83e933b0c8e983525f.svg';
import image4 from '@/assets/image 4.png';
import image5 from '@/assets/image 5.png';
import image6 from '@/assets/image 6.png';

const Capabilities = () => {
  const capabilities = [
    {
      title: 'Intelligent Migration',
      description: 'De-risk your move from legacy platforms like HBase and Cassandra to MongoDB Atlas. Our automated discovery and schema validation tools ensure data fidelity while accelerating your transition to the cloud.',
      link: 'Explore Migration Services',
      image: image4,
      linkUrl: '#offerings',
    },
    {
      title: 'App Modernization',
      description: 'Re-architect monolithic legacy systems into scalable microservices. We utilize MCP strategies to optimize your application architecture specifically for the flexibility of the MongoDB document model.',
      link: 'See Modernization Capabilities',
      image: image5,
      linkUrl: '#modernization',
    },
    {
      title: 'Proven Accelerators',
      description: 'Reduce project timelines by up to 40%. Our proprietary toolkits—including the HBase and Cosmos DB Accelerators—automate the heavy lifting of code conversion and data mapping.',
      link: 'View Accelerators',
      image: image6,
      linkUrl: '/accelerators',
    },
  ];

  return (
    <section className="capabilities">
      <div className="capabilities-content">
        <div className="capabilities-header">
          <h2 className="section-title">End-to-End Modernization Capabilities</h2>
          <p className="section-description">
            From legacy migration to cloud-native architecture, we deliver predictable outcomes using our proven framework.
          </p>
        </div>
        <div className="capabilities-grid">
          {capabilities.map((capability, index) => (
            <div key={index} className="capability-card">
              <div className="capability-image-container">
                <img src={capability.image} alt={capability.title} className="capability-image" />
              </div>
              <div className="capability-icon-container">
                <img 
                  src="/assets/c5856a59e1303e46c0d0b7ea6c2a0c4b392318b5.svg" 
                  alt="" 
                  className="capability-icon" 
                />
              </div>
              <h3 className="capability-title">{capability.title}</h3>
              <p className="capability-description">{capability.description}</p>
              <a 
                href={capability.linkUrl || '#'} 
                className="capability-link"
                onClick={(e) => {
                  if (capability.linkUrl) {
                    e.preventDefault();
                    window.location.href = capability.linkUrl;
                  }
                }}
              >
                <span className="capability-link-text">{capability.link}</span>
                <img src={arrowIcon} alt="" className="capability-link-arrow" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Capabilities;


