import { useAuthModal } from '@/contexts/AuthModalContext';
import { analytics } from '@/utils/analytics';
import '@/styles/features/accelerators/DownloadSection.css';

interface DownloadSectionProps {
  title: string;
  pdfUrl: string;
  acceleratorId: string;
}

const DownloadSection = ({ title, pdfUrl, acceleratorId }: DownloadSectionProps) => {
  const { openPDFDownloadModal } = useAuthModal();

  const isLoggedIn = () => {
    return !!localStorage.getItem('authToken');
  };

  const downloadPdf = async () => {
    if (pdfUrl) {
      try {
        // Track as CTA click and download - wait for both to complete
        await Promise.all([
          analytics.trackCTAClick('Download PDF Button', `Accelerator: ${title}`),
          analytics.trackDownload(title, 'pdf', pdfUrl)
        ]);
      } catch (error) {
        console.error('Tracking failed:', error);
      }
      
      // Open PDF after tracking completes
      globalThis.open(pdfUrl, '_blank');
    }
  };

  const handleDownloadPdf = async () => {
    if (isLoggedIn()) {
      await downloadPdf();
    } else {
      // Open PDF download lead capture modal
      openPDFDownloadModal({
        resourceType: 'accelerator',
        resourceId: acceleratorId,
        resourceTitle: title,
        onSuccess: () => { downloadPdf(); },
      });
    }
  };

  return (
    <section className="download-section">
      <div className="download-section-container">
        <div className="download-section-content">
          <h2 className="download-section-title">
            Ready to get started with {title}?
          </h2>
          <p className="download-section-subtitle">
            Download the technical specifications and documentation
          </p>
          <button
            type="button"
            className="download-section-button"
            onClick={handleDownloadPdf}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10 3V13M10 13L6 9M10 13L14 9M3 17H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
