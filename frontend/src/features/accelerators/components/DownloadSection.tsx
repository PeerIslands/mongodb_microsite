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

  const openPdf = async () => {
    if (pdfUrl) {
      try {
        // Track as CTA click and view - wait for both to complete
        await Promise.all([
          analytics.trackCTAClick('View PDF Button', `Accelerator: ${title}`),
          analytics.trackDownload(title, 'pdf', pdfUrl)
        ]);
      } catch (error) {
        console.error('Tracking failed:', error);
      }
      
      // Open PDF in new window after tracking completes
      globalThis.open(pdfUrl, '_blank');
    }
  };

  const handleOpenPdf = async () => {
    if (isLoggedIn()) {
      await openPdf();
    } else {
      // Open PDF lead capture modal
      openPDFDownloadModal({
        resourceType: 'accelerator',
        resourceId: acceleratorId,
        resourceTitle: title,
        onSuccess: () => { openPdf(); },
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
            View the technical specifications and documentation
          </p>
          <button
            type="button"
            className="download-section-button"
            onClick={handleOpenPdf}
          >
            <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M11 3H17V9M17 3L9 11M8 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            View PDF
          </button>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
