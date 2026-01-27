import { useState, useEffect } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/client';
import LeafLoader from '@/components/LeafLoader';
import { analytics } from '@/utils/analytics';
import '@/styles/pages/ContactPage.css';

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

const ContactPage = () => {
  const { showToast } = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [country, setCountry] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in and fetch their data
  useEffect(() => {
    const fetchUserData = async () => {
      const authToken = localStorage.getItem('authToken');
      
      if (authToken) {
        setIsLoggedIn(true);
        
        try {
          // Fetch user data from authenticated profile endpoint
          const response = await apiClient.get('/api/v1/profile');
          const userData = response.data;
          
          // Pre-fill form fields
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setUserEmail(userData.user_email || '');
          setCompany(userData.company || '');
          setJobFunction(userData.job_function || '');
          setBusinessPhone(userData.business_phone || '');
          setCountry(userData.country || '');
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If fetch fails, user can still fill the form manually
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName.trim() || !lastName.trim() || !userEmail.trim() || !company.trim() || 
        !jobFunction.trim() || !businessPhone || !country.trim() || !inquiry.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (!isValidPhoneNumber(businessPhone)) {
      showToast('Please enter a valid phone number.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post('/api/v1/contact/inquiry', {
        first_name: firstName,
        last_name: lastName,
        user_email: userEmail,
        company: company,
        job_function: jobFunction,
        business_phone: businessPhone,
        country: country,
        inquiry: inquiry,
      });

      // Track form submission
      analytics.trackFormSubmit('Contact Inquiry', 'Contact Page');

      showToast('Your inquiry has been submitted successfully!', 'success');
      
      // Clear only the inquiry field if user is logged in
      if (isLoggedIn) {
        setInquiry('');
      } else {
        // Clear all fields if not logged in
        setFirstName('');
        setLastName('');
        setUserEmail('');
        setCompany('');
        setJobFunction('');
        setBusinessPhone('');
        setCountry('');
        setInquiry('');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to submit inquiry. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {submitting && <LeafLoader />}
      <div className="contact-container">
        {/* Left Side - Email Us Box */}
        <div className="contact-sidebar">
          <div className="email-us-card">
            <h3 className="email-us-title">Email Us</h3>
            <a href="mailto:engage@peerislands.io" className="email-us-address">
              engage@peerislands.io
            </a>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="contact-form-section">
          <h1 className="contact-form-title">Submit an inquiry</h1>
          <p className="contact-form-subtitle">
            Complete the form below, and a member of our sales team will contact you as soon as possible.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="form-input"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={submitting || (isLoggedIn && !!firstName)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="form-input"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={submitting || (isLoggedIn && !!lastName)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userEmail" className="form-label">
                Business Email <span className="required-asterisk">*</span>
              </label>
              <input
                type="email"
                id="userEmail"
                className="form-input"
                placeholder="Enter your business email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={submitting || (isLoggedIn && !!userEmail)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="company" className="form-label">
                Company <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                id="company"
                className="form-input"
                placeholder="Enter your company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={submitting || (isLoggedIn && !!company)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country" className="form-label">
                  Country <span className="required-asterisk">*</span>
                </label>
                <select
                  id="country"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={submitting || (isLoggedIn && !!country)}
                  required
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
                <label htmlFor="businessPhone" className="form-label">
                  Business Phone <span className="required-asterisk">*</span>
                </label>
                <PhoneInput
                  international
                  defaultCountry={getCountryCode(country)}
                  value={businessPhone}
                  onChange={(value) => setBusinessPhone(value || '')}
                  placeholder="Enter phone number"
                  disabled={submitting || (isLoggedIn && !!businessPhone)}
                  className="phone-input-wrapper"
                  numberInputProps={{
                    className: 'form-input phone-input-field',
                    required: true,
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jobFunction" className="form-label">
                Job Function <span className="required-asterisk">*</span>
              </label>
              <select
                id="jobFunction"
                className="form-input"
                value={jobFunction}
                onChange={(e) => setJobFunction(e.target.value)}
                disabled={submitting || (isLoggedIn && !!jobFunction)}
                required
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

            <div className="form-group">
              <label htmlFor="inquiry" className="form-label">
                Tell us more about how we can help <span className="required-asterisk">*</span>
              </label>
              <textarea
                id="inquiry"
                className="form-textarea"
                placeholder="Describe your inquiry..."
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                disabled={submitting}
                required
                rows={6}
              />
              <div className="form-hint-container">
                <span className="form-hint">Markdown supported</span>
                {inquiry.length > 0 && inquiry.length < 10 && (
                  <span className="form-validation-message">
                    Minimum 10 characters required ({inquiry.length}/10)
                  </span>
                )}
                {inquiry.length >= 10 && (
                  <span className="form-validation-success">
                    ✓ {inquiry.length} characters
                  </span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="contact-submit-button"
              disabled={submitting || inquiry.length < 10}
            >
              {submitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

