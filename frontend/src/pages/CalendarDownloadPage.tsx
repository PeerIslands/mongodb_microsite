import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { eventsService } from '@/api/services/events.service';
import LeafLoader from '@/components/LeafLoader';

// Global flag to prevent downloads across component re-mounts
let hasDownloadStarted = false;

/**
 * CalendarDownloadPage - Handles downloading ICS calendar files
 * 
 * This page is accessed via email links when users click "Add to Calendar"
 * It fetches the calendar file from the backend and triggers a download
 */
const CalendarDownloadPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const downloadAttemptedRef = useRef(false);

  useEffect(() => {
    const sessionKey = `calendar-downloaded-${eventId}`;

    // Skip if we've already attempted download in this component instance
    if (downloadAttemptedRef.current) {
      console.log('Download already attempted in this component instance, skipping...');
      return;
    }

    // Skip if download has already started globally
    if (hasDownloadStarted) {
      console.log('Download already started globally, skipping...');
      return;
    }

    // Skip if already downloaded in this browser session
    const alreadyDownloaded = sessionStorage.getItem(sessionKey);
    if (alreadyDownloaded) {
      console.log('Calendar already downloaded in this session, skipping...');
      setStatus('success');
      return;
    }

    const downloadCalendar = async () => {
      if (!eventId) {
        setStatus('error');
        setErrorMessage('Invalid event ID');
        return;
      }

      // Mark all flags immediately to prevent any race conditions
      downloadAttemptedRef.current = true;
      hasDownloadStarted = true;
      sessionStorage.setItem(sessionKey, 'true');

      console.log('Starting calendar download for event:', eventId);

      try {
        // Fetch and download the calendar file
        await eventsService.downloadCalendar(eventId);
        setStatus('success');
        console.log('Calendar download completed successfully');
      } catch (error) {
        console.error('Failed to download calendar:', error);
        setStatus('error');
        setErrorMessage('Failed to download calendar file. The event may not exist.');
        // Reset flags on error so user can retry by refreshing
        downloadAttemptedRef.current = false;
        hasDownloadStarted = false;
        sessionStorage.removeItem(sessionKey);
      }
    };

    downloadCalendar();
  }, [eventId]);

  const handleClose = () => {
    // Close the current browser tab/window
    window.close();
    
    // Fallback: If window.close() doesn't work (some browsers block it),
    // show a message instructing the user to close manually
    setTimeout(() => {
      alert('Please close this tab manually');
    }, 100);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #020916 0%, #0A1929 100%)',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
    }}>
      {status === 'loading' && (
        <>
          <LeafLoader />
          <p style={{ marginTop: '20px', fontSize: '18px' }}>
            Preparing your calendar file...
          </p>
        </>
      )}

      {status === 'success' && (
        <div>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
          }}>
            ✅
          </div>
          <h1 style={{
            fontSize: '28px',
            marginBottom: '10px',
            fontWeight: '600',
          }}>
            Calendar File Downloaded!
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#889397',
            marginBottom: '30px',
          }}>
            Open the downloaded .ics file to add the event to your calendar.
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              background: '#00ED64',
              color: '#001E2B',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Close Tab
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
          }}>
            ❌
          </div>
          <h1 style={{
            fontSize: '28px',
            marginBottom: '10px',
            fontWeight: '600',
            color: '#FF6B6B',
          }}>
            Download Failed
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#889397',
            marginBottom: '30px',
          }}>
            {errorMessage}
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              background: '#00ED64',
              color: '#001E2B',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Close Tab
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarDownloadPage;
