import { useState, useRef } from 'react';
import '@/styles/components/admin/FileUpload.css';

interface FileUploadProps {
  accept: string;
  maxSize: number; // in MB
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (url: string | string[]) => void;
  currentFile?: string | string[];
  hint?: string;
}

const FileUpload = ({ 
  accept, 
  maxSize, 
  multiple = false,
  maxFiles = 1,
  onUpload, 
  currentFile,
  hint 
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | string[] | null>(
    currentFile || null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    // Validate file count
    if (multiple && files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} exceeds ${maxSize}MB limit`);
        return;
      }
    }

    setUploading(true);

    try {
      if (multiple) {
        // Multiple file upload simulation
        const urls: string[] = [];
        const previews: string[] = [];
        
        for (const file of files) {
          // Create preview for images
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            const previewPromise = new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            const previewUrl = await previewPromise;
            previews.push(previewUrl);
          }
          
          // Simulate upload - Replace with actual upload logic
          const mockUrl = URL.createObjectURL(file);
          urls.push(mockUrl);
          
          // In production, upload to your server/S3:
          // const formData = new FormData();
          // formData.append('file', file);
          // const response = await fetch('/api/v1/admin/upload', {
          //   method: 'POST',
          //   body: formData
          // });
          // const data = await response.json();
          // urls.push(data.url);
        }
        
        setPreview(previews.length > 0 ? previews : urls);
        onUpload(urls);
      } else {
        // Single file upload
        const file = files[0];
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          setPreview('📄 ' + file.name);
        }
        
        // Simulate upload - Replace with actual upload logic
        const mockUrl = URL.createObjectURL(file);
        onUpload(mockUrl);
        
        // In production:
        // const formData = new FormData();
        // formData.append('file', file);
        // const response = await fetch('/api/v1/admin/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        // onUpload(data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload(multiple ? [] : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderPreview = () => {
    if (!preview) return null;

    if (Array.isArray(preview)) {
      return (
        <div className="preview-grid">
          {preview.map((url, index) => (
            <div key={index} className="preview-item">
              <img src={url} alt={`Preview ${index + 1}`} />
            </div>
          ))}
        </div>
      );
    }

    if (typeof preview === 'string' && preview.startsWith('📄')) {
      return (
        <div className="preview-pdf">
          <span className="pdf-icon">{preview}</span>
        </div>
      );
    }

    return (
      <div className="preview-single">
        <img src={preview} alt="Preview" />
      </div>
    );
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="file-input-hidden"
      />
      
      {preview ? (
        <div className="file-preview">
          {renderPreview()}
          <div className="preview-actions">
            <button
              type="button"
              className="change-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </button>
            <button
              type="button"
              className="remove-button-file"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Uploading...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                Drop {multiple ? 'files' : 'file'} here or click to browse
              </p>
              {hint && <p className="upload-hint">{hint}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;







