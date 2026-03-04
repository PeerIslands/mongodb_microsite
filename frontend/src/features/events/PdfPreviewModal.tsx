/**
 * PDF Preview Modal - View-only PDF display (no download / new window).
 * Used for event resource PDF in the same way newsletter preview shows content.
 */

import '@/styles/features/events/PdfPreviewModal.css';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  pdfUrl: string;
}

export const PdfPreviewModal = ({ isOpen, onClose, title = 'PDF Preview', pdfUrl }: PdfPreviewModalProps) => {
  if (!isOpen) return null;

  // Hide browser PDF toolbar (download, print, etc.) for view-only experience
  const viewOnlyUrl = pdfUrl ? `${pdfUrl.split('#')[0]}#toolbar=0` : '';

  return (
    <div className="pdf-preview-modal-overlay" onClick={onClose}>
      <div className="pdf-preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-preview-modal-header">
          <h2 className="pdf-preview-modal-title">{title}</h2>
          <button
            type="button"
            className="pdf-preview-modal-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>
        <div className="pdf-preview-modal-body">
          <iframe
            src={viewOnlyUrl}
            title={title}
            className="pdf-preview-iframe"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
