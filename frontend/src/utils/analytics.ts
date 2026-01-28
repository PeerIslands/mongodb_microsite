/**
 * Analytics Tracker - Frontend utility for tracking user behavior
 * 
 * Features:
 * - Page view tracking
 * - Download tracking
 * - CTA click tracking
 * - Scroll depth tracking
 * - Session management
 */

import apiClient from '@/api/client';
import { withCache } from './requestCache';

export class AnalyticsTracker {
  private sessionId: string;
  private pageStartTime: number = 0;
  private scrollDepthTracked: Set<number> = new Set();
  private sessionInitialized: boolean = false;
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    // Don't initialize session in constructor (will be done on first trackPageView)
    this.setupScrollTracking();
    this.setupBeforeUnload();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async initializeSession() {
    // Prevent double initialization in React StrictMode
    if (this.sessionInitialized) {
      return;
    }

    const cacheKey = `analytics-session-${this.sessionId}`;
    
    try {
      await withCache(cacheKey, async () => {
        const referrer = document.referrer;
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams: Record<string, string> = {};
        
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
          const value = urlParams.get(param);
          if (value) utmParams[param] = value;
        });

        await apiClient.post('/api/v1/analytics/session', {
          session_id: this.sessionId,
          user_id: this.getUserId(),
          referrer: referrer || null,
          utm_params: utmParams,
          user_agent: navigator.userAgent,
        });
        
        return true;
      });
      
      this.sessionInitialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
    }
  }

  private getUserId(): string | null {
    // Get from auth context if available
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_email || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Update session with user_id after login
   * Call this method after successful login to associate the session with the user
   */
  async updateSessionUser() {
    try {
      const userId = this.getUserId();
      if (userId) {
        const cacheKey = `analytics-session-update-${this.sessionId}-${userId}`;
        await withCache(cacheKey, () =>
          apiClient.post('/api/v1/analytics/session/update-user', {
            session_id: this.sessionId,
            user_id: userId,
          })
        );
      }
    } catch (error) {
      console.error('Failed to update session user:', error);
    }
  }

  async trackPageView(pagePath: string) {
    // Skip tracking for admin and contact pages
    if (pagePath.startsWith('/admin') || pagePath.startsWith('/contact')) {
      return;
    }
    
    // Initialize session on first page view
    if (!this.sessionInitialized) {
      await this.initializeSession();
    }
    
    this.pageStartTime = Date.now();
    this.scrollDepthTracked.clear();
    
    const cacheKey = `analytics-pageview-${pagePath}-${this.pageStartTime}`;
    
    try {
      await withCache(cacheKey, () =>
        apiClient.post('/api/v1/analytics/track', {
          event_type: 'page_view',
          session_id: this.sessionId,
          page_path: pagePath,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          metadata: {
            title: document.title,
          }
        })
      );
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  async trackPageLeave() {
    if (this.pageStartTime === 0) return;
    
    const duration = Date.now() - this.pageStartTime;
    
    try {
      await apiClient.post('/api/v1/analytics/track', {
        event_type: 'page_view',
        session_id: this.sessionId,
        page_path: window.location.pathname,
        metadata: {
          duration: duration,
          exit: true,
        }
      });
    } catch (error) {
      console.error('Failed to track page leave:', error);
    }
  }

  async trackDownload(itemName: string, itemType: string, itemUrl: string) {
    // Skip tracking for admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }
    
    // Round to nearest 100ms to group rapid duplicate calls
    const timestamp = Math.floor(Date.now() / 100) * 100;
    const cacheKey = `analytics-download-${itemName}-${itemUrl}-${timestamp}`;
    
    try {
      await withCache(cacheKey, () =>
        apiClient.post('/api/v1/analytics/track', {
          event_type: 'download',
          session_id: this.sessionId,
          page_path: window.location.pathname,
          metadata: {
            download_item: itemName,
            resource_name: itemName, // For User Activity display
            download_type: itemType,
            download_url: itemUrl,
          }
        })
      );
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  }

  async trackCTAClick(ctaName: string, ctaLocation: string) {
    // Skip tracking for admin and profile pages
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/profile')) {
      return;
    }
    
    // Round to nearest 100ms to group rapid duplicate calls from StrictMode
    const timestamp = Math.floor(Date.now() / 100) * 100;
    const cacheKey = `analytics-cta-${ctaName}-${ctaLocation}-${timestamp}`;
    
    try {
      await withCache(cacheKey, () =>
        apiClient.post('/api/v1/analytics/track', {
          event_type: 'cta_click',
          session_id: this.sessionId,
          page_path: window.location.pathname,
          metadata: {
            cta_name: ctaName,
            cta_location: ctaLocation,
          }
        })
      );
    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }
  }

  async trackFormSubmit(formName: string, formLocation: string) {
    // Skip tracking for admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }
    
    // Round to nearest 100ms to group rapid duplicate calls
    const timestamp = Math.floor(Date.now() / 100) * 100;
    const cacheKey = `analytics-form-${formName}-${formLocation}-${timestamp}`;
    
    try {
      await withCache(cacheKey, () =>
        apiClient.post('/api/v1/analytics/track', {
          event_type: 'form_submit',
          session_id: this.sessionId,
          page_path: window.location.pathname,
          metadata: {
            form_name: formName,
            form_location: formLocation,
          }
        })
      );
    } catch (error) {
      console.error('Failed to track form submit:', error);
    }
  }

  private setupScrollTracking() {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollDepth = this.calculateScrollDepth();
          this.checkScrollMilestones(scrollDepth);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private calculateScrollDepth(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    return Math.min(Math.round(scrollPercent), 100);
  }

  private async checkScrollMilestones(depth: number) {
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (depth >= milestone && !this.scrollDepthTracked.has(milestone)) {
        this.scrollDepthTracked.add(milestone);
        await this.trackScrollDepth(milestone);
      }
    }
  }

  private async trackScrollDepth(depth: number) {
    // Skip tracking for admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }
    
    // Round to nearest second for scroll depth (they're milestones anyway)
    const timestamp = Math.floor(Date.now() / 1000) * 1000;
    const cacheKey = `analytics-scroll-${depth}-${window.location.pathname}-${timestamp}`;
    
    try {
      await withCache(cacheKey, () =>
        apiClient.post('/api/v1/analytics/track', {
          event_type: 'scroll_depth',
          session_id: this.sessionId,
          page_path: window.location.pathname,
          metadata: {
            scroll_depth: depth,
          }
        })
      );
    } catch (error) {
      console.error('Failed to track scroll depth:', error);
    }
  }

  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        event_type: 'page_view',
        session_id: this.sessionId,
        page_path: window.location.pathname,
        metadata: {
          duration: Date.now() - this.pageStartTime,
          exit: true,
        }
      });

      // Try to send with beacon API
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/track', blob);
      }
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsTracker();

