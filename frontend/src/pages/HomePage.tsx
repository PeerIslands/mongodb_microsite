import { useState, useEffect } from 'react';
import {
  Hero,
  Statistics,
  Capabilities,
  CaseStudies,
  Events,
  Testimonials,
  OnDemandWebinarsPopup,
} from '@/features/home/components';
import type { HomePopupConfig } from '@/features/home/components/OnDemandWebinarsPopup';
import { getPublicConfig, getHomePopupImageUrl } from '@/api/services/homePopup.service';
import '@/styles/pages/HomePage.css';

/**
 * Homepage - Main landing page
 */
const HomePage = () => {
  const [popupConfig, setPopupConfig] = useState<HomePopupConfig | null>(null);

  useEffect(() => {
    getPublicConfig()
      .then((data) => {
        if (!data) return;
        const imageUrl = getHomePopupImageUrl();
        const config: HomePopupConfig = {
          imageUrl,
          titleText: data.title_text,
          ctaText: data.cta_text,
          ctaLink: data.cta_link,
        };
        // Preload image so popup never appears with a blank/loading bg
        const img = new window.Image();
        img.src = imageUrl;
        if (img.complete) {
          setPopupConfig(config);
        } else {
          // Show popup once image is ready, or after 4s max to avoid never showing
          const fallback = setTimeout(() => setPopupConfig(config), 4000);
          img.onload = () => { clearTimeout(fallback); setPopupConfig(config); };
          img.onerror = () => { clearTimeout(fallback); };
        }
      })
      .catch(() => { /* no popup on error */ });
  }, []);

  return (
    <div className="home-page">
      <OnDemandWebinarsPopup config={popupConfig} />
      <Hero />
      <Statistics />
      <Capabilities />
      <CaseStudies />
      <Testimonials />
      <Events />
    </div>
  );
};

export default HomePage;

