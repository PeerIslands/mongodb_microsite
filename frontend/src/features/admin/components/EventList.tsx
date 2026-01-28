import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/EventList.css';
import { eventsService, Event } from '@/api/services/events.service';

interface EventListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

const EventList = ({ onAddNew, onEdit }: EventListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch events on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsService.delete(id);
        // Refresh the list after deletion
        fetchEvents();
      } catch (err) {
        console.error('Failed to delete event:', err);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await eventsService.update(id, { status: newStatus });
      // Refresh the list after update
      fetchEvents();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="event-list">
        <div className="loading-state">Loading events. Please wait.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchEvents} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Events</h2>
          <span className="list-count">{events.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Event
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{events.filter(e => e.status === 'published').length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{events.filter(e => e.featured).length}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{events.filter(e => e.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="event-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Timezone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No events found. Click "Add New Event" to create one.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div className="title-cell">
                      {event.title}
                      {event.featured && <span className="featured-badge">Featured</span>}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{event.category}</span>
                  </td>
                  <td>
                    <div className="datetime-cell">
                      <span className="date-text">{formatDate(event.date)}</span>
                      <span className="time-text">{formatTime(event.time)}</span>
                    </div>
                  </td>
                  <td>{event.duration_minutes} min</td>
                  <td>
                    <span className="timezone-cell" title={event.timezone}>
                      {event.timezone.split('/').pop()?.replace(/_/g, ' ') || event.timezone}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`status-badge ${event.status === 'published' ? 'published' : 'draft'}`}
                      onClick={() => handleTogglePublish(event.id, event.status)}
                    >
                      {event.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button edit"
                        onClick={() => onEdit(event.id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDelete(event.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventList;
