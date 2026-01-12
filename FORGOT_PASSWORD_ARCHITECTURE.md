# Forgot Password Feature - Architecture Document

## 1. Overview

This document outlines the complete architecture for implementing a secure Forgot Password feature in the MongoDB Microsite application. The feature allows users to reset their passwords securely via email verification.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORGOT PASSWORD FLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│   Database   │
│   (React)    │◀─────│  (FastAPI)   │◀─────│  (MongoDB)   │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             │
                             ▼
                      ┌──────────────┐
                      │    Email     │
                      │   Service    │
                      │  (SMTP/SES)  │
                      └──────────────┘
```

### 2.1 Components

1. **Frontend (React + TypeScript)**
   - Forgot Password Modal/Page
   - Reset Password Modal/Page
   - Password strength validator
   - Toast notifications

2. **Backend (FastAPI + Python)**
   - Password reset token generation
   - Email service integration
   - Token validation
   - Password update logic

3. **Database (MongoDB)**
   - New collection: `password_reset_tokens`
   - Updated collection: `Login_creds`

4. **Email Service**
   - SMTP server or AWS SES integration
   - HTML email templates
   - Rate limiting for email sends

---

## 3. User Flow Diagrams

### 3.1 Request Password Reset Flow

```
User                Frontend              Backend              Email Service       Database
│                   │                     │                    │                   │
│ Click "Forgot    │                     │                    │                   │
│ Password"        │                     │                    │                   │
├─────────────────▶│                     │                    │                   │
│                  │                     │                    │                   │
│ Enter Email      │                     │                    │                   │
├─────────────────▶│                     │                    │                   │
│                  │ POST                │                    │                   │
│                  │ /forgot-password    │                    │                   │
│                  ├────────────────────▶│                    │                   │
│                  │                     │ Verify email       │                   │
│                  │                     │ exists             │                   │
│                  │                     ├───────────────────────────────────────▶│
│                  │                     │◀───────────────────────────────────────┤
│                  │                     │ User found         │                   │
│                  │                     │                    │                   │
│                  │                     │ Generate secure    │                   │
│                  │                     │ token (UUID)       │                   │
│                  │                     │                    │                   │
│                  │                     │ Store token with   │                   │
│                  │                     │ expiry (1 hour)    │                   │
│                  │                     ├───────────────────────────────────────▶│
│                  │                     │◀───────────────────────────────────────┤
│                  │                     │                    │                   │
│                  │                     │ Send reset email   │                   │
│                  │                     ├───────────────────▶│                   │
│                  │                     │                    │ Email sent        │
│                  │◀────────────────────┤                    │                   │
│                  │ Success message     │                    │                   │
│◀─────────────────┤                     │                    │                   │
│ "Check your      │                     │                    │                   │
│  email"          │                     │                    │                   │
```

### 3.2 Reset Password Flow

```
User                Frontend              Backend              Database
│                   │                     │                    │
│ Click email       │                     │                    │
│ reset link        │                     │                    │
├─────────────────▶ │                     │                    │
│                   │ GET /reset-password │                    │
│                   │ ?token=xyz          │                    │
│                   ├────────────────────▶│                    │
│                   │                     │ Validate token     │
│                   │                     ├───────────────────▶│
│                   │                     │◀───────────────────┤
│                   │                     │ Token valid?       │
│                   │◀────────────────────┤                    │
│ Show reset form   │ Valid/Invalid       │                    │
│ OR error          │                     │                    │
│                   │                     │                    │
│ Enter new         │                     │                    │
│ password          │                     │                    │
├─────────────────▶ │                     │                    │
│                   │ POST /reset-password│                    │
│                   │ token + new_password│                    │
│                   ├────────────────────▶│                    │
│                   │                     │ Validate token     │
│                   │                     │ (not expired)      │
│                   │                     ├───────────────────▶│
│                   │                     │◀───────────────────┤
│                   │                     │                    │
│                   │                     │ Hash new password  │
│                   │                     │ (bcrypt)           │
│                   │                     │                    │
│                   │                     │ Update password    │
│                   │                     ├───────────────────▶│
│                   │                     │◀───────────────────┤
│                   │                     │                    │
│                   │                     │ Invalidate token   │
│                   │                     ├───────────────────▶│
│                   │                     │◀───────────────────┤
│                   │◀────────────────────┤                    │
│                   │ Success             │                    │
│◀─────────────────┤                     │                    │
│ "Password reset   │                     │                    │
│  successful"      │                     │                    │
```

---

## 4. Database Schema Design

### 4.1 New Collection: `password_reset_tokens`

```javascript
{
  _id: UUID,                    // Primary key
  user_id: UUID,                // Reference to User._id
  user_email: String,           // User's email (indexed)
  token: String,                // Secure random token (UUID, indexed, unique)
  created_at: ISODate,          // When token was created
  expires_at: ISODate,          // Expiration time (created_at + 1 hour)
  is_used: Boolean,             // Whether token has been used
  used_at: ISODate,             // When token was used (optional)
  ip_address: String,           // IP that requested reset (optional)
  user_agent: String            // Browser/device info (optional)
}
```

**Indexes:**
- `token` (unique, for quick lookup)
- `user_email` (for rate limiting checks)
- `expires_at` (for cleanup of expired tokens)
- `user_id` (for user history)

### 4.2 Updated Collection: `Login_creds`

Existing schema remains the same. Password updates will modify the `user_password` field.

```javascript
{
  _id: UUID,                    // Same as User._id
  user_email: String,
  user_password: String,        // Bcrypt hashed - UPDATED during reset
  created_at: ISODate,
  updated_at: ISODate           // NEW: Track last password change
}
```

---

## 5. API Endpoints Design

### 5.1 Request Password Reset

**Endpoint:** `POST /api/v1/forgot-password`

**Request Body:**
```json
{
  "user_email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive password reset instructions."
}
```

**Response (Rate Limit - 429):**
```json
{
  "detail": "Too many password reset requests. Please try again in 15 minutes."
}
```

**Business Logic:**
- Always return same success message (don't reveal if email exists)
- Rate limit: 3 requests per email per 15 minutes
- Token expires in 1 hour
- Generate secure random token (UUID v4)
- Send email asynchronously

---

### 5.2 Validate Reset Token

**Endpoint:** `GET /api/v1/reset-password/validate?token={token}`

**Query Parameters:**
- `token`: The reset token from email link

**Response (Valid - 200):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

**Response (Invalid - 400):**
```json
{
  "valid": false,
  "detail": "Invalid or expired reset token"
}
```

**Business Logic:**
- Check token exists in database
- Verify token not expired (< 1 hour old)
- Verify token not already used
- Don't reveal user information

---

### 5.3 Reset Password

**Endpoint:** `POST /api/v1/reset-password`

**Request Body:**
```json
{
  "token": "uuid-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Invalid Token - 400):**
```json
{
  "detail": "Invalid or expired reset token"
}
```

**Response (Validation Error - 422):**
```json
{
  "detail": "Password must be at least 6 characters long"
}
```

**Business Logic:**
- Validate token (exists, not expired, not used)
- Validate password strength (min 6 chars, matching current requirements)
- Hash password using bcrypt (same rounds as signup: 12)
- Update password in `Login_creds`
- Mark token as used
- Invalidate all other active tokens for this user (security)
- Update `updated_at` timestamp

---

## 6. Email Service Architecture

### 6.1 Email Service Provider Options

**Option 1: SMTP (Simple Mail Transfer Protocol)**
- Use services like SendGrid, Mailgun, or company SMTP
- Configuration via environment variables
- Libraries: `aiosmtplib` for async sending

**Option 2: AWS SES (Simple Email Service)**
- Already using Azure Blob Storage, so SES adds another provider
- Good option if AWS infrastructure exists
- Libraries: `boto3` for Python

**Option 3: SendGrid API**
- RESTful API integration
- Good deliverability rates
- Easy template management

**Recommended:** SendGrid or similar SMTP service for simplicity

### 6.2 Email Template Structure

```
┌────────────────────────────────────────┐
│   MongoDB Microsite Logo               │
├────────────────────────────────────────┤
│                                        │
│   Password Reset Request               │
│                                        │
│   Hi [First Name],                     │
│                                        │
│   You requested to reset your password.│
│   Click the button below to proceed:   │
│                                        │
│   ┌──────────────────────┐            │
│   │  Reset My Password   │            │
│   └──────────────────────┘            │
│                                        │
│   This link expires in 1 hour.        │
│                                        │
│   If you didn't request this,         │
│   please ignore this email.           │
│                                        │
│   Reset Link (if button doesn't work):│
│   https://domain.com/reset?token=xyz  │
│                                        │
├────────────────────────────────────────┤
│   © 2026 MongoDB Microsite             │
└────────────────────────────────────────┘
```

### 6.3 Email Configuration

**Environment Variables Needed:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=MongoDB Microsite
FRONTEND_URL=https://yourdomain.com
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=60
```

---

## 7. Security Considerations

### 7.1 Token Security

✅ **Do:**
- Use cryptographically secure random tokens (UUID v4 or secrets.token_urlsafe)
- Store tokens hashed in database (optional extra security)
- Make tokens single-use
- Expire tokens after 1 hour
- Invalidate all tokens after successful reset
- Log all password reset attempts

❌ **Don't:**
- Use predictable token patterns
- Include user information in token
- Allow unlimited token requests
- Reuse tokens

### 7.2 Rate Limiting

**Per Email:**
- Maximum 3 requests per 15 minutes
- Prevents email bombing

**Per IP Address:**
- Maximum 10 requests per hour
- Prevents brute force enumeration

### 7.3 Information Disclosure Prevention

- Always return same success message (don't reveal if email exists)
- Don't expose user details in token validation
- Generic error messages for invalid/expired tokens
- Log suspicious patterns (many failed attempts)

### 7.4 Additional Security Measures

1. **Email Verification:**
   - Only send reset links to verified email addresses
   - Consider requiring current password for email changes

2. **Password Requirements:**
   - Maintain minimum 6 characters (current requirement)
   - Optional: Add complexity requirements (uppercase, numbers, special chars)
   - Prevent common passwords

3. **Session Invalidation:**
   - Optional: Invalidate all active sessions after password reset
   - Force re-login on all devices

4. **Audit Logging:**
   - Log all password reset requests
   - Log successful and failed reset attempts
   - Include IP, user agent, timestamp

---

## 8. Frontend Components Architecture

### 8.1 Component Structure

```
src/
├── components/
│   ├── LoginModal.tsx              (EXISTING - update with forgot link)
│   ├── ForgotPasswordModal.tsx     (NEW)
│   └── ResetPasswordPage.tsx       (NEW)
│
├── pages/
│   └── ResetPassword.tsx           (NEW - route handler)
│
├── api/
│   └── services/
│       └── passwordReset.ts        (NEW - API calls)
│
├── types/
│   └── passwordReset.ts            (NEW - TypeScript interfaces)
│
└── styles/
    └── components/
        ├── ForgotPasswordModal.css (NEW)
        └── ResetPasswordPage.css   (NEW)
```

### 8.2 User Interface Flow

**Step 1: Login Modal Update**
- Update existing "Forgot password?" link to open modal
- Current location: Line 131 in `LoginModal.tsx`

**Step 2: Forgot Password Modal**
- Single email input field
- Clear call-to-action button
- Link back to login
- Success state with instructions

**Step 3: Email Sent Confirmation**
- Show success message
- Display email address (partially masked)
- "Didn't receive email?" resend option
- Return to login link

**Step 4: Reset Password Page**
- Accessible via email link with token
- New password input
- Confirm password input
- Password strength indicator
- Submit button
- Success/error states

### 8.3 Frontend State Management

**States to Track:**
- `isLoading`: API call in progress
- `emailSent`: Confirmation state
- `tokenValid`: Token validation result
- `resetSuccess`: Password reset completed
- `error`: Error messages from API
- `passwordStrength`: Visual feedback for password

---

## 9. Backend Service Architecture

### 9.1 Service Layer Structure

```
backend/app/api/v1/
├── services/
│   ├── auth_service.py              (EXISTING)
│   ├── user_service.py              (EXISTING)
│   ├── password_reset_service.py    (NEW)
│   └── email_service.py             (NEW)
│
├── repositories/
│   ├── user_repository.py           (EXISTING - update)
│   └── password_reset_repository.py (NEW)
│
├── models/
│   ├── user.py                      (EXISTING - update)
│   └── password_reset.py            (NEW)
│
├── endpoints/
│   ├── auth.py                      (EXISTING)
│   └── password_reset.py            (NEW)
│
└── exceptions/
    └── password_reset_exceptions.py (NEW)
```

### 9.2 Service Responsibilities

**PasswordResetService:**
- Generate secure tokens
- Validate token freshness
- Coordinate with email service
- Rate limit enforcement
- Token lifecycle management

**EmailService:**
- SMTP connection management
- Email template rendering
- Async email sending
- Retry logic for failed sends
- Email validation

**PasswordResetRepository:**
- CRUD operations for reset tokens
- Token lookup and validation
- Expired token cleanup
- User token history

---

## 10. Data Models (Pydantic)

### 10.1 Request Models

```python
class ForgotPasswordRequest:
    - user_email: EmailStr (required, valid email)

class ResetPasswordRequest:
    - token: str (required, UUID format)
    - new_password: str (required, min 6 chars)

class ValidateTokenRequest:
    - token: str (required, query parameter)
```

### 10.2 Response Models

```python
class ForgotPasswordResponse:
    - success: bool
    - message: str

class ValidateTokenResponse:
    - valid: bool
    - message: str (optional)

class ResetPasswordResponse:
    - success: bool
    - message: str
```

### 10.3 Database Models

```python
class PasswordResetTokenModel:
    - _id: str (UUID)
    - user_id: str (UUID)
    - user_email: str
    - token: str (UUID, hashed optional)
    - created_at: datetime
    - expires_at: datetime
    - is_used: bool (default False)
    - used_at: datetime (optional)
    - ip_address: str (optional)
    - user_agent: str (optional)
```

---

## 11. Error Handling Strategy

### 11.1 Error Types

1. **User Not Found**
   - Don't reveal to user
   - Return generic success message
   - Log for monitoring

2. **Invalid Token**
   - Generic error: "Invalid or expired reset token"
   - Don't specify which (expired vs invalid)

3. **Token Already Used**
   - Same error as invalid token
   - Suggest requesting new reset

4. **Rate Limit Exceeded**
   - Clear message with time to wait
   - HTTP 429 status code

5. **Email Send Failure**
   - Log error on backend
   - Return success to user (don't reveal failure)
   - Alert admin if persistent

6. **Password Validation Failure**
   - Specific error about requirements
   - HTTP 422 status code

### 11.2 Exception Classes

```python
class PasswordResetError(Exception)
class InvalidTokenError(PasswordResetError)
class ExpiredTokenError(PasswordResetError)
class RateLimitExceededError(PasswordResetError)
class EmailSendError(PasswordResetError)
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Backend:**
- Token generation uniqueness
- Token expiration logic
- Password hashing
- Email template rendering
- Rate limit calculations

**Frontend:**
- Form validation
- Password strength calculation
- Success/error state handling

### 12.2 Integration Tests

- Complete forgot password flow
- Token validation and reset
- Rate limiting enforcement
- Email sending (with mock SMTP)
- Database operations

### 12.3 End-to-End Tests

- User requests reset → receives email → resets password → logs in
- Invalid token handling
- Expired token handling
- Rate limit behavior

### 12.4 Security Tests

- Token brute force attempts
- SQL injection in email field
- XSS in error messages
- CSRF protection
- Rate limit bypass attempts

---

## 13. Monitoring and Logging

### 13.1 Metrics to Track

- Password reset requests per day
- Successful password resets
- Failed reset attempts
- Email send failures
- Rate limit triggers
- Average time from request to reset
- Token expiration rate (unused tokens)

### 13.2 Logging Events

```python
# Log Levels and Events

INFO:
- Password reset requested: {email}
- Reset email sent: {email}
- Token validated successfully: {token_id}
- Password reset successful: {user_id}

WARNING:
- Rate limit exceeded: {email/ip}
- Invalid token used: {token}
- Expired token used: {token}

ERROR:
- Email send failed: {email, error}
- Database error: {operation, error}
- SMTP connection failed
```

### 13.3 Alerts

Set up alerts for:
- High rate of email send failures (> 5% failure rate)
- Unusual spike in reset requests
- Multiple failed token validations from same IP
- SMTP service downtime

---

## 14. Deployment Considerations

### 14.1 Environment Configuration

**Development:**
- Use MailHog or Mailtrap for email testing
- Shorter token expiry (15 minutes) for testing
- Detailed logging enabled

**Staging:**
- Real SMTP but test domain
- Production-like rate limits
- Full logging

**Production:**
- Production SMTP service
- Rate limits enforced
- Error-level logging only
- Monitoring enabled

### 14.2 Configuration Updates

**Backend (.env):**
```
# Add to existing .env file
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=MongoDB Microsite
FRONTEND_URL=https://yourdomain.com
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=60
PASSWORD_RESET_RATE_LIMIT=3
PASSWORD_RESET_RATE_WINDOW_MINUTES=15
```

**Backend (config.py updates):**
- Add SMTP configuration fields
- Add password reset settings
- Add email template paths

### 14.3 Database Migration

1. Create `password_reset_tokens` collection
2. Add indexes:
   - `token` (unique)
   - `user_email`
   - `expires_at`
   - `user_id`
3. Add `updated_at` field to `Login_creds` collection
4. Create TTL index on `expires_at` for automatic cleanup

---

## 15. Maintenance and Cleanup

### 15.1 Automated Cleanup

**Expired Tokens:**
- MongoDB TTL index on `expires_at` field
- Automatically removes documents after expiration
- No manual cleanup needed

**Used Tokens:**
- Keep for audit trail (30 days)
- Scheduled job to archive/delete after 30 days

### 15.2 Monitoring Dashboard

Track:
- Active (unused, unexpired) tokens
- Token usage rate
- Average time to use token
- Abandoned reset attempts

---

## 16. Future Enhancements

### 16.1 Phase 2 Features

1. **Multi-factor Reset Verification**
   - SMS verification code
   - Security questions
   - Backup email verification

2. **Password Reset History**
   - Show user last 5 password changes
   - Alert on suspicious reset patterns
   - Block reset if too frequent

3. **Account Recovery Flow**
   - Alternative verification methods
   - Admin-assisted recovery
   - Identity verification

4. **Enhanced Email Templates**
   - Branded HTML templates
   - Multi-language support
   - Personalization

### 16.2 Security Enhancements

1. **Device Fingerprinting**
   - Track reset device
   - Alert on unusual devices
   - Block suspicious patterns

2. **Geolocation Checks**
   - Alert on reset from unusual location
   - Additional verification for foreign IPs

3. **Compromised Password Detection**
   - Check against known breached passwords
   - Integration with HaveIBeenPwned API

---

## 17. Success Metrics

### 17.1 Key Performance Indicators (KPIs)

- **Reset Completion Rate:** % of requested resets that complete
  - Target: > 70%

- **Email Delivery Rate:** % of emails successfully delivered
  - Target: > 98%

- **Average Reset Time:** Time from request to successful reset
  - Target: < 10 minutes

- **False Positive Rate:** Invalid email submissions
  - Target: < 5%

- **User Satisfaction:** Support tickets related to password reset
  - Target: < 1% of total resets

---

## 18. Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- Database schema and collections
- Password reset repository
- Email service integration
- API endpoints
- Basic testing

### Phase 2: Frontend Implementation (Week 2)
- Forgot password modal
- Reset password page
- Form validations
- API integration
- Error handling

### Phase 3: Testing & Security (Week 3)
- Unit tests
- Integration tests
- Security audit
- Rate limit testing
- Email template testing

### Phase 4: Deployment & Monitoring (Week 4)
- Staging deployment
- Production deployment
- Monitoring setup
- Documentation
- User communication

---

## 19. Risk Assessment

### 19.1 Potential Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Email delivery failures | High | Medium | Use reliable SMTP service, implement retry logic |
| Token brute force | High | Low | Rate limiting, secure random tokens |
| User enumeration | Medium | Medium | Generic error messages, rate limiting |
| SMTP credentials leak | High | Low | Secure environment variables, rotate keys |
| Database performance | Medium | Low | Proper indexing, token cleanup |

### 19.2 Rollback Plan

If issues arise:
1. Disable forgot password endpoints
2. Revert database changes
3. Remove frontend components
4. Investigate and fix issues
5. Redeploy with fixes

---

## 20. Documentation Requirements

### 20.1 Technical Documentation

- API endpoint documentation (OpenAPI/Swagger)
- Database schema documentation
- Email template documentation
- Configuration guide
- Deployment guide

### 20.2 User Documentation

- Help article: "How to reset your password"
- FAQ section
- Troubleshooting guide
- Security best practices

### 20.3 Admin Documentation

- Monitoring dashboard guide
- Alert response procedures
- SMTP configuration
- Rate limit adjustment guide

---

## 21. Alternative Password Reset Methods (Without Email/SMTP)

> **Note:** Sections 1-20 cover traditional email/SMTP-based password reset. This section (21) provides 11 alternative methods that don't require email infrastructure.

### Quick Selection Guide

**🚀 Fastest to Implement:**
1. Social OAuth Recovery (1-2 days)
2. Admin-Assisted Reset (1 day)
3. Security Questions (2 days)

**💰 Most Cost-Effective:**
1. Social OAuth (Free)
2. TOTP/Authenticator (Free)
3. Backup Codes (Free)
4. WebAuthn (Free)

**🔒 Most Secure:**
1. WebAuthn/Passkeys (Phishing-resistant)
2. TOTP/Authenticator (2FA standard)
3. Admin-Assisted (Human verification)

**👥 Best User Experience:**
1. SMS/OTP (Familiar, fast)
2. Push Notifications (Seamless)
3. Social OAuth (One-click)

**📱 Mobile-First:**
1. SMS/OTP
2. Push Notifications
3. QR Code Scanning
4. WhatsApp/Telegram

**🏢 Best for Enterprise:**
1. TOTP/Authenticator
2. WebAuthn
3. Admin-Assisted

---

### 21.1 SMS-Based Password Reset

**Overview:**
Send password reset code via SMS to user's registered phone number.

**Architecture:**

```
User → Frontend → Backend → SMS Gateway (Twilio/SNS) → User's Phone
                     ↓
                  Database
```

**Flow:**
1. User enters email/phone number
2. System looks up user and phone number
3. Generate 6-digit OTP (One-Time Password)
4. Send OTP via SMS service
5. User enters OTP on reset page
6. Validate OTP and allow password reset

**Pros:**
✅ Fast delivery (seconds)
✅ High open rate (~98%)
✅ No email infrastructure needed
✅ Works globally
✅ User-friendly

**Cons:**
❌ Requires phone number collection
❌ SMS costs ($0.01-0.05 per message)
❌ Potential SMS delivery issues
❌ SIM swap attacks possible
❌ Not everyone has phone

**Services:**
- **Twilio:** Most popular, good documentation
- **AWS SNS:** If already using AWS
- **Vonage (Nexmo):** Good international coverage
- **MessageBird:** European focus
- **Plivo:** Cost-effective

**Database Schema:**
```javascript
{
  _id: UUID,
  user_id: UUID,
  phone_number: String,
  otp_code: String,        // 6-digit code
  created_at: ISODate,
  expires_at: ISODate,     // 10 minutes
  attempts: Number,        // Max 3 attempts
  is_verified: Boolean
}
```

**Implementation Notes:**
- OTP expires in 10 minutes
- Maximum 3 verification attempts
- Rate limit: 3 SMS per phone per hour
- Store hashed OTP in database
- Log all attempts

---

### 21.2 Security Questions

**Overview:**
User answers pre-configured security questions to verify identity.

**Architecture:**

```
User → Frontend → Backend → Database
                    ↓
              Verify Answers
                    ↓
            Allow Password Reset
```

**Flow:**
1. User enters email
2. System shows 2-3 security questions
3. User answers questions
4. Backend verifies answers
5. If correct, allow password reset

**Pros:**
✅ No external service needed
✅ No additional costs
✅ Works offline
✅ Simple to implement
✅ Familiar to users

**Cons:**
❌ Answers often guessable (pet names, birthdays)
❌ Users forget answers
❌ Social engineering risk
❌ Poor security reputation
❌ Frustrating user experience

**Database Schema:**
```javascript
// Add to User collection
{
  security_questions: [
    {
      question_id: String,
      question: String,
      answer_hash: String  // bcrypt hashed
    }
  ]
}
```

**Sample Questions:**
1. What city were you born in?
2. What was your first pet's name?
3. What is your mother's maiden name?
4. What was the name of your first school?
5. What is your favorite book?

**Best Practices:**
- Require setup during registration
- Hash answers like passwords
- Allow 3 attempts only
- Case-insensitive matching
- Rate limit attempts

**Recommendation:** ⚠️ Not recommended as sole method due to security concerns. Use as secondary verification only.

---

### 21.3 Admin-Assisted Password Reset

**Overview:**
User contacts admin/support who manually resets password after verification.

**Architecture:**

```
User → Support Ticket → Admin Dashboard → Manual Verification → Password Reset
```

**Flow:**
1. User submits support ticket
2. Admin verifies identity (ID, company email, etc.)
3. Admin generates temporary password or reset link
4. Admin sends credentials via secure channel
5. User logs in and must change password

**Pros:**
✅ High security (human verification)
✅ No technical infrastructure needed
✅ Handles edge cases well
✅ Can verify via multiple methods
✅ Works for compromised accounts

**Cons:**
❌ Slow (hours to days)
❌ Requires support staff
❌ Not scalable
❌ Poor user experience
❌ Business hours only

**Admin Dashboard Features:**
```
┌─────────────────────────────────────────┐
│  Password Reset Requests                │
├─────────────────────────────────────────┤
│  User: john@example.com                 │
│  Requested: 2026-01-12 10:30 AM         │
│  Status: Pending                        │
│                                         │
│  Verification Steps:                    │
│  □ Verify email ownership               │
│  □ Check last login date                │
│  □ Verify account details               │
│                                         │
│  Actions:                               │
│  [Generate Temp Password]               │
│  [Send Reset Link]                      │
│  [Deny Request]                         │
└─────────────────────────────────────────┘
```

**Use Cases:**
- Enterprise/internal applications
- High-security environments
- Small user base (<1000 users)
- B2B applications
- Government systems

---

### 21.4 Push Notifications (Mobile App)

**Overview:**
Send password reset notification to user's mobile app.

**Architecture:**

```
User (Web) → Backend → Firebase Cloud Messaging → User's Phone App
                ↓                                        ↓
            Database ← ← ← ← ← ← ← ← User Approves
```

**Flow:**
1. User requests password reset on web
2. System sends push notification to mobile app
3. User opens app and sees reset request
4. User approves reset in mobile app
5. Mobile app sends confirmation to backend
6. Web interface allows password change

**Pros:**
✅ Very secure (device verification)
✅ Great user experience
✅ Real-time notifications
✅ No SMS costs
✅ Can show device/location info

**Cons:**
❌ Requires mobile app
❌ User must have phone nearby
❌ Complex infrastructure
❌ Doesn't work if phone lost
❌ Development effort

**Services:**
- **Firebase Cloud Messaging (FCM):** Free, cross-platform
- **Apple Push Notification (APN):** iOS only
- **OneSignal:** Unified platform
- **Pusher Beams:** Developer-friendly

**Implementation:**
```javascript
// Notification payload
{
  type: "password_reset_request",
  title: "Password Reset Request",
  body: "Approve reset from Chrome on Windows?",
  data: {
    request_id: "uuid",
    device: "Chrome Browser",
    location: "New York, US",
    ip: "192.168.1.1",
    timestamp: "2026-01-12T10:30:00Z"
  },
  actions: ["Approve", "Deny"]
}
```

---

### 21.5 Time-Based One-Time Password (TOTP)

**Overview:**
Use authenticator app (Google Authenticator, Authy) for password reset.

**Architecture:**

```
User → Frontend → Backend → Verify TOTP → Allow Reset
                     ↓
                  Database
```

**Flow:**
1. User enters email
2. System prompts for TOTP code
3. User opens authenticator app
4. User enters 6-digit TOTP code
5. Backend verifies code
6. Allow password reset

**Pros:**
✅ Very secure
✅ No external service needed
✅ Works offline
✅ No costs
✅ Industry standard

**Cons:**
❌ Requires prior setup
❌ User must have authenticator app
❌ Complex for non-technical users
❌ Lost phone = locked out

**Setup Required:**
- User must set up TOTP during registration
- Store TOTP secret in database
- Provide QR code for scanning

**Libraries:**
- **pyotp** (Python)
- **speakeasy** (Node.js)
- **google-authenticator** compatible

**Database Schema:**
```javascript
// Add to User collection
{
  totp_secret: String,      // Encrypted
  totp_enabled: Boolean,
  totp_backup_codes: [String]  // For recovery
}
```

**Implementation Notes:**
- 30-second time window
- Allow ±1 time step for clock skew
- Rate limit: 5 attempts per 15 minutes
- Provide backup codes during setup

---

### 21.6 Backup Codes

**Overview:**
Pre-generated one-time use codes given during registration.

**Architecture:**

```
User → Frontend → Backend → Validate Code → Allow Reset
                     ↓
                  Database
```

**Flow:**
1. During registration, generate 10 backup codes
2. User saves codes securely
3. For password reset, user enters backup code
4. System validates and marks code as used
5. Allow password reset

**Pros:**
✅ Simple and reliable
✅ Works without phone/email
✅ No external dependencies
✅ No costs
✅ Perfect backup method

**Cons:**
❌ Users lose/forget codes
❌ Need secure storage
❌ Limited number of uses
❌ Can be stolen if not stored securely

**Code Format:**
```
xxxx-xxxx-xxxx-xxxx (16 characters)

Example:
a3f7-9k2m-p5w8-q1n4
b8j2-c6v9-d4t7-e1r5
...
(10 codes total)
```

**Database Schema:**
```javascript
{
  user_id: UUID,
  backup_codes: [
    {
      code_hash: String,    // bcrypt hashed
      is_used: Boolean,
      used_at: ISODate
    }
  ],
  created_at: ISODate
}
```

**Best Practices:**
- Generate during registration
- Allow user to download/print
- Hash codes in database
- Show warning when only 2 codes left
- Allow regeneration (invalidates old codes)

---

### 21.7 Social Authentication Recovery

**Overview:**
Use existing social login (Google, Microsoft, GitHub) to recover account.

**Architecture:**

```
User → Frontend → OAuth Provider → Backend → Link Accounts → Reset Password
```

**Flow:**
1. User clicks "Reset via Google/Microsoft"
2. User authenticates with social provider
3. Backend matches email from social account
4. If match found, allow password reset
5. User can set new password

**Pros:**
✅ Leverages existing authentication
✅ No additional infrastructure
✅ Secure (OAuth 2.0)
✅ Good user experience
✅ No costs

**Cons:**
❌ Requires social account setup
❌ Privacy concerns (some users avoid social login)
❌ Dependency on external providers
❌ Email must match exactly

**Providers:**
- **Google OAuth 2.0**
- **Microsoft Azure AD**
- **GitHub OAuth**
- **LinkedIn OAuth**
- **Apple Sign In**

**Implementation:**
```javascript
// OAuth flow for password reset
1. User clicks "Reset with Google"
2. Redirect to Google OAuth
3. User authenticates
4. Google returns email
5. Backend verifies email matches user account
6. Generate password reset token
7. Allow password change
```

**Security Considerations:**
- Verify email is verified by provider
- Check account link status
- Log OAuth recovery attempts
- Rate limit OAuth attempts

---

### 21.8 QR Code Scanning

**Overview:**
Generate QR code that user scans with mobile app to reset password.

**Architecture:**

```
User (Web) → Backend generates QR → User scans with App → App confirms → Allow Reset
```

**Flow:**
1. User requests password reset on web
2. System generates unique QR code
3. User scans QR with mobile app
4. App authenticates and confirms identity
5. Backend receives confirmation
6. Web interface allows password reset

**Pros:**
✅ Innovative user experience
✅ Very secure (requires device)
✅ Fast (seconds)
✅ No typing required
✅ Works without email

**Cons:**
❌ Requires mobile app
❌ User must have phone nearby
❌ Complex implementation
❌ Not widely understood
❌ Accessibility issues

**QR Code Content:**
```json
{
  "type": "password_reset",
  "request_id": "uuid-here",
  "timestamp": 1673520000,
  "expires": 300  // 5 minutes
}
```

**Implementation:**
- QR code expires in 5 minutes
- Generate using libraries (qrcode, python-qrcode)
- WebSocket connection for real-time confirmation
- Fallback to manual code entry

---

### 21.9 WebAuthn / Passkeys

**Overview:**
Use hardware security keys or platform authenticators (Face ID, Touch ID) for password reset.

**Architecture:**

```
User → Frontend → WebAuthn API → Authenticator → Backend → Verify → Allow Reset
```

**Flow:**
1. User requests password reset
2. System requests WebAuthn authentication
3. User uses fingerprint/face/security key
4. Browser/device authenticates
5. Backend verifies signature
6. Allow password reset

**Pros:**
✅ Extremely secure (phishing-resistant)
✅ Great user experience
✅ No passwords to remember
✅ Industry standard (FIDO2)
✅ Built into devices

**Cons:**
❌ Requires prior setup
❌ Not all browsers support it
❌ Complex implementation
❌ User learning curve
❌ Lost device = locked out

**Browser Support:**
- Chrome, Edge, Firefox, Safari (modern versions)
- Mobile: iOS 14+, Android 9+

**Use Cases:**
- Modern web applications
- High-security requirements
- Progressive web apps
- Enterprise applications

**Setup Required:**
- User must register authenticator during signup
- Store credential ID in database
- Provide backup recovery method

---

### 21.10 WhatsApp / Telegram Bot

**Overview:**
Send password reset link via messaging app bot.

**Architecture:**

```
User → Frontend → Backend → WhatsApp/Telegram Bot API → User's App
```

**Flow:**
1. User links WhatsApp/Telegram during registration
2. User requests password reset
3. System sends message via bot
4. User clicks link in chat
5. User resets password

**Pros:**
✅ High engagement (messaging apps)
✅ No SMS costs
✅ Rich media support
✅ Works internationally
✅ Better than email for some users

**Cons:**
❌ Requires bot setup
❌ User must have account linked
❌ API rate limits
❌ Not as universal as email
❌ Privacy concerns

**Services:**
- **WhatsApp Business API:** Official but complex
- **Telegram Bot API:** Free and easy
- **Discord Bot:** For gaming/tech communities
- **Slack App:** For workplace apps

**Telegram Example:**
```
Bot Message:
━━━━━━━━━━━━━━━━━━━━━━
🔐 Password Reset Request

Hi John! You requested to reset your 
password for MongoDB Microsite.

Click here to reset: 
🔗 https://domain.com/reset?token=xyz

This link expires in 1 hour.

Not you? Ignore this message.
━━━━━━━━━━━━━━━━━━━━━━
```

---

### 21.11 Temporary Access Link

**Overview:**
Generate time-limited access link that allows one-time login to change password.

**Architecture:**

```
User → Support → Admin generates link → Send via any channel → User accesses
```

**Flow:**
1. User contacts support (phone, chat, in-person)
2. Admin verifies identity
3. Admin generates temporary access link (1-hour expiry)
4. Admin shares link via any secure channel
5. User clicks link and is auto-logged in
6. User forced to change password immediately

**Pros:**
✅ Flexible (any communication channel)
✅ Good for emergencies
✅ No email infrastructure needed
✅ Works with any verification method
✅ Secure with proper verification

**Cons:**
❌ Requires manual intervention
❌ Not automated
❌ Slow process
❌ Requires trained support staff

**Database Schema:**
```javascript
{
  _id: UUID,
  user_id: UUID,
  access_token: String,     // Unique, secure token
  created_by: UUID,         // Admin who created it
  created_at: ISODate,
  expires_at: ISODate,      // 1 hour
  is_used: Boolean,
  used_at: ISODate,
  purpose: "password_reset"
}
```

---

## 21.12 Comparison Matrix

| Method | Security | Cost | Speed | UX | Complexity | Scalability |
|--------|----------|------|-------|----|-----------:|------------:|
| **Email (SMTP)** | ⭐⭐⭐ | Low | Medium | ⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐⭐ |
| **SMS/OTP** | ⭐⭐⭐⭐ | Medium | Fast | ⭐⭐⭐⭐⭐ | Low | ⭐⭐⭐⭐⭐ |
| **Security Questions** | ⭐⭐ | Free | Fast | ⭐⭐ | Low | ⭐⭐⭐⭐⭐ |
| **Admin Assisted** | ⭐⭐⭐⭐⭐ | High | Slow | ⭐⭐ | Low | ⭐ |
| **Push Notification** | ⭐⭐⭐⭐⭐ | Low | Fast | ⭐⭐⭐⭐⭐ | High | ⭐⭐⭐⭐ |
| **TOTP/Authenticator** | ⭐⭐⭐⭐⭐ | Free | Fast | ⭐⭐⭐ | Medium | ⭐⭐⭐⭐⭐ |
| **Backup Codes** | ⭐⭐⭐⭐ | Free | Fast | ⭐⭐⭐ | Low | ⭐⭐⭐⭐⭐ |
| **Social OAuth** | ⭐⭐⭐⭐ | Free | Fast | ⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐⭐ |
| **QR Code** | ⭐⭐⭐⭐ | Low | Fast | ⭐⭐⭐ | High | ⭐⭐⭐⭐ |
| **WebAuthn** | ⭐⭐⭐⭐⭐ | Free | Fast | ⭐⭐⭐⭐ | High | ⭐⭐⭐⭐⭐ |
| **WhatsApp/Telegram** | ⭐⭐⭐ | Low | Fast | ⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐ |
| **Temp Access Link** | ⭐⭐⭐⭐ | Medium | Slow | ⭐⭐⭐ | Low | ⭐⭐ |

---

### 21.12.1 Visual Decision Tree

```
                    Need Password Reset?
                            │
                            ▼
                 ┌──────────┴──────────┐
                 │                     │
          Have Email?            No Email?
                 │                     │
          ┌──────┴──────┐       ┌─────┴─────┐
          │             │       │           │
     Email/SMTP    Already    Phone?    Other Device?
          │         Using      │           │
          │        OAuth?      │           │
          ▼          │         ▼           ▼
    Traditional   Social   SMS/OTP   Push/QR/TOTP
     (Sec 1-20)    Auth               │
                    │                 │
                    └─────────┬───────┘
                              │
                              ▼
                    High Security Needed?
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   Yes                 No
                    │                   │
                    ▼                   ▼
         WebAuthn/TOTP/Admin    SMS/Social/Push
```

---

## 21.13 Recommended Combinations

### **For Consumer Applications:**
**Primary:** SMS/OTP  
**Backup:** Social OAuth (Google/Microsoft)  
**Reasoning:** Fast, familiar, high success rate

### **For Enterprise Applications:**
**Primary:** TOTP/Authenticator  
**Backup:** Admin-assisted reset  
**Reasoning:** High security, controlled process

### **For Modern Web Apps:**
**Primary:** Email (SMTP)  
**Secondary:** Push Notifications  
**Backup:** Backup Codes  
**Reasoning:** Layered security, multiple options

### **For High-Security Applications:**
**Primary:** WebAuthn/Passkeys  
**Secondary:** TOTP  
**Backup:** Admin-assisted reset  
**Reasoning:** Maximum security, hardware-backed

### **For Small/Internal Applications:**
**Primary:** Admin-assisted reset  
**Backup:** Security questions  
**Reasoning:** Simple, low tech requirements

---

### 21.13.1 Prerequisites by Method

| Method | User Must Have | System Needs | Prior Setup |
|--------|---------------|--------------|-------------|
| Email/SMTP | Email address | SMTP service | ❌ No |
| SMS/OTP | Phone number | SMS gateway (Twilio) | ❌ No |
| Security Questions | Memory of answers | Database | ✅ Yes |
| Admin Assisted | Support access | Admin panel | ❌ No |
| Push Notification | Mobile app installed | FCM/APN, Mobile app | ✅ Yes |
| TOTP | Authenticator app | TOTP library | ✅ Yes |
| Backup Codes | Saved codes | Database | ✅ Yes |
| Social OAuth | Google/MS account | OAuth integration | ❌ No |
| QR Code | Mobile app | Mobile app, QR library | ✅ Yes |
| WebAuthn | Biometric/Security key | WebAuthn support | ✅ Yes |
| WhatsApp/Telegram | Messaging app account | Bot API | ✅ Yes |
| Temp Access Link | Any communication | Admin panel | ❌ No |

---

## 21.14 Implementation Recommendation

Based on your current MongoDB Microsite architecture, here are the top 3 recommendations:

### **🥇 Option 1: SMS/OTP (Best Balance)**

**Why:**
- No email infrastructure needed
- Fast and reliable
- Excellent user experience
- Easy to implement

**Quick Start:**
1. Add phone number field to User model
2. Integrate Twilio API
3. Generate 6-digit OTP
4. Store hashed OTP with expiry
5. Validate and allow reset

**Estimated Time:** 2-3 days  
**Cost:** ~$0.01 per reset

---

### **🥈 Option 2: Social OAuth Recovery (Easiest)**

**Why:**
- Zero infrastructure needed
- Leverages existing authentication
- Free
- Secure

**Quick Start:**
1. Add OAuth provider (Google/Microsoft)
2. Match email from OAuth to user
3. Allow password reset if verified

**Estimated Time:** 1-2 days  
**Cost:** Free

---

### **🥉 Option 3: TOTP + Backup Codes (Most Secure)**

**Why:**
- No external dependencies
- No costs
- Extremely secure
- Works offline

**Quick Start:**
1. Add TOTP setup during registration
2. Generate 10 backup codes
3. Allow either TOTP or backup code for reset

**Estimated Time:** 3-4 days  
**Cost:** Free

---

## 21.15 Quick API Reference for Alternative Methods

### SMS/OTP Endpoints
```
POST   /api/v1/password-reset/send-otp
       Body: { "user_email": "user@example.com" }
       
POST   /api/v1/password-reset/verify-otp
       Body: { "user_email": "user@example.com", "otp": "123456", "new_password": "..." }
```

### Social OAuth Endpoints
```
GET    /api/v1/password-reset/oauth/google
       Redirects to Google OAuth
       
GET    /api/v1/password-reset/oauth/callback
       Receives OAuth response, generates reset token
```

### TOTP/Authenticator Endpoints
```
POST   /api/v1/password-reset/verify-totp
       Body: { "user_email": "user@example.com", "totp_code": "123456" }
       
POST   /api/v1/password-reset/verify-backup-code
       Body: { "user_email": "user@example.com", "backup_code": "xxxx-xxxx-xxxx-xxxx" }
```

### Push Notification Endpoints
```
POST   /api/v1/password-reset/send-push
       Body: { "user_email": "user@example.com" }
       
POST   /api/v1/password-reset/confirm-push
       Body: { "request_id": "uuid", "approved": true }
       
GET    /api/v1/password-reset/push-status/{request_id}
       Returns: { "status": "pending|approved|denied" }
```

### Admin-Assisted Endpoints
```
POST   /api/v1/admin/password-reset/request
       Body: { "user_email": "user@example.com", "reason": "..." }
       
POST   /api/v1/admin/password-reset/generate-link
       Body: { "user_id": "uuid", "admin_notes": "..." }
       Returns: { "reset_link": "https://..." }
```

### QR Code Endpoints
```
POST   /api/v1/password-reset/generate-qr
       Body: { "user_email": "user@example.com" }
       Returns: { "qr_code": "data:image/png;base64,...", "request_id": "uuid" }
       
POST   /api/v1/password-reset/confirm-qr
       Body: { "request_id": "uuid", "scanned_by_device": "device_id" }
```

### WebAuthn Endpoints
```
POST   /api/v1/password-reset/webauthn/challenge
       Body: { "user_email": "user@example.com" }
       Returns: { "challenge": "...", "options": {...} }
       
POST   /api/v1/password-reset/webauthn/verify
       Body: { "user_email": "...", "credential": {...}, "signature": "..." }
```

---

## 21.16 Integration Complexity Matrix

| Method | Backend Code | Frontend Code | External Service | Database Changes | Testing Effort |
|--------|-------------|---------------|------------------|------------------|----------------|
| Email/SMTP | Medium | Low | SMTP Provider | Low | Medium |
| SMS/OTP | Low | Low | Twilio/SNS | Low | Low |
| Security Questions | Low | Medium | None | Medium | Low |
| Admin Assisted | Low | Medium | None | Low | Low |
| Push Notification | High | High | FCM/APN | Medium | High |
| TOTP | Medium | Medium | None | Medium | Medium |
| Backup Codes | Low | Low | None | Low | Low |
| Social OAuth | Medium | Low | OAuth Provider | Low | Medium |
| QR Code | Medium | High | None | Low | Medium |
| WebAuthn | High | High | None | Medium | High |
| WhatsApp/Telegram | Medium | Low | Bot API | Low | Medium |
| Temp Access Link | Low | Low | None | Low | Low |

**Legend:**
- **Low:** < 4 hours development
- **Medium:** 4-16 hours development  
- **High:** > 16 hours development

---

## 22. Appendix

### A. Email Reset Link Format

```
https://yourdomain.com/reset-password?token={secure_token}

Example:
https://mongodb-microsite.com/reset-password?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### B. Token Generation Algorithm

```
1. Generate UUID v4
2. Optional: Hash with SHA-256 for storage
3. Store with user_id and expiration
4. Return unhashed token for email
```

### C. Password Validation Rules

Current requirements:
- Minimum 6 characters
- At least 1 character (not just spaces)

Future considerations:
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- Not in common password list

### D. Email Service Comparison

| Service | Pros | Cons | Cost |
|---------|------|------|------|
| SendGrid | Easy setup, good deliverability | Requires API key | Free tier: 100/day |
| AWS SES | Reliable, scalable | Requires AWS account | $0.10/1000 emails |
| Mailgun | Developer-friendly | Limited free tier | Free tier: 5000/month |
| SMTP.com | Simple SMTP | Less features | Paid only |

---

## Summary

This architecture provides a complete, secure, and scalable Forgot Password feature that:

✅ Follows security best practices
✅ Prevents user enumeration
✅ Implements rate limiting
✅ Uses secure token generation
✅ Provides excellent user experience
✅ Integrates seamlessly with existing system
✅ Includes comprehensive error handling
✅ Supports monitoring and maintenance
✅ Allows for future enhancements
✅ **Includes 11 alternative methods without email/SMTP**

The implementation follows the existing codebase patterns (FastAPI backend, React frontend, MongoDB database) and maintains consistency with the current authentication flow.

### Alternative Methods Covered:
1. **SMS/OTP** - Fast and user-friendly
2. **Security Questions** - Simple but less secure
3. **Admin-Assisted** - Manual verification
4. **Push Notifications** - Requires mobile app
5. **TOTP/Authenticator** - Very secure, offline capable
6. **Backup Codes** - Reliable fallback
7. **Social OAuth** - Leverages existing accounts
8. **QR Code Scanning** - Innovative approach
9. **WebAuthn/Passkeys** - Future-proof, highly secure
10. **WhatsApp/Telegram** - Messaging app integration
11. **Temporary Access Link** - Flexible manual option

---

**Document Version:** 1.1  
**Last Updated:** January 12, 2026  
**Owner:** Development Team  
**Status:** Ready for Implementation

---

## Quick Navigation

**Traditional Email-Based:** Sections 1-20  
**Alternative Methods (No Email):** Section 21  
**Appendix:** Section 22

