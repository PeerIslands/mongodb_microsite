import React, { useState, useEffect } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { userService } from '@/api/services/user.service';
import type { UserProfile, UserProfileUpdate } from '@/types/models/user';
import '../styles/pages/ProfilePage.css';

// Helper to convert country name to ISO country code
const getCountryCode = (countryName: string): any => {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'India': 'IN',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Singapore': 'SG',
    'Japan': 'JP',
    'China': 'CN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Netherlands': 'NL',
    'Spain': 'ES',
    'Italy': 'IT',
    'South Korea': 'KR',
    'United Arab Emirates': 'AE',
    'Switzerland': 'CH',
    'Sweden': 'SE',
  };
  return countryMap[countryName] || 'US';
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileUpdate>({
    first_name: '',
    last_name: '',
    company: '',
    job_function: '',
    business_phone: '',
    country: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        company: data.company || '',
        job_function: data.job_function || '',
        business_phone: data.business_phone || '',
        country: data.country || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      business_phone: value || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate phone number if provided
    if (formData.business_phone && !isValidPhoneNumber(formData.business_phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setSaving(true);

    try {
      const updated = await userService.updateProfile(formData);
      setProfile(updated);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        company: profile.company || '',
        job_function: profile.job_function || '',
        business_phone: profile.business_phone || '',
        country: profile.country || '',
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-message">
            {error || 'Failed to load profile'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-header-content">
            <h1>My Profile</h1>
            <p className="profile-subtitle">
              {isEditing ? 'Update your profile information' : 'View and manage your account details'}
            </p>
          </div>
          {!isEditing && (
            <button 
              className="btn-edit" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">
                    First Name <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="Enter your first name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">
                    Last Name <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    placeholder="Enter your last name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company">
                  Company <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  placeholder="Enter your company name"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="country">
                    Country <span className="required-asterisk">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  >
                    <option value="">Select country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="India">India</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="South Korea">South Korea</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="business_phone">
                    Business Phone <span className="required-asterisk">*</span>
                  </label>
                  <PhoneInput
                    international
                    defaultCountry={getCountryCode(formData.country || '')}
                    value={formData.business_phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    disabled={saving}
                    className="phone-input-wrapper"
                    numberInputProps={{
                      className: 'form-input phone-input-field',
                      required: true,
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="job_function">
                  Job Function <span className="required-asterisk">*</span>
                </label>
                <select
                  id="job_function"
                  name="job_function"
                  value={formData.job_function}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                >
                  <option value="">Select job function</option>
                  <option value="IT Executive (CIO, CTO, VP Engineering, etc.)">IT Executive (CIO, CTO, VP Engineering, etc.)</option>
                  <option value="Business Executive (CEO, COO, CMO, etc.)">Business Executive (CEO, COO, CMO, etc.)</option>
                  <option value="Architect">Architect</option>
                  <option value="Business Development / Alliance Manager">Business Development / Alliance Manager</option>
                  <option value="DBA">DBA</option>
                  <option value="Technical Operations">Technical Operations</option>
                  <option value="Director / Development Manager">Director / Development Manager</option>
                  <option value="Product / Project Manager">Product / Project Manager</option>
                  <option value="Software Developer / Engineer">Software Developer / Engineer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-section">
                <h2>Personal Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">First Name</span>
                    <span className="value">{profile.first_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Last Name</span>
                    <span className="value">{profile.last_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">
                      {profile.user_email}
                      <span className="readonly-badge">Read-only</span>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Company</span>
                    <span className="value">{profile.company || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Job Function</span>
                    <span className="value">{profile.job_function || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Business Phone</span>
                    <span className="value">{profile.business_phone || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Country</span>
                    <span className="value">{profile.country || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2>Account Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Account Type</span>
                    <span className="value">
                      {profile.is_admin ? (
                        <span className="badge badge-admin">Admin</span>
                      ) : (
                        <span className="badge badge-user">User</span>
                      )}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Two-Factor Auth</span>
                    <span className="value">
                      {profile.totp_enabled ? (
                        <span className="badge badge-enabled">Enabled</span>
                      ) : (
                        <span className="badge badge-disabled">Disabled</span>
                      )}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Member Since</span>
                    <span className="value">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
