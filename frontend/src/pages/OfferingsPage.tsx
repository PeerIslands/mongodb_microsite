import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '@/styles/pages/OfferingsPage.css';
import offeringImage1 from '@/assets/offering_image_1.png';
import offeringImage2 from '@/assets/offerings_image_2.png';
import offeringImage3 from '@/assets/offerings_image_3.png';
import offeringImage4 from '@/assets/offerings_image_4.png';
import offeringImage5 from '@/assets/offerings_image_5.png';
import offeringImage6 from '@/assets/offerings_image_6.png';

const OfferingsPage = () => {
  const location = useLocation();
  // Track which cards are expanded (all start collapsed)
  const [expandedCards, setExpandedCards] = useState<boolean[]>([false, false, false, false, false, false]);

  // Check if ALL cards are expanded
  const allCardsExpanded = expandedCards.every(card => card === true);

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  useEffect(() => {
    // Always scroll to top first
    window.scrollTo(0, 0);
    
    if (location.hash) {
      // Map of section IDs to their card indices (0-based)
      const cardIndexMap: Record<string, number> = {
        'application-modernization': 0,
        'data-database-modernization': 1,
        'ai-native-products': 2,
        'ai-quality-engineering-testing': 3,
        'data-engineering-platforms': 4,
        'ai-consulting-governance': 5,
      };
      
      setTimeout(() => {
        const targetId = location.hash.substring(1);
        const cardIndex = cardIndexMap[targetId];
        
        if (cardIndex !== undefined) {
          // Get all offering cards
          const cards = document.querySelectorAll('.offering-card');
          if (cards[cardIndex]) {
            const element = cards[cardIndex] as HTMLElement;
            const elementPosition = element.offsetTop;
            // Scroll to the card's actual DOM position minus header space
            window.scrollTo({
              top: elementPosition - 80,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
    }
  }, [location]);

  const offerings = [
    {
      id: 'application-modernization',
      title: 'AI-Driven Application Modernization',
      subtitle: 'Modernize Applications Without Disrupting the Business',
      description: 'Move from monoliths to cloud-native microservices in months, not years — with near zero downtime.',
      image: offeringImage1,
      color: '#5b6cff', // Blue
      whatChanges: [
        '70–90% faster modernization timelines',
        '12× development velocity',
        'Fewer regressions and faster releases',
        '30–40% fewer defects',
        '3–4 months vs 12–18 months traditional modernization'
      ],
      whatCovers: [
        'Legacy monolith → cloud-native microservices',
        'Java, .NET, C#, COBOL, Swing, EJB, C/C++, XML → modern stacks',
        'Refactoring to Java, Spring Boot, Node.js, Vert.x, modern UI frameworks'
      ],
      keyEnablers: [
        'PeerAI-assisted code analysis & dependency extraction',
        'AI-driven design & microservices decomposition',
        'Automated code conversion with human-in-the-loop validation',
        'AI-generated unit, integration & acceptance tests'
      ]
    },
    {
      id: 'data-database-modernization',
      title: 'Intelligent Data & Database Modernization',
      subtitle: 'Migrate Data to MongoDB — Safely, at Enterprise Scale',
      description: 'Exit legacy databases without risking data integrity or business continuity.',
      image: offeringImage2,
      color: '#00ED64', // Green
      whatChanges: [
        'Zero data loss',
        'Zero or near-zero downtime',
        'Immediate performance and cost gains',
        '75% reduction in migration timelines',
        'Up to 10 TB/hour migration throughput',
        '<300 ms search SLAs at billion-record scale'
      ],
      whatCovers: [
        'Relational → MongoDB (Oracle, SQL Server, Sybase, DB2, PostgreSQL)',
        'Search platform migration (SOLR, MarkLogic → MongoDB Atlas Search)',
        'Mainframe & legacy data platforms → MongoDB Atlas',
        'CosmosDB → MongoDB migrations'
      ],
      keyEnablers: [
        'AI-assisted schema analysis & dependency mapping',
        'Denormalization strategy & MongoDB-native data modeling',
        'CDC-based migration with zero downtime',
        'Automated validation, parity checks & rollback'
      ]
    },
    {
      id: 'ai-native-products',
      title: 'AI-Native Product Engineering',
      subtitle: 'Build AI-Native Products That Actually Reach Production',
      description: 'Move beyond PoCs to AI systems that operate at scale.',
      image: offeringImage3,
      color: '#4aa3ff', // Light Blue
      whatChanges: [
        'Faster time-to-market for AI initiatives',
        'Production-ready architectures from day one',
        'AI systems built to evolve, not break'
      ],
      whatCovers: [
        'Building AI-native products on MongoDB',
        'RAG-based enterprise applications',
        'Domain-specific AI agents',
        'Agentic workflows & orchestration'
      ],
      keyEnablers: [
        'MongoDB MCP & Atlas Vector Search',
        'GenKit-based MongoDB integration toolkit',
        'Proprietary MongoDB plugins (Indexer, Retriever, CRUD, Index Mgmt)'
      ],
      useCases: [
        'Revenue Cycle Management (RCM) agentic platform',
        'Enterprise search & intelligence systems',
        'GenAI-powered workflow automation'
      ]
    },
    {
      id: 'ai-quality-engineering-testing',
      title: 'AI Quality Engineering & Testing',
      subtitle: 'Accelerate Modernization Without Compromising Quality',
      description: 'Move faster without increasing defects, regressions, or compliance risk.',
      image: offeringImage4,
      color: '#6dd5b8', // Teal Green
      whatChanges: [
        'Confidence to move fast — quality keeps pace with acceleration',
        'Reduced production risk during high-change modernization programs',
        'Audit-ready validation for regulated and mission-critical environments'
      ],
      keyEnablers: [
        'AI-generated unit, integration & acceptance test suites',
        'Legacy vs modern code parity validation to ensure functional equivalence',
        'Snapshot testing and diff-first workflows to detect unintended changes early',
        'Continuous regression protection across releases and environments'
      ],
      whyMatters: 'Our AI-led approach delivers both — enabling aggressive modernization timelines without sacrificing reliability, compliance, or customer trust.'
    },
    {
      id: 'data-engineering-platforms',
      title: 'Data Engineering & Cloud-Native Data Platforms',
      subtitle: 'Modernize Data Platforms to Unlock AI',
      description: 'Turn fragmented, legacy data into AI-ready platforms.',
      image: offeringImage5,
      color: '#3b82f6', // Medium Blue
      whatChanges: [
        'Faster analytics and insights',
        'Reliable data for AI and GenAI use cases',
        'Lower operational complexity',
        'Data engineered for speed, scale and intelligence'
      ],
      whatCovers: [
        'Lakehouse architectures (Spark, Databricks)',
        'Real-time streaming (Kafka, Flink)',
        'Batch + real-time pipelines',
        'Domain-specific data generation'
      ],
      keyEnablers: [
        'Config-driven pipelines',
        'Built-in governance & observability',
        'AI/ML-ready data foundations'
      ]
    },
    {
      id: 'ai-consulting-governance',
      title: 'AI Consulting, Readiness & Governance',
      subtitle: 'Reduce Risk Before You Commit',
      description: 'Know what you\'re getting into — before you modernize. Our readiness and discovery engagements give leaders clarity on scope, effort, risk, and ROI in weeks, not months.',
      image: offeringImage6,
      color: '#60d394', // Mint Green
      whatChanges: [
        'Clarity before Code',
        'Fewer surprises mid-program',
        'Clear modernization roadmap',
        'Confident investment decisions'
      ],
      whatCovers: [
        'AI-native transformation roadmap',
        'Use-case discovery & prioritization',
        'Architecture & platform readiness',
        'Security, governance & compliance'
      ],
      deliveryModel: [
        'Design sprints',
        'GenAI-led PoCs',
        'Rapid opportunity validation'
      ]
    }
  ];

  return (
    <div className="offerings-page">
      {/* Hero Section */}
      <section className="offerings-hero">
        <div className="offerings-hero-content">
          <h1 className="offerings-hero-title">
            End-to-End <span className="offerings-hero-title-gradient">Modernization</span> Capabilities
          </h1>
          <p className="offerings-hero-description">
            From legacy migration to cloud-native architecture, we deliver predictable outcomes using our proven framework.
          </p>
        </div>
      </section>

      {/* Offerings Cards */}
      <section className="offerings-cards-section">
        <div className={`offerings-cards-container ${allCardsExpanded ? 'all-expanded' : ''}`}>
          {offerings.map((offering, index) => (
            <div 
              key={offering.id} 
              id={offering.id}
              className={`offering-card ${expandedCards[index] ? 'expanded' : 'collapsed'}`}
            >
              <div 
                className="offering-card-header"
                onClick={() => toggleCard(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCard(index);
                  }
                }}
              >
                <div className="offering-icon-wrapper" style={{ background: offering.color }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5L12 19M12 19L7 14M12 19L17 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="offering-card-title">{offering.title}</h2>
                <div 
                  className="offering-card-toggle"
                  aria-label={expandedCards[index] ? 'Collapse card' : 'Expand card'}
                >
                  <svg 
                    className="toggle-arrow" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path 
                      d="M19 9L12 16L5 9" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="offering-card-content">
                  <div className="offering-card-body">
                    <div className="offering-card-text" style={{ '--offering-color': offering.color } as React.CSSProperties}>
                      <div className="offering-subtitle-block">
                        <h3 className="offering-subtitle">{offering.subtitle}</h3>
                        <p className="offering-description">{offering.description}</p>
                      </div>

                      {offering.whatChanges && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">What changes for you</h4>
                          <ul className="offering-list">
                            {offering.whatChanges.map((item, idx) => (
                              <li key={idx}>
                                <div className="offering-bullet-icon" style={{ color: offering.color }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                                    <path d="M8 12L11 15L16 9" stroke="#020916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {offering.whatCovers && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">What it covers</h4>
                          <ul className="offering-list">
                            {offering.whatCovers.map((item, idx) => (
                              <li key={idx}>
                                <div className="offering-bullet-icon" style={{ color: offering.color }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                                    <path d="M8 12L11 15L16 9" stroke="#020916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {offering.keyEnablers && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">Key Enablers</h4>
                          <ul className="offering-list">
                            {offering.keyEnablers.map((item, idx) => (
                              <li key={idx}>
                                <div className="offering-bullet-icon" style={{ color: offering.color }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                                    <path d="M8 12L11 15L16 9" stroke="#020916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {offering.useCases && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">Use Cases Examples</h4>
                          <ul className="offering-list">
                            {offering.useCases.map((item, idx) => (
                              <li key={idx}>
                                <div className="offering-bullet-icon" style={{ color: offering.color }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                                    <path d="M8 12L11 15L16 9" stroke="#020916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {offering.deliveryModel && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">Delivery model</h4>
                          <ul className="offering-list">
                            {offering.deliveryModel.map((item, idx) => (
                              <li key={idx}>
                                <div className="offering-bullet-icon" style={{ color: offering.color }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                                    <path d="M8 12L11 15L16 9" stroke="#020916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {offering.whyMatters && (
                        <div className="offering-block">
                          <h4 className="offering-block-title">Why It Matters</h4>
                          <p className="offering-why-matters">{offering.whyMatters}</p>
                        </div>
                      )}
                    </div>

                    <div className="offering-card-image">
                      <img src={offering.image} alt={offering.title} />
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OfferingsPage;

