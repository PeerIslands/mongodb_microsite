import { useState, useEffect } from 'react';
import {
  AcceleratorTabs,
  AcceleratorHero,
  PeerAISection,
  DemoVideoSection,
  PDFViewerSection,
  MetricsSection,
  DownloadSection,
} from '@/features/accelerators/components';
import { acceleratorsService, getFileUrl } from '@/api/services/accelerators.service';
import type { AcceleratorDetail } from '@/types/models/accelerator';
import '@/styles/pages/AcceleratorsPage.css';

/**
 * Accelerators Page - Tab-based accelerator showcase
 */
const AcceleratorsPage = () => {
  const [accelerators, setAccelerators] = useState<AcceleratorDetail[]>([]);
  const [activeAccelerator, setActiveAccelerator] = useState<AcceleratorDetail | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accelerators from API
  useEffect(() => {
    const fetchAccelerators = async () => {
      setLoading(true);
      try {
        const data = await acceleratorsService.getAll({ status: 'published' });
        if (data && data.length > 0) {
          setAccelerators(data);
          setActiveAccelerator(data[0]);
        }
        // If no data, accelerators remains empty and will show "no accelerators" message
      } catch (err) {
        console.error('Failed to fetch accelerators:', err);
        setError('Failed to load accelerators');
        // On error, accelerators remains empty
      } finally {
        setLoading(false);
      }
    };

    fetchAccelerators();
  }, []);

  const handleAcceleratorChange = (acc: AcceleratorDetail) => {
    setActiveAccelerator(acc);
    setIsVideoPlaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoPlayToggle = (playing: boolean) => {
    setIsVideoPlaying(playing);
  };

  // Loading state
  if (loading) {
    return (
      <div className="accelerators-page">
        <div className="accelerators-loading">
          <div className="accelerators-loading-spinner" />
          <p>Loading accelerators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accelerators-page">
      {/* Error banner (non-blocking) */}
      {error && (
        <div className="accelerators-error-banner">
          <span>{error} - Showing cached data</span>
        </div>
      )}

      {/* PeerAI Platform Section - Always show */}
      <PeerAISection />

      {/* No accelerators available */}
      {!activeAccelerator && (
        <div className="accelerators-empty">
          <p>No accelerators available at this time.</p>
        </div>
      )}

      {/* Accelerator Content - Only show when accelerator is available */}
      {activeAccelerator && (
        <>
          {/* Tab Navigation */}
          <AcceleratorTabs
            accelerators={accelerators}
            activeAcceleratorId={activeAccelerator.id}
            onTabChange={handleAcceleratorChange}
          />

          {/* Hero Section */}
          <AcceleratorHero
            title={activeAccelerator.title}
            subtitle={activeAccelerator.subtitle}
            description={activeAccelerator.description}
          />

          {/* Video Section - Show if video_url exists */}
          {activeAccelerator.video_url && (
            <DemoVideoSection
              videoUrl={getFileUrl(activeAccelerator.video_url)}
              thumbnailUrl={getFileUrl(activeAccelerator.thumbnail_url)}
              title={activeAccelerator.title}
              isPlaying={isVideoPlaying}
              onPlayToggle={handleVideoPlayToggle}
            />
          )}

          {/* PDF Viewer Section - Show if no video but pdf_url exists */}
          {!activeAccelerator.video_url && activeAccelerator.pdf_url && (
            <PDFViewerSection
              pdfUrl={getFileUrl(activeAccelerator.pdf_url)}
              title={activeAccelerator.title}
            />
          )}

          {/* Metrics Section */}
          {activeAccelerator.metrics && activeAccelerator.metrics.length > 0 && (
            <MetricsSection metrics={activeAccelerator.metrics} />
          )}

          {/* Download Section */}
          {activeAccelerator.pdf_url && (
            <DownloadSection
              title={activeAccelerator.title}
              pdfUrl={getFileUrl(activeAccelerator.pdf_url, true)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AcceleratorsPage;
