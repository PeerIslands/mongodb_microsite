import { useState } from 'react';
import '@/styles/features/admin/FileManager.css';

interface DownloadFile {
  name: string;
  description: string;
  file_url: string;
  version: string;
}

interface FileManagerProps {
  files: DownloadFile[];
  onChange: (files: DownloadFile[]) => void;
}

const FileManager = ({ files, onChange }: FileManagerProps) => {
  const [, setUploading] = useState(false);

  const handleAddFile = () => {
    const newFile: DownloadFile = {
      name: '',
      description: '',
      file_url: '',
      version: '1.0.0'
    };
    onChange([...files, newFile]);
  };

  const handleFileChange = (index: number, field: keyof DownloadFile, value: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    onChange(newFiles);
  };

  const handleFileUpload = async (index: number, file: File) => {
    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File must be less than 50MB');
      return;
    }

    setUploading(true);

    try {
      // Simulate upload
      const mockUrl = URL.createObjectURL(file);
      
      // Update file info
      const newFiles = [...files];
      newFiles[index] = {
        ...newFiles[index],
        file_url: mockUrl,
        name: newFiles[index].name || file.name.split('.')[0]
      };
      onChange(newFiles);

      // In production:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/v1/admin/upload-file', {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      // handleFileChange(index, 'file_url', data.url);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div className="file-manager">
      {files.map((file, index) => (
        <div key={index} className="file-manager-item">
          <div className="file-manager-header">
            <h4>Download File {index + 1}</h4>
            <button
              type="button"
              className="remove-file-button"
              onClick={() => handleRemoveFile(index)}
            >
              ×
            </button>
          </div>
          
          <div className="file-manager-fields">
            {/* File Upload */}
            <div className="file-upload-field">
              <input
                type="file"
                id={`file-upload-${index}`}
                accept=".zip,.pdf,.exe,.dmg,.tar.gz"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(index, e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor={`file-upload-${index}`} className="file-upload-button">
                {file.file_url ? (
                  <>
                    <span className="file-uploaded-icon">✓</span>
                    <span>File Uploaded - Change</span>
                  </>
                ) : (
                  <>
                    <span className="file-upload-icon">📁</span>
                    <span>Choose File</span>
                  </>
                )}
              </label>
              {file.file_url && (
                <span className="file-name-display">
                  {file.name || 'File uploaded'}
                </span>
              )}
            </div>
            
            {/* File Details */}
            <input
              type="text"
              value={file.name}
              onChange={(e) => handleFileChange(index, 'name', e.target.value)}
              placeholder="File name (e.g., Migration Toolkit v2.3)"
              required
            />
            
            <textarea
              value={file.description}
              onChange={(e) => handleFileChange(index, 'description', e.target.value)}
              placeholder="File description"
              rows={2}
              required
            />
            
            <input
              type="text"
              value={file.version}
              onChange={(e) => handleFileChange(index, 'version', e.target.value)}
              placeholder="Version (e.g., 2.3.0)"
              required
            />
          </div>
        </div>
      ))}
      
      <button
        type="button"
        className="add-file-button"
        onClick={handleAddFile}
      >
        + Add Download File
      </button>
    </div>
  );
};

export default FileManager;

