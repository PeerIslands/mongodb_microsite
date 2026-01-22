import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuthModal } from '@/contexts/AuthModalContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/styles/features/accelerators/PDFViewerSection.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerSectionProps {
  pdfUrl: string;
  title: string;
}

const PDFViewerSection = ({ pdfUrl, title }: PDFViewerSectionProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { openLoginModal } = useAuthModal();

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Failed to load PDF:', err);
    setError('Failed to load PDF document');
    setIsLoading(false);
  }, []);

  // Zoom controls
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const isLoggedIn = () => {
    return !!localStorage.getItem('authToken');
  };

  const downloadPdf = () => {
    globalThis.open(pdfUrl, '_blank');
  };

  // Download PDF - requires login
  const handleDownload = () => {
    if (isLoggedIn()) {
      downloadPdf();
    } else {
      // Open login modal with callback to download after successful login
      openLoginModal(downloadPdf);
    }
  };

  return (
    <section className="pdf-viewer-section">
      <div className="pdf-viewer-container">
        {/* Toolbar */}
        <div className="pdf-toolbar">
          {/* Zoom Controls */}
          <div className="pdf-toolbar-group">
            <button
              type="button"
              className="pdf-toolbar-btn"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              className="pdf-toolbar-btn zoom-reset"
              onClick={resetZoom}
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              className="pdf-toolbar-btn"
              onClick={zoomIn}
              disabled={scale >= 3}
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Page Count Display */}
          <div className="pdf-toolbar-group">
            <span className="pdf-page-count">{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
          </div>

          {/* Download Button */}
          <div className="pdf-toolbar-group">
            <button
              type="button"
              className="pdf-toolbar-btn download-btn"
              onClick={handleDownload}
              title="Download PDF"
            >
              Download
            </button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="pdf-document-wrapper">
          {isLoading && (
            <div className="pdf-loading">
              <div className="pdf-loading-spinner" />
              <p>Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <p>{error}</p>
              <button type="button" onClick={() => globalThis.location.reload()}>
                Retry
              </button>
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            error={null}
            className="pdf-document"
          >
            {/* Render all pages in a scrollable container */}
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                className="pdf-page"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            ))}
          </Document>
        </div>

        {/* PDF Title */}
        <div className="pdf-title-bar">
          <span className="pdf-title">{title} - Technical Specifications</span>
        </div>
      </div>
    </section>
  );
};

export default PDFViewerSection;
