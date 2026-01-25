/**
 * Email Template Form Component
 * 
 * Form for creating/editing email templates or uploading HTML files
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  uploadHTMLTemplate,
  sendTestEmail,
  EmailTemplate,
} from '@/api/services/emailTemplates';
import '@/styles/features/admin/EmailTemplateForm.css';

interface EmailTemplateFormProps {
  editingId: string | null;
  mode: 'create' | 'edit' | 'upload';
  onCancel: () => void;
  onSuccess: () => void;
}

export const EmailTemplateForm = ({ editingId, mode, onCancel, onSuccess }: EmailTemplateFormProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'newsletter' | 'transactional' | 'promotional' | 'notification'>('newsletter');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [useBlobStorage, setUseBlobStorage] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && editingId) {
      fetchTemplate();
    }
  }, [mode, editingId]);

  const fetchTemplate = async () => {
    if (!editingId) return;

    try {
      setLoading(true);
      const template = await getEmailTemplate(editingId);
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setSubject(template.subject);
      setHtmlContent(template.html_content);
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load template', 'error');
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
        setUploadProgress('Uploading template and images...');
        if (imageFiles.length > 0) {
          setUploadProgress(`Uploading ${imageFiles.length} image(s)... This may take a few minutes.`);
        }
        
        await uploadHTMLTemplate(name, subject, htmlFile, description, category, imageFiles, useBlobStorage);
        setUploadProgress('');
        showToast(`✅ Template uploaded successfully with ${imageFiles.length} images!`, 'success');
      } else if (mode === 'edit' && editingId) {
        // Update existing template
        await updateEmailTemplate(editingId, {
          name,
          description,
          category,
          subject,
          html_content: htmlContent,
        });
        showToast('Template updated successfully', 'success');
      } else {
        // Create new template
        await createEmailTemplate({
          name,
          description,
          category,
          subject,
          html_content: htmlContent,
        });
        showToast('Template created successfully', 'success');
      }

      onSuccess();
    } catch (error: any) {
      setUploadProgress('');
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save template';
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
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
      showToast('Please enter a test email address', 'error');
      return;
    }

    if (!editingId) {
      showToast('Please save the template first before sending a test', 'error');
      return;
    }

    try {
      setSendingTestEmail(true);
      const response = await sendTestEmail(editingId, { to_email: testEmail });
      showToast(response.message, 'success');
      setTestEmail('');
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to send test email', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'upload': return '📤 Upload HTML Template';
      case 'edit': return '✏️ Edit Email Template';
      case 'create': return '➕ Create New Template';
    }
  };

  if (loading && mode === 'edit') {
    return (
      <div className="email-template-form">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-template-form">
      {/* Header */}
      <div className="form-header">
        <h2>{getTitle()}</h2>
        <button className="btn-close" onClick={onCancel}>✕</button>
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
                onChange={(e) => setCategory(e.target.value as any)}
                required
              >
                <option value="newsletter">Newsletter</option>
                <option value="transactional">Transactional</option>
                <option value="promotional">Promotional</option>
                <option value="notification">Notification</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Email Subject *</label>
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
        </div>

        {/* HTML Content */}
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

          {mode !== 'upload' && (
            <div className="form-group">
              <label htmlFor="html-content">HTML Content *</label>
              <textarea
                id="html-content"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<html>...</html>"
                rows={15}
                className="code-textarea"
                required
              />
            </div>
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

        {/* Test Email */}
        {mode === 'edit' && (
          <div className="form-section">
            <h3>📧 Send Test Email</h3>
            <div className="form-row">
              <div className="form-group flex-grow">
                <label htmlFor="test-email">Test Email Address</label>
                <input
                  type="email"
                  id="test-email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
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
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              uploadProgress || 'Saving...'
            ) : (
              mode === 'upload' ? 'Upload Template' : 'Save Template'
            )}
          </button>
        </div>
        
        {/* Upload Progress */}
        {uploadProgress && (
          <div className="upload-progress">
            <div className="loader"></div>
            <p>{uploadProgress}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default EmailTemplateForm;
