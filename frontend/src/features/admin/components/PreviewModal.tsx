/**
 * Preview Modal Component
 * 
 * Reusable modal for previewing newsletter HTML content
 * Includes access request functionality for restricted content
 */

import { useState } from 'react';
import '@/styles/features/admin/PreviewModal.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  htmlContent: string | null;
  className?: string;
  hasAccess?: boolean;
  onRequestAccess?: () => void;
  requestPending?: boolean;
  showLoginPrompt?: boolean;
  onLoginRedirect?: () => void;
}

export const PreviewModal = ({ 
  isOpen, 
  onClose, 
  title = 'Newsletter Preview', 
  htmlContent, 
  className = '',
  hasAccess = true,
  onRequestAccess,
  requestPending = false,
  showLoginPrompt = false,
  onLoginRedirect
}: PreviewModalProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleRequestAccess = async () => {
    if (onRequestAccess) {
      setIsRequesting(true);
      try {
        await onRequestAccess();
      } finally {
        setIsRequesting(false);
      }
    }
  };

  const handleLogin = () => {
    if (onLoginRedirect) {
      onLoginRedirect();
    }
  };

  const showAccessRequest = !hasAccess && !htmlContent;

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
          ) : showLoginPrompt ? (
            <div className="preview-access-request">
              <div className="access-request-icon">🔐</div>
              <h3>Login Required</h3>
              <p className="access-request-message">
                Please login to request access to newsletters. If you don't have an account, you can sign up first.
              </p>
              <div className="login-prompt-actions">
                <button 
                  className="btn-login"
                  onClick={handleLogin}
                >
                  🔑 Login / Sign Up
                </button>
                <button 
                  className="btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : showAccessRequest ? (
            <div className="preview-access-request">
              <div className="access-request-icon">🔒</div>
              <h3>Newsletter Access Required</h3>
              <p className="access-request-message">
                {requestPending 
                  ? 'Your access request is pending admin approval. You will be notified once approved.'
                  : 'This newsletter content is restricted. Request access to view the full content.'}
              </p>
              {!requestPending && onRequestAccess && (
                <button 
                  className="btn-request-access"
                  onClick={handleRequestAccess}
                  disabled={isRequesting}
                >
                  {isRequesting ? '⏳ Requesting...' : '🔓 Request Access'}
                </button>
              )}
              {requestPending && (
                <div className="access-request-pending">
                  <span className="pending-badge">⏳ Pending Approval</span>
                </div>
              )}
            </div>
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
