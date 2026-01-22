import { useState, useRef, useEffect } from 'react';
import '@/styles/features/admin/FileUpload.css';

export interface FileUploadResult {
  file: File | null;
  previewUrl: string;
}

interface FileUploadProps {
  accept: string;
  maxSize: number; // in MB
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (result: FileUploadResult | FileUploadResult[]) => void;
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
  const [preview, setPreview] = useState<string | string[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | 'other' | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set preview from currentFile prop (for edit mode)
  useEffect(() => {
    if (currentFile && typeof currentFile === 'string' && currentFile.length > 0) {
      setPreview(currentFile);
      // Determine file type from URL
      const lowerUrl = currentFile.toLowerCase();
      if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) {
        setFileType('image');
      } else if (lowerUrl.match(/\.(mp4|mov|webm|avi)(\?|$)/)) {
        setFileType('video');
      } else if (lowerUrl.match(/\.pdf(\?|$)/)) {
        setFileType('pdf');
        // Extract filename from URL
        const urlParts = currentFile.split('/');
        setFileName(urlParts[urlParts.length - 1].split('?')[0]);
      } else {
        setFileType('other');
      }
    }
  }, [currentFile]);

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

  const getFileType = (file: File): 'image' | 'video' | 'pdf' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
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
        // Multiple file upload - return File objects with preview URLs
        const results: FileUploadResult[] = [];
        const previews: string[] = [];
        
        for (const file of files) {
          let previewUrl = '';
          
          // Create preview for images
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            const previewPromise = new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            previewUrl = await previewPromise;
            previews.push(previewUrl);
          } else {
            previewUrl = URL.createObjectURL(file);
            previews.push(previewUrl);
          }
          
          results.push({ file, previewUrl });
        }
        
        setPreview(previews);
        onUpload(results);
      } else {
        // Single file upload - return File object with preview URL
        const file = files[0];
        const detectedFileType = getFileType(file);
        setFileType(detectedFileType);
        setFileName(file.name);
        
        let previewUrl = '';
        
        if (detectedFileType === 'image') {
          const reader = new FileReader();
          const previewPromise = new Promise<string>((resolve) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              setPreview(result);
              resolve(result);
            };
            reader.readAsDataURL(file);
          });
          previewUrl = await previewPromise;
        } else if (detectedFileType === 'video') {
          previewUrl = URL.createObjectURL(file);
          setPreview(previewUrl);
        } else if (detectedFileType === 'pdf') {
          previewUrl = URL.createObjectURL(file);
          setPreview(previewUrl);
        } else {
          previewUrl = URL.createObjectURL(file);
          setPreview(previewUrl);
        }
        
        onUpload({ file, previewUrl });
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
    setFileName(null);
    setFileType(null);
    onUpload(multiple ? [] : { file: null, previewUrl: '' });
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

    switch (fileType) {
      case 'image':
        return (
          <div className="preview-single">
            <img src={preview} alt="Preview" />
          </div>
        );
      
      case 'video':
        return (
          <div className="preview-video">
            <video src={preview} controls muted>
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="preview-pdf">
            <span className="pdf-icon">📄</span>
            <span className="pdf-name">{fileName || 'PDF Document'}</span>
          </div>
        );
      
      default:
        return (
          <div className="preview-file">
            <span className="file-icon">📁</span>
            <span className="file-name">{fileName || 'File'}</span>
          </div>
        );
    }
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
