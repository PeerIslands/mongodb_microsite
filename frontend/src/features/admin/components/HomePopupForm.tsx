import { useState, useEffect } from 'react';
import {
  getAdminConfig,
  updateAdminConfig,
  uploadPopupImage,
  getHomePopupImageUrl,
} from '@/api/services/homePopup.service';
import '@/styles/features/admin/HomePopupForm.css';

const HomePopupForm = () => {
  const [config, setConfig] = useState<{
    image_url: string | null;
    title_text: string;
    cta_text: string;
    cta_link: string;
    enabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminConfig();
      setConfig(data);
    } catch (err) {
      setError('Failed to load popup config');
      setConfig({
        image_url: null,
        title_text: 'On-Demand webinar',
        cta_text: 'Click here to visit our On-Demand Webinars',
        cta_link: '/events/on-demand',
        enabled: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAdminConfig({
        title_text: config.title_text,
        cta_text: config.cta_text,
        cta_link: config.cta_link,
        enabled: config.enabled,
      });
      setSuccess('Popup settings saved.');
    } catch (err) {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await uploadPopupImage(imageFile);
      setConfig(updated);
      setImageFile(null);
      setSuccess('Image uploaded.');
    } catch (err) {
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="home-popup-form home-popup-form--loading">Loading...</div>;
  }

  const form = config!;

  return (
    <div className="home-popup-form">
      <h2 className="home-popup-form__title">Home Page Popup</h2>
      <p className="home-popup-form__desc">
        Configure the bottom-left popup on the home page (image, title, CTA). Same layout; content is editable here.
      </p>

      {error && <div className="home-popup-form__error" role="alert">{error}</div>}
      {success && <div className="home-popup-form__success" role="status">{success}</div>}

      <form onSubmit={handleSave} className="home-popup-form__form">
        {/* Image */}
        <div className="home-popup-form__section">
          <label className="home-popup-form__label">Background image</label>
          {form.image_url && (
            <div className="home-popup-form__preview">
              <img
                src={getHomePopupImageUrl()}
                alt="Current popup"
                className="home-popup-form__preview-img"
              />
            </div>
          )}
          <div className="home-popup-form__upload-row">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="home-popup-form__file"
            />
            <button
              type="button"
              className="home-popup-form__btn home-popup-form__btn--upload"
              disabled={!imageFile || uploading}
              onClick={handleImageUpload}
            >
              {uploading ? 'Uploading...' : 'Upload image'}
            </button>
          </div>
        </div>

        {/* Text fields */}
        <div className="home-popup-form__section">
          <label className="home-popup-form__label" htmlFor="title_text">Title (overlay text)</label>
          <input
            id="title_text"
            type="text"
            value={form.title_text}
            onChange={(e) => setConfig((c) => c ? { ...c, title_text: e.target.value } : c)}
            className="home-popup-form__input"
            placeholder="e.g. On-Demand webinar"
          />
        </div>
        <div className="home-popup-form__section">
          <label className="home-popup-form__label" htmlFor="cta_text">CTA text</label>
          <input
            id="cta_text"
            type="text"
            value={form.cta_text}
            onChange={(e) => setConfig((c) => c ? { ...c, cta_text: e.target.value } : c)}
            className="home-popup-form__input"
            placeholder="e.g. Click here to visit our On-Demand Webinars"
          />
        </div>
        <div className="home-popup-form__section">
          <label className="home-popup-form__label" htmlFor="cta_link">CTA link</label>
          <input
            id="cta_link"
            type="text"
            value={form.cta_link}
            onChange={(e) => setConfig((c) => c ? { ...c, cta_link: e.target.value } : c)}
            className="home-popup-form__input"
            placeholder="e.g. /events/on-demand or https://..."
          />
        </div>
        <div className="home-popup-form__section home-popup-form__section--row">
          <input
            id="enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setConfig((c) => c ? { ...c, enabled: e.target.checked } : c)}
            className="home-popup-form__checkbox"
          />
          <label className="home-popup-form__label" htmlFor="enabled">Show popup on home page</label>
        </div>

        <div className="home-popup-form__actions">
          <button type="submit" className="home-popup-form__btn home-popup-form__btn--primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HomePopupForm;
