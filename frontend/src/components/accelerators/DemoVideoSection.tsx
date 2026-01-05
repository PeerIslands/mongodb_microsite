import { useState } from 'react';
import '@/styles/components/accelerators/DemoVideoSection.css';

interface DemoVideo {
  url: string;
  thumbnail: string;
  duration: string;
  title: string;
}

interface DemoVideoSectionProps {
  video: DemoVideo;
}

const DemoVideoSection = ({ video }: DemoVideoSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    // Track video view analytics
    console.log('Video played:', video.title);
  };

  return (
    <section className="demo-video-section">
      <div className="demo-video-container">
        <h2 className="section-heading">Watch Demo</h2>
        <p className="demo-subtitle">
          See {video.title} in action ({video.duration})
        </p>
        
        <div className="video-wrapper">
          {!isPlaying ? (
            <div className="video-thumbnail" onClick={handlePlay}>
              <img 
                src={video.thumbnail} 
                alt={video.title}
                onError={(e) => {
                  // Fallback gradient
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="play-button-overlay">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="28" fill="rgba(91, 108, 255, 0.9)" />
                    <polygon points="24,18 24,42 42,30" fill="white" />
                  </svg>
                </div>
              </div>
              <div className="video-duration">{video.duration}</div>
            </div>
          ) : (
            <div className="video-player">
              <iframe
                src={video.url}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;







