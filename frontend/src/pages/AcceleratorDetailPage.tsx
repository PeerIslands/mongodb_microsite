import { useParams } from 'react-router-dom';
import '@/styles/pages/AcceleratorDetailPage.css';

/**
 * Accelerator Detail Page - Individual accelerator details
 * (To be implemented with API integration)
 */
const AcceleratorDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="accelerator-detail-page">
      <h1>Accelerator: {slug}</h1>
      <p>Detail page to be implemented with API integration</p>
    </div>
  );
};

export default AcceleratorDetailPage;

