import { useState, useRef } from 'react';
import '@/styles/components/admin/VideoUploader.css';

interface VideoUploaderProps {
  onUpload: (url: string) => void;
  currentFile?: string;
}

const VideoUploader = ({ onUpload, currentFile }: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentFile || null);
  const [videoInfo, setVideoInfo] = useState<{ name: string; size: string } | null>(null);
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
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (MP4, MOV, etc.)');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video file must be less than 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload with progress
      // In production, use actual upload with progress tracking
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Create preview URL
      const mockUrl = URL.createObjectURL(file);
      setPreview(mockUrl);
      
      // Get video info
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setVideoInfo({
        name: file.name,
        size: `${sizeInMB} MB`
      });

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        onUpload(mockUrl);
        
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      }, 2000);

      // In production, upload to server/S3:
      // const formData = new FormData();
      // formData.append('video', file);
      // const response = await fetch('/api/v1/admin/upload-video', {
      //   method: 'POST',
      //   body: formData,
      //   onUploadProgress: (progressEvent) => {
      //     const progress = (progressEvent.loaded / progressEvent.total) * 100;
      //     setUploadProgress(progress);
      //   }
      // });
      // const data = await response.json();
      // onUpload(data.url);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setVideoInfo(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="video-uploader-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="file-input-hidden"
      />
      
      {preview && !uploading ? (
        <div className="video-preview">
          <div className="video-preview-content">
            <div className="video-icon">🎬</div>
            <div className="video-info">
              <h4>{videoInfo?.name || 'Video uploaded'}</h4>
              <p>{videoInfo?.size || 'Size unknown'}</p>
            </div>
          </div>
          <div className="preview-actions">
            <button
              type="button"
              className="change-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Video
            </button>
            <button
              type="button"
              className="remove-button-video"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`video-drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="upload-status">
              <div className="progress-circle">
                <svg className="progress-ring" width="80" height="80">
                  <circle
                    className="progress-ring-bg"
                    stroke="rgba(91, 108, 255, 0.2)"
                    strokeWidth="4"
                    fill="transparent"
                    r="36"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className="progress-ring-fill"
                    stroke="#5b6cff"
                    strokeWidth="4"
                    fill="transparent"
                    r="36"
                    cx="40"
                    cy="40"
                    strokeDasharray={`${(uploadProgress / 100) * 226} 226`}
                    strokeDashoffset="0"
                  />
                </svg>
                <span className="progress-percentage">{Math.round(uploadProgress)}%</span>
              </div>
              <p>Uploading video...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">🎬</div>
              <p className="upload-text">
                Drop video here or click to browse
              </p>
              <p className="upload-hint">
                MP4, MOV, or AVI (Max 100MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;

