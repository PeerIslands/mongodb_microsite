/**
 * BackupCodesDisplay Component
 * 
 * Displays backup recovery codes with download/print/copy options
 */

import { useState } from 'react';
import '@/styles/components/BackupCodesDisplay.css';

interface BackupCodesDisplayProps {
  backupCodes: string[];
  onAcknowledge: () => void;
  loading?: boolean;
}

const BackupCodesDisplay = ({ backupCodes, onAcknowledge, loading = false }: BackupCodesDisplayProps) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const content = `MongoDB Microsite - Backup Recovery Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes safe and secure!
Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to recover your account.
Store them in a secure location (password manager, safe, etc.)
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mongodb-microsite-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Backup Recovery Codes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
          }
          h1 {
            color: #00684A;
            border-bottom: 2px solid #00684A;
            padding-bottom: 10px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .codes {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
          }
          .code-item {
            padding: 8px 0;
            border-bottom: 1px dashed #dee2e6;
          }
          .code-item:last-child {
            border-bottom: none;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>MongoDB Microsite</h1>
        <h2>Backup Recovery Codes</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="warning">
          <strong>⚠️ IMPORTANT:</strong>
          <ul>
            <li>Keep these codes safe and secure!</li>
            <li>Each code can only be used once</li>
            <li>Store in a secure location (safe, password manager)</li>
            <li>Do not share these codes with anyone</li>
          </ul>
        </div>

        <div class="codes">
          ${backupCodes.map((code, index) => `
            <div class="code-item">${index + 1}. ${code}</div>
          `).join('')}
        </div>

        <div class="footer">
          <p>If you lose access to your authenticator app, you can use these codes to recover your account.</p>
          <p>Each code works only once. Generate new codes from your account settings if needed.</p>
        </div>

        <div class="no-print" style="margin-top: 40px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #00684A; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Codes
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleCopyAll = async () => {
    const text = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAcknowledge = () => {
    if (acknowledged) {
      onAcknowledge();
    }
  };

  return (
    <div className="backup-codes-display">
      <div className="backup-codes-header">
        <h3>Save Your Backup Codes</h3>
        <p className="backup-codes-subtitle">
          Keep these codes safe. You'll need them if you lose your device.
        </p>
      </div>

      <div className="backup-codes-warning">
        <div className="warning-icon">⚠️</div>
        <div className="warning-content">
          <p className="warning-title">IMPORTANT</p>
          <ul className="warning-list">
            <li>Each code can only be used <strong>once</strong></li>
            <li>Store them in a <strong>secure location</strong></li>
            <li>Do not share these codes with anyone</li>
            <li>You won't be able to see them again</li>
          </ul>
        </div>
      </div>

      <div className="backup-codes-container">
        <div className="codes-grid">
          {backupCodes.map((code, index) => (
            <div key={index} className="code-item">
              <span className="code-number">{index + 1}.</span>
              <code className="code-value">{code}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="backup-codes-actions">
        <button
          type="button"
          onClick={handleDownload}
          className="action-button download-button"
          title="Download as text file"
        >
          <span className="button-icon">📥</span>
          <span className="button-text">Download</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="action-button print-button"
          title="Print codes"
        >
          <span className="button-icon">🖨️</span>
          <span className="button-text">Print</span>
        </button>

        <button
          type="button"
          onClick={handleCopyAll}
          className="action-button copy-button"
          title="Copy all codes"
        >
          <span className="button-icon">{copied ? '✓' : '📋'}</span>
          <span className="button-text">{copied ? 'Copied!' : 'Copy All'}</span>
        </button>
      </div>

      <div className="backup-codes-confirmation">
        <label className="confirmation-checkbox">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span className="checkbox-label">
            I have saved my backup codes securely
          </span>
        </label>
      </div>

      <div className="backup-codes-info">
        <p className="info-icon">💡</p>
        <p className="info-text">
          If you use all 10 codes, you can generate new ones from your account settings.
        </p>
      </div>

      <button
        type="button"
        onClick={handleAcknowledge}
        className="finish-button"
        disabled={!acknowledged || loading}
      >
        {loading ? 'Completing...' : 'Finish Setup'}
      </button>
    </div>
  );
};

export default BackupCodesDisplay;

