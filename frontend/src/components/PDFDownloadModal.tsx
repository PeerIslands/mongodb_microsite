import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { pdfDownloadService } from '@/api/services/pdf-download.service';
import PhoneInput, { isValidPhoneNumber, Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/components/SignupModal.css';

interface PDFDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceType: 'accelerator' | 'case_study';
  resourceId: string;
  resourceTitle: string;
}

// Helper to convert country name to ISO country code for PhoneInput
const getCountryCode = (countryName: string): Country => {
  const countryMap: { [key: string]: Country } = {
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

const PDFDownloadModal = ({
  isOpen,
  onClose,
  onSuccess,
  resourceType,
  resourceId,
  resourceTitle,
}: PDFDownloadModalProps) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setCompany('');
      setJobFunction('');
      setBusinessPhone('');
      setCountry('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || 
        !company.trim() || !jobFunction.trim() || !businessPhone || !country.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Validate phone number format
    if (!isValidPhoneNumber(businessPhone)) {
      showToast('Please enter a valid phone number.', 'error');
      return;
    }

    setLoading(true);

    try {
      await pdfDownloadService.submitDownloadForm({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        company: company.trim(),
        job_function: jobFunction.trim(),
        country: country.trim(),
        business_phone: businessPhone,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_title: resourceTitle,
      });

      showToast('Thank you! Your download will begin shortly.', 'success');
      
      // Close modal and trigger download
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to submit download form:', error);
      showToast('Failed to process your request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="signup-modal-content">
        <button className="modal-close" onClick={onClose} type="button">
          ×
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">View PDF</h2>
          <p className="modal-subtitle">
            Please provide your details to view <strong>{resourceTitle}</strong>
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pdf-firstName" className="form-label">
                First Name <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                id="pdf-firstName"
                className="form-input"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pdf-lastName" className="form-label">
                Last Name <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                id="pdf-lastName"
                className="form-input"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pdf-email" className="form-label">
              Business Email <span className="required-asterisk">*</span>
            </label>
            <input
              type="email"
              id="pdf-email"
              className="form-input"
              placeholder="Enter your business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pdf-company" className="form-label">
              Company <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="pdf-company"
              className="form-input"
              placeholder="Enter your company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pdf-jobFunction" className="form-label">
              Job Function
            </label>
            <select
              id="pdf-jobFunction"
              className="form-input"
              value={jobFunction}
              onChange={(e) => setJobFunction(e.target.value)}
              disabled={loading}
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
            <label htmlFor="pdf-country" className="form-label">
              Country
            </label>
            <select
              id="pdf-country"
              className="form-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
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
            <label htmlFor="pdf-businessPhone" className="form-label">
              Business Phone
            </label>
            <PhoneInput
              international
              defaultCountry={getCountryCode(country)}
              value={businessPhone}
              onChange={(value) => setBusinessPhone(value || '')}
              placeholder="Enter phone number"
              disabled={loading}
              className="phone-input-wrapper"
              numberInputProps={{
                className: 'form-input phone-input-field',
              }}
            />
          </div>

          <button
            type="submit"
            className="signup-submit-button"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Processing...' : 'View PDF'}
          </button>
        </form>

        <div className="modal-footer">
          <p className="login-prompt" style={{ fontSize: '12px', color: '#666' }}>
            Your information will be used in accordance with our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFDownloadModal;
