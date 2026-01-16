import '@/styles/features/accelerators/DemoVideoSection.css';

interface DemoVideoSectionProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  isPlaying: boolean;
  onPlayToggle: (playing: boolean) => void;
}

const DemoVideoSection = ({ 
  videoUrl, 
  thumbnailUrl, 
  title, 
  isPlaying, 
  onPlayToggle 
}: DemoVideoSectionProps) => {
  const handlePlay = () => {
    onPlayToggle(true);
  };

  if (isPlaying) {
    return (
      <section className="video-hero-section">
        <div className="video-hero-container">
          <div className="video-hero-wrapper">
            <div className="video-player-large">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={videoUrl}
                title={title}
                controls
                autoPlay
                onEnded={() => onPlayToggle(false)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="video-hero-section">
      <div className="video-hero-container">
        <div className="video-hero-wrapper">
          <button 
            type="button"
            className="video-thumbnail-large" 
            onClick={handlePlay}
            aria-label={`Play ${title} video`}
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={`${title} video preview`} />
            ) : (
              <div className="video-thumbnail-placeholder">
                <span>Video Preview</span>
              </div>
            )}
            <div className="video-overlay">
              <span className="play-button-large" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M4 2L16 9L4 16V2Z" />
                </svg>
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
