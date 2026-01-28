/**
 * Email Template Form Component
 * 
 * Form for editing email templates or uploading HTML files
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getEmailTemplate,
  updateEmailTemplate,
  uploadHTMLTemplate,
  sendTestEmail,
  sendNewsletter,
  RecipientFilter,
  SendNewsletterRequest,
} from '@/api/services/emailTemplates';
import { PreviewModal } from './PreviewModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import LeafLoader from '@/components/LeafLoader';
import '@/styles/features/admin/EmailTemplateForm.css';

interface EmailTemplateFormProps {
  editingId: string | null;
  mode: 'edit' | 'upload';
  onCancel: () => void;
  onSuccess: () => void;
}

export const EmailTemplateForm = ({ editingId, mode, onCancel, onSuccess }: EmailTemplateFormProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'newsletter' | 'transactional' | 'promotional' | 'notification'>('newsletter');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [useBlobStorage, setUseBlobStorage] = useState(true);
  
  // Newsletter sending state
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all_users');
  const [customEmails, setCustomEmails] = useState('');
  const [pendingNewsletterRequest, setPendingNewsletterRequest] = useState<SendNewsletterRequest | null>(null);

  useEffect(() => {
    if (mode === 'edit' && editingId) {
      fetchTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editingId]);

  const fetchTemplate = async () => {
    if (!editingId) return;

    try {
      setLoading(true);
      setLoadingMessage('Loading newsletter...');
      const template = await getEmailTemplate(editingId);
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setSubject(template.subject);
      setHtmlContent(template.html_content || '');
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.html')) {
        showToast('Please select an HTML file', 'error');
        return;
      }
      setHtmlFile(file);

      // Read file content for preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        let content = event.target?.result as string;
        
        // If images are already selected, embed them immediately
        if (imageFiles.length > 0) {
          content = await embedImagesInHTMLString(content, imageFiles);
          showToast('Images embedded in preview', 'success');
        }
        
        setHtmlContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFilesArray = Array.from(files).filter(file => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          showToast(`${file.name} is not an image file`, 'warning');
        }
        return isImage;
      });
      setImageFiles(imageFilesArray);
      showToast(`${imageFilesArray.length} image(s) selected`, 'success');
      
      // If we have HTML content, embed the images for preview
      if (htmlContent) {
        await embedImagesInHTML(imageFilesArray);
      }
    }
  };

  const embedImagesInHTMLString = async (htmlString: string, images: File[]): Promise<string> => {
    // Create a map of filename -> base64 data URI
    const imageMap: Record<string, string> = {};
    
    for (const imageFile of images) {
      try {
        const base64 = await readFileAsBase64(imageFile);
        const mimeType = imageFile.type || 'image/png';
        const dataUri = `data:${mimeType};base64,${base64}`;
        imageMap[imageFile.name] = dataUri;
      } catch (error) {
        console.error(`Failed to read image ${imageFile.name}:`, error);
      }
    }

    // Parse HTML and replace image src attributes
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const imgTags = doc.querySelectorAll('img');
    
    imgTags.forEach((img) => {
      const src = img.getAttribute('src');
      if (src) {
        // Extract filename from path (handles "assets/image.png" -> "image.png")
        const filename = src.split('/').pop() || src;
        if (imageMap[filename]) {
          img.setAttribute('src', imageMap[filename]);
        }
      }
    });

    // Return updated HTML
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  };

  const embedImagesInHTML = async (images: File[]) => {
    if (!htmlContent) return;

    const updatedHTML = await embedImagesInHTMLString(htmlContent, images);
    setHtmlContent(updatedHTML);
    showToast('Images embedded in preview', 'success');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URI prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (!subject.trim()) {
      showToast('Please enter a subject line', 'error');
      return;
    }

    if (mode === 'upload' && !htmlFile) {
      showToast('Please select an HTML file', 'error');
      return;
    }

    if (mode !== 'upload' && !htmlContent.trim()) {
      showToast('Please enter HTML content', 'error');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress('');

      if (mode === 'upload' && htmlFile) {
        // Upload HTML file with images
        setLoadingMessage('Uploading template and images...');
        setUploadProgress('Uploading template and images...');
        if (imageFiles.length > 0) {
          const message = `Uploading ${imageFiles.length} image(s)... This may take a few minutes.`;
          setLoadingMessage(message);
          setUploadProgress(message);
        }
        
        await uploadHTMLTemplate(name, subject, htmlFile, description, category, imageFiles, useBlobStorage);
        setUploadProgress('');
        showToast(`✅ Template uploaded successfully with ${imageFiles.length} images!`, 'success');
      } else if (mode === 'edit' && editingId) {
        // Update existing template
        setLoadingMessage('Updating newsletter...');
        await updateEmailTemplate(editingId, {
          name,
          description,
          category,
          subject,
          html_content: htmlContent,
        });
        showToast('Template updated successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      setUploadProgress('');
      const err = error as { response?: { data?: { detail?: string } }; message?: string; code?: string };
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save template';
      
      // Check if it's a timeout error
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        showToast(
          '⏱️ Upload timed out. However, your template may still be processing. Please check the template list in a moment.',
          'warning'
        );
      } else {
        showToast(`❌ ${errorMessage}`, 'error');
      }
      
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      showToast('Please enter at least one email address', 'error');
      return;
    }

    if (!editingId) {
      showToast('Please save the template first before sending a test', 'error');
      return;
    }

    // Parse multiple emails (comma, semicolon, or space separated)
    const emailList = testEmail
      .split(/[,;\s]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      showToast('Please enter valid email address(es)', 'error');
      return;
    }

    try {
      setSendingTestEmail(true);
      setLoading(true);
      setLoadingMessage(`Sending test email to ${emailList.length} recipient(s)...`);
      
      // If multiple emails, send to each one
      if (emailList.length > 1) {
        let successCount = 0;
        for (const email of emailList) {
          try {
            await sendTestEmail(editingId, { to_email: email });
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${email}:`, error);
          }
        }
        showToast(`Test email sent to ${successCount} of ${emailList.length} recipient(s)`, 'success');
      } else {
        // Single email
        const response = await sendTestEmail(editingId, { to_email: emailList[0] });
        showToast(response.message, 'success');
      }
      
      setTestEmail('');
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to send test email', 'error');
    } finally {
      setSendingTestEmail(false);
      setLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!editingId) {
      showToast('No template selected', 'error');
      return;
    }

    // Validate custom emails if needed
    if (recipientFilter === 'custom_list' && !customEmails.trim()) {
      showToast('Please enter at least one email address for custom list', 'error');
      return;
    }

    // Parse custom emails if using custom list
    let emailArray: string[] = [];
    if (recipientFilter === 'custom_list') {
      emailArray = customEmails
        .split(/[\n,;]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      if (emailArray.length === 0) {
        showToast('Please enter valid email addresses', 'error');
        return;
      }
    }

    // Prepare request
    const request: SendNewsletterRequest = {
      recipient_filter: recipientFilter,
      test_mode: false,
    };

    if (recipientFilter === 'custom_list') {
      request.custom_emails = emailArray;
    }

    // Build confirmation message
    const recipientText = recipientFilter === 'custom_list'
      ? `${emailArray.length} custom email(s)`
      : recipientFilter.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

    const message = `Send newsletter to ${recipientText}?`;

    // Show confirmation modal
    setConfirmMessage(message);
    setPendingNewsletterRequest(request);
    setShowConfirmModal(true);
  };

  const confirmSendNewsletter = async () => {
    if (!editingId || !pendingNewsletterRequest) {
      return;
    }

    setShowConfirmModal(false);

    try {
      setSendingNewsletter(true);
      setLoading(true);
      setLoadingMessage('Sending newsletter... This may take a few minutes.');
      const response = await sendNewsletter(editingId, pendingNewsletterRequest);
      
      if (response.success) {
        showToast(response.message, 'success');
        // Clear custom emails after successful send
        setCustomEmails('');
      } else {
        showToast('Newsletter sending failed', 'error');
      }
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to send newsletter', 'error');
    } finally {
      setSendingNewsletter(false);
      setLoading(false);
      setPendingNewsletterRequest(null);
    }
  };

  const cancelSendNewsletter = () => {
    setShowConfirmModal(false);
    setPendingNewsletterRequest(null);
  };

  const getTitle = () => {
    switch (mode) {
      case 'upload': 
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📤</span>
              <h2 style={{ margin: 0 }}>Upload HTML Template</h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#00ff88', paddingLeft: '2.75rem' }}>
              Upload your HTML file and relevant images to create your newsletter
            </p>
          </div>
        );
      case 'edit': 
        return (
          <>
            <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📭</span>
            <h2 style={{ margin: 0 }}>Preview Newsletter</h2>
          </>
        );
    }
  };

  // Show loader for any loading operation
  if (loading || sendingTestEmail || sendingNewsletter) {
    return <LeafLoader message={loadingMessage || 'Processing...'} />;
  }

  return (
    <div className="email-template-form">
      {/* Header */}
      <div className="form-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {getTitle()}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {mode === 'edit' && htmlContent && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => setShowPreviewModal(true)}
            >
              👁️ Preview
            </button>
          )}
          <button className="btn-close" onClick={onCancel}>✕</button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <h3>📋 Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Template Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., PeerIslands Newsletter 2025"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as 'newsletter' | 'transactional' | 'promotional' | 'notification')}
                required
              >
                <option value="newsletter">Newsletter</option>
                <option value="transactional">Transactional</option>
                <option value="promotional">Promotional</option>
                <option value="notification">Notification</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                {category.charAt(0).toUpperCase() + category.slice(1)} Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          {mode === 'edit' && (
            <>
              <div style={{ margin: '0.5rem 0 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}></div>
              <div className="form-actions" style={{ marginTop: '0', marginBottom: '-1.875rem', paddingTop: '0', borderTop: 'none', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Newsletter'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* HTML Content */}
        {mode === 'upload' && (
          <div className="form-section">
            <h3>📄 HTML Content</h3>
            
            {mode === 'upload' && (
              <>
                <div className="form-group">
                  <label htmlFor="html-file">Upload HTML File *</label>
                  <input
                    type="file"
                    id="html-file"
                    accept=".html"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  {htmlFile && (
                    <div className="file-info">
                      <span>✅ {htmlFile.name}</span>
                      <span className="file-size">
                        ({(htmlFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="image-files">Upload Image Files (Optional)</label>
                  <input
                    type="file"
                    id="image-files"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                    className="file-input"
                  />
                  {imageFiles.length > 0 && (
                    <div className="file-info">
                      <span>✅ {imageFiles.length} image(s) selected:</span>
                      <ul className="file-list">
                        {imageFiles.map((file, index) => (
                          <li key={index}>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="help-text">
                    💡 Upload all images referenced in your HTML (e.g., from assets/ folder).
                  </p>
                  <p className="help-text">
                    📌 <strong>Tip:</strong> You can select images before or after selecting the HTML file. The preview will update automatically!
                  </p>
                </div>

                {/* Storage Option */}
                <div className="form-group">
                  <label className="storage-option-label">
                    <input
                      type="checkbox"
                      checked={useBlobStorage}
                      onChange={(e) => setUseBlobStorage(e.target.checked)}
                      className="storage-checkbox"
                    />
                    <span className="storage-option-text">
                      Use Azure Blob Storage (recommended for large newsletters)
                    </span>
                  </label>
                  <p className="help-text">
                    {useBlobStorage ? (
                      <span className="storage-info-enabled">
                        ✅ <strong>Enabled:</strong> Images will be stored in Azure Blob Storage. No size limit! Perfect for newsletters with many or large images.
                      </span>
                    ) : (
                      <span className="storage-info-disabled">
                        ⚠️ <strong>Disabled:</strong> Images will be embedded as base64 in MongoDB. Maximum template size is 15MB. Only use this for small templates with few/small images.
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}

            {/* HTML Preview */}
            {htmlContent && (
              <div className="form-group">
                <label>Preview</label>
                <div className="html-preview">
                  <iframe
                    srcDoc={htmlContent}
                    title="Template Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Email */}
        {mode === 'edit' && (
          <>
            <div className="form-section">
              <h3>📧 Quick Test - Send to Email(s)</h3>
              <p className="section-description">
                Quickly send a test to check formatting and content. Supports multiple emails separated by commas or spaces.
              </p>
              <div className="form-row">
                <div className="form-group flex-grow">
                  <label htmlFor="test-email">Test Email Address(es)</label>
                  <input
                    type="text"
                    id="test-email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your.email@example.com, colleague@example.com"
                  />
                  <small className="form-hint">
                    Enter one or more email addresses. Separate multiple emails with commas, semicolons, or spaces.
                  </small>
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSendTest}
                    disabled={sendingTestEmail}
                  >
                    {sendingTestEmail ? '📤 Sending...' : '📧 Send Test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Newsletter Sending */}
            <div className="form-section newsletter-section">
              <h3>📮 Send Bulk Newsletter</h3>
              <p className="section-description">
                Send this newsletter to multiple recipients. Select recipient filter or provide custom email list.
              </p>

              {/* Recipient Filter */}
              <div className="form-group">
                <label htmlFor="recipient-filter">Recipient Filter *</label>
                <select
                  id="recipient-filter"
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value as RecipientFilter)}
                  disabled={sendingNewsletter}
                >
                  <option value="all_users">📊 All Users - Everyone registered in the system</option>
                  <option value="active_users">✅ Active Users - Users with verified accounts who can log in</option>
                  <option value="internal_users">🏢 Internal Users - Company employees and team members</option>
                  <option value="external_users">🌍 External Users - Partners, clients, and external contacts</option>
                  <option value="custom_list">📝 Custom Email List - Specific email addresses you provide</option>
                </select>
                <small className="form-hint">
                  {recipientFilter === 'all_users' && (
                    <>
                      <strong>📊 All Users:</strong> Sends to every user registered in the system, regardless of account status or user type. This includes both active and inactive accounts, internal and external users.
                    </>
                  )}
                  {recipientFilter === 'active_users' && (
                    <>
                      <strong>✅ Active Users:</strong> Sends only to users who have verified their accounts and can successfully log in. Excludes pending registrations and disabled accounts. Recommended for general announcements.
                    </>
                  )}
                  {recipientFilter === 'internal_users' && (
                    <>
                      <strong>🏢 Internal Users:</strong> Sends only to users marked as internal (company employees and team members). Use this for internal communications, company updates, or team announcements.
                    </>
                  )}
                  {recipientFilter === 'external_users' && (
                    <>
                      <strong>🌍 External Users:</strong> Sends only to users marked as external (partners, clients, customers, and other external contacts). Use this for customer newsletters, partner updates, or public announcements.
                    </>
                  )}
                  {recipientFilter === 'custom_list' && (
                    <>
                      <strong>📝 Custom Email List:</strong> Sends to a specific list of email addresses you provide below. Perfect for targeted campaigns, specific groups, or one-off communications. Recipients don't need to be registered users.
                    </>
                  )}
                </small>
              </div>

              {/* Custom Emails */}
              {recipientFilter === 'custom_list' && (
                <div className="form-group">
                  <label htmlFor="custom-emails">Custom Email List *</label>
                  <textarea
                    id="custom-emails"
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    placeholder="Enter email addresses (one per line, or comma-separated)&#10;example@email.com&#10;another@email.com&#10;partner@company.com"
                    rows={6}
                    disabled={sendingNewsletter}
                  />
                  <small className="form-hint">
                    Enter one email per line, or separate with commas or semicolons. These recipients don't need to be registered users.
                  </small>
                </div>
              )}

              {/* Send Button */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handleSendNewsletter}
                  disabled={sendingNewsletter}
                  style={{ width: '100%' }}
                >
                  {sendingNewsletter ? (
                    <>
                      <span className="spinner"></span>
                      Sending Newsletter...
                    </>
                  ) : (
                    '📨 Send Newsletter'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Actions - Only show for upload mode */}
        {mode === 'upload' && (
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                uploadProgress || 'Uploading...'
              ) : (
                'Upload Template'
              )}
            </button>
          </div>
        )}
        
        {/* Upload Progress */}
        {uploadProgress && (
          <div className="upload-progress">
            <div className="loader"></div>
            <p>{uploadProgress}</p>
          </div>
        )}
      </form>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Newsletter Preview"
        htmlContent={htmlContent}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmSendNewsletter}
        onCancel={cancelSendNewsletter}
        title="Send Newsletter"
        message={confirmMessage}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonStyle="primary"
      />
    </div>
  );
};

export default EmailTemplateForm;
