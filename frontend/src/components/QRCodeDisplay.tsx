/**
 * QRCodeDisplay Component
 * 
 * Displays a QR code for TOTP setup along with manual entry option
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '@/styles/components/QRCodeDisplay.css';

interface QRCodeDisplayProps {
  qrCodeData: string;  // data:image/png;base64,... or otpauth:// URL
  secret: string;
  issuer: string;
  accountName: string;
}

const QRCodeDisplay = ({ qrCodeData, secret, issuer, accountName }: QRCodeDisplayProps) => {
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format secret for display (add spaces every 4 characters for readability)
  const formattedSecret = secret.match(/.{1,4}/g)?.join(' ') || secret;

  return (
    <div className="qr-code-display">
      <div className="qr-code-header">
        <h3>Scan QR Code</h3>
        <p className="qr-code-subtitle">
          Use your authenticator app to scan this code
        </p>
      </div>

      <div className="qr-code-container">
        {/* QR Code */}
        <div className="qr-code-wrapper">
          <QRCodeSVG
            value={qrCodeData}
            size={180}
            level="M"
            includeMargin={true}
            className="qr-code"
            fgColor="#FFFFFF"
            bgColor="transparent"
          />
        </div>

        {/* App Recommendations */}
        <div className="app-recommendations">
          <p className="recommendations-title">📱 Recommended Apps:</p>
          <ul className="app-list">
            <li>Google Authenticator</li>
            <li>Microsoft Authenticator</li>
            <li>Authy</li>
            <li>1Password</li>
          </ul>
        </div>
      </div>

      {/* Manual Entry Option */}
      <div className="manual-entry-section">
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="manual-entry-toggle"
        >
          {showManual ? '▼' : '▶'} Can't scan? Enter manually
        </button>

        {showManual && (
          <div className="manual-entry-content">
            <div className="manual-entry-info">
              <div className="info-row">
                <span className="info-label">Account:</span>
                <span className="info-value">{accountName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Issuer:</span>
                <span className="info-value">{issuer}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Key:</span>
                <div className="secret-display">
                  <code className="secret-code">{formattedSecret}</code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Type:</span>
                <span className="info-value">Time-based (30s)</span>
              </div>
            </div>

            <div className="manual-entry-steps">
              <p className="steps-title">Manual Setup Steps:</p>
              <ol className="steps-list">
                <li>Open your authenticator app</li>
                <li>Select "Add account" or "+"</li>
                <li>Choose "Enter a setup key" or "Manual entry"</li>
                <li>Enter the account name and key above</li>
                <li>Ensure "Time-based" is selected</li>
                <li>Save the account</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Important Note */}
      <div className="qr-code-note">
        <p className="note-icon">ℹ️</p>
        <p className="note-text">
          After scanning, your authenticator app will generate a new 6-digit code every 30 seconds.
        </p>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

