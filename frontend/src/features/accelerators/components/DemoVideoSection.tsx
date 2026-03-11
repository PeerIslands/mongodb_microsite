import { useRef, useEffect } from 'react';
import Hls from 'hls.js';
import '@/styles/features/accelerators/DemoVideoSection.css';

interface DemoVideoSectionProps {
  videoUrl: string;
  hlsPlaylistUrl?: string;
  thumbnailUrl?: string;
  title: string;
  isPlaying: boolean;
  onPlayToggle: (playing: boolean) => void;
}

function AcceleratorVideoPlayer({
  videoUrl,
  hlsPlaylistUrl,
  title,
}: {
  videoUrl: string;
  hlsPlaylistUrl?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsPlaylistUrl) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(hlsPlaylistUrl);
        hls.attachMedia(video);
        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsPlaylistUrl;
        return () => {
          video.removeAttribute('src');
        };
      }
    }

    video.src = videoUrl;
    return () => {
      video.removeAttribute('src');
    };
  }, [hlsPlaylistUrl, videoUrl]);

  const src = hlsPlaylistUrl ? undefined : videoUrl;

  return (
    <video
      ref={videoRef}
      src={src}
      title={title}
      controls
      autoPlay
    >
      Your browser does not support the video tag.
    </video>
  );
}

const DemoVideoSection = ({
  videoUrl,
  hlsPlaylistUrl,
  thumbnailUrl,
  title,
  isPlaying,
  onPlayToggle,
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
              <AcceleratorVideoPlayer
                videoUrl={videoUrl}
                hlsPlaylistUrl={hlsPlaylistUrl}
                title={title}
              />
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
