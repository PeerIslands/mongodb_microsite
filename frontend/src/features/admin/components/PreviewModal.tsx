/**
 * Preview Modal Component
 * 
 * Reusable modal for previewing newsletter HTML content
 */

import '@/styles/features/admin/PreviewModal.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  htmlContent: string;
  className?: string; // Optional custom className for styling
}

export const PreviewModal = ({ isOpen, onClose, title = 'Newsletter Preview', htmlContent, className = '' }: PreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={`preview-modal-overlay ${className}`} onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👁️</span>
            <h2 style={{ margin: 0 }}>{title}</h2>
          </div>
          <button 
            className="preview-modal-close" 
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>
        <div className="preview-modal-body">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title="Newsletter Preview"
              sandbox="allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="preview-empty">
              <p>No content to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
