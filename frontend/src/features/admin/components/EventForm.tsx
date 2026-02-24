import { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/features/admin/EventForm.css';
import RichTextEditor from './RichTextEditor';
import { eventsService, CreateEventDto } from '@/api/services/events.service';
import type { EventStatus, EventType } from '@/types/models/event';

// Event type options
const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In Person' },
  { value: 'hybrid', label: 'Hybrid' },
];

// Get location placeholder based on event type
const getLocationPlaceholder = (eventType: EventType): string => {
  switch (eventType) {
    case 'online':
      return 'Enter meeting link (e.g., https://zoom.us/j/...)';
    case 'in-person':
      return 'Enter physical address';
    case 'hybrid':
      return 'Enter meeting link and/or physical address';
    default:
      return 'Enter location';
  }
};

// Default category options
const DEFAULT_CATEGORIES = [
  'Webinar',
  'Workshop',
  'Conference',
  'Meetup',
  'Hackathon',
  'Training',
  'Panel Discussion',
  'Networking Event',
  'Product Launch',
  'Tech Talk',
];

interface EventFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EventForm = ({ editingId, onCancel, onSuccess }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's timezone
    durationMinutes: 60,
    description: '',
    attendeeValue: '',
    category: '',
    featured: false,
    status: 'draft' as 'published' | 'draft' | 'archived',
    eventType: 'online' as EventType,
    location: '',
  });

  // Date and time picker states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  // Category states
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File upload states (only for editing past events)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [deleteThumbnail, setDeleteThumbnail] = useState(false);
  const [deleteVideo, setDeleteVideo] = useState(false);

  // Check if selected date is in the past
  const isDateInPast = useMemo(() => {
    if (!selectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }, [selectedDate]);

  // Combined categories (default + existing from API)
  const allCategories = useMemo(() => {
    const combined = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, [existingCategories]);

  // Fetch existing categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await eventsService.getCategories();
        setExistingCategories(categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchEventData = useCallback(async (id: string) => {
    try {
      setErrorMessage(null);
      const data = await eventsService.getById(id);

      // Parse date and time from API response
      let parsedDate: Date | null = null;
      let parsedTime: Date | null = null;

      if (data.date) {
        parsedDate = new Date(data.date + 'T00:00:00');
        setSelectedDate(parsedDate);
      }

      if (data.time) {
        const [hours, minutes] = data.time.split(':').map(Number);
        parsedTime = new Date();
        parsedTime.setHours(hours, minutes, 0, 0);
        setSelectedTime(parsedTime);
      }

      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || '',
        date: data.date || '',
        time: data.time || '',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        durationMinutes: data.duration_minutes || 60,
        description: data.description || '',
        attendeeValue: data.attendee_value || '',
        category: data.category || '',
        featured: data.featured || false,
        status: data.status || 'draft',
        eventType: data.event_type || 'online',
        location: data.location || '',
      });

      // Load existing file URLs (for past events)
      if (data.thumbnail_url) {
        setThumbnailPreview(data.thumbnail_url);
      }
      if (data.video_url) {
        setVideoPreview(data.video_url);
      }

      // Check if category is custom
      const category = data.category || '';
      if (category && !allCategories.includes(category)) {
        setCustomCategory(category);
        setShowCustomCategoryInput(true);
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setErrorMessage('Failed to load event data. Please try again.');
    }
  }, [allCategories]);

  // Fetch event data when editing
  useEffect(() => {
    if (editingId) {
      fetchEventData(editingId);
    }
  }, [editingId, fetchEventData]);

  // Handle date change from DatePicker
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      handleInputChange('date', `${year}-${month}-${day}`);
    } else {
      handleInputChange('date', '');
    }
  };

  // Handle time change from TimePicker
  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (time) {
      // Format as HH:mm (24-hour)
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      handleInputChange('time', `${hours}:${minutes}`);
    } else {
      handleInputChange('time', '');
    }
  };

  // Category handlers
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    if (selectedCategory === '__custom__') {
      setShowCustomCategoryInput(true);
      handleInputChange('category', '');
    } else {
      setShowCustomCategoryInput(false);
      setCustomCategory('');
      handleInputChange('category', selectedCategory);
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    handleInputChange('category', value);
  };

  const handleClearCustomCategory = () => {
    setShowCustomCategoryInput(false);
    setCustomCategory('');
    handleInputChange('category', '');
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // File upload handlers (for editing past events)
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Thumbnail must be an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Thumbnail file size must be less than 5MB');
        return;
      }
      setThumbnailFile(file);
      setDeleteThumbnail(false);
      setThumbnailPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Video must be a video file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage('Video file size must be less than 100MB');
        return;
      }
      setVideoFile(file);
      setDeleteVideo(false);
      setVideoPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (editingId && thumbnailPreview) {
      setDeleteThumbnail(true);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    if (editingId && videoPreview) {
      setDeleteVideo(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!formData.title.trim()) {
      setErrorMessage('Please enter a title.');
      return;
    }
    if (!formData.date) {
      setErrorMessage('Please select a date.');
      return;
    }
    if (!formData.time) {
      setErrorMessage('Please select a time.');
      return;
    }
    if (!formData.timezone) {
      setErrorMessage('Please select a timezone.');
      return;
    }
    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      setErrorMessage('Please enter a valid duration in minutes.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please enter a description.');
      return;
    }
    if (!formData.attendeeValue.trim()) {
      setErrorMessage('Please enter attendee value.');
      return;
    }
    if (!formData.category.trim()) {
      setErrorMessage('Please select or enter a category.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMessage('Please enter a location.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if we need to use FormData (for file uploads in edit mode)
      const hasFiles = editingId && (thumbnailFile || videoFile || deleteThumbnail || deleteVideo);
      
      if (hasFiles) {
        // Use FormData for file uploads (edit mode only)
        const formDataToSend = new FormData();
        
        formDataToSend.append('title', formData.title);
        formDataToSend.append('subtitle', formData.subtitle);
        formDataToSend.append('date', formData.date);
        formDataToSend.append('time', formData.time);
        formDataToSend.append('timezone', formData.timezone);
        formDataToSend.append('duration_minutes', String(formData.durationMinutes));
        formDataToSend.append('description', formData.description);
        formDataToSend.append('attendee_value', formData.attendeeValue);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('featured', String(formData.featured));
        formDataToSend.append('status', formData.status);
        formDataToSend.append('event_type', formData.eventType);
        formDataToSend.append('location', formData.location);
        
        // Add file uploads
        if (thumbnailFile) {
          formDataToSend.append('thumbnail', thumbnailFile);
        }
        if (videoFile) {
          formDataToSend.append('video', videoFile);
        }
        
        // Add delete flags
        formDataToSend.append('delete_thumbnail', String(deleteThumbnail));
        formDataToSend.append('delete_video', String(deleteVideo));

        await eventsService.updateWithFiles(editingId, formDataToSend);
      } else {
        // Use regular JSON for create or edit without files
        const submitData: CreateEventDto = {
          title: formData.title,
          subtitle: formData.subtitle,
          date: formData.date,
          time: formData.time,
          timezone: formData.timezone,
          duration_minutes: formData.durationMinutes,
          description: formData.description,
          attendee_value: formData.attendeeValue,
          category: formData.category,
          featured: formData.featured,
          status: formData.status,
          event_type: formData.eventType,
          location: formData.location,
        };

        if (editingId) {
          await eventsService.update(editingId, submitData);
        } else {
          await eventsService.create(submitData);
        }
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Submit error:', error);
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      const message = axiosError?.response?.data?.detail || axiosError?.message || 'An error occurred while saving the event.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="event-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Event' : 'Add New Event'}
        </h2>
        <button className="cancel-button" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">1</span>
            Basic Information
          </h3>

          <div className="form-grid">
            <div className="form-field full-width">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Subtitle *</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Enter event subtitle"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Category *</label>
              {showCustomCategoryInput ? (
                <div className="category-custom-input">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    placeholder="Enter custom category"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="category-back-btn"
                    onClick={handleClearCustomCategory}
                  >
                    ← Back to list
                  </button>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={handleCategorySelect}
                >
                  <option value="" disabled>Select Category</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">Other (Custom)</option>
                </select>
              )}
            </div>

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                />
                <span>Featured Event</span>
              </label>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as EventStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Date & Time */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">2</span>
            Date & Time
          </h3>

          <div className="form-grid">
            <div className="form-field">
              <label>Date *</label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                placeholderText="Select date"
                className="date-picker-input"
                calendarClassName="event-date-calendar"
                showPopperArrow={false}
              />
              {isDateInPast && (
                <span className="field-warning">
                  This date is in the past. Please select a future date.
                </span>
              )}
            </div>

            <div className="form-field">
              <label>Time *</label>
              <DatePicker
                selected={selectedTime}
                onChange={handleTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                placeholderText="Select time"
                className="time-picker-input"
                calendarClassName="event-time-calendar"
                showPopperArrow={false}
              />
            </div>

            <div className="form-field">
              <label>Duration (minutes) *</label>
              <input
                type="text"
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', Number.parseInt(e.target.value) || 60)}
                placeholder="Duration in minutes"
                min="1"
                required
              />
            </div>

            <div className="form-field">
              <label>Timezone *</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                placeholder="e.g., America/New_York, PST, UTC+5:30"
              />
            </div>

            <div className="form-field">
              <label>Event Type *</label>
              <select
                value={formData.eventType}
                onChange={(e) => handleInputChange('eventType', e.target.value as EventType)}
                required
              >
                {EVENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={getLocationPlaceholder(formData.eventType)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Event Details */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">3</span>
            Event Details
          </h3>

          <div className="form-grid">
            <div className="form-field full-width">
              <label>Description *</label>
              <RichTextEditor
                value={formData.description}
                onChange={(markdown) => handleInputChange('description', markdown)}
                placeholder="Describe the event in detail"
                height="300px"
              />
            </div>

            <div className="form-field full-width">
              <label>Attendee Value *</label>
              <RichTextEditor
                value={formData.attendeeValue}
                onChange={(markdown) => handleInputChange('attendeeValue', markdown)}
                placeholder="Describe What value will attendees gain from this event"
                height="300px"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Media Uploads (Only for Editing Past Events) */}
        {editingId && isDateInPast && (
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-number">4</span>
              Media Uploads
              <span className="section-subtitle">(Optional)</span>
            </h3>

            <div className="info-banner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
              </svg>
              <span>This is a past event. You can optionally upload a thumbnail and video recording.</span>
            </div>

            <div className="form-grid">
              {/* Thumbnail Upload */}
              <div className="form-field full-width">
                <label>Thumbnail Image (Optional)</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="thumbnail-upload"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    style={{ display: 'none' }}
                  />
                  {thumbnailPreview ? (
                    <div className="file-preview">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="thumbnail-preview" />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={handleRemoveThumbnail}
                      >
                        Remove Thumbnail
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="thumbnail-upload" className="file-upload-label">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Click to upload thumbnail</span>
                      <span className="file-upload-hint">PNG, JPG up to 5MB</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div className="form-field full-width">
                <label>Video Recording (Optional)</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={handleVideoChange}
                    style={{ display: 'none' }}
                  />
                  {videoPreview ? (
                    <div className="file-preview">
                      <video src={videoPreview} controls className="video-preview" />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={handleRemoveVideo}
                      >
                        Remove Video
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="video-upload" className="file-upload-label">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Click to upload video</span>
                      <span className="file-upload-hint">MP4, WebM up to 100MB</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="form-error-message">
            <span>⚠️ &nbsp; {errorMessage}</span>
            <button
              type="button"
              className="error-dismiss"
              onClick={() => setErrorMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingId ? 'Update Event' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
