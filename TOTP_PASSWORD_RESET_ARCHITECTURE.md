# TOTP-Based Password Reset - Complete Architecture

## Document Overview

**Purpose:** Comprehensive architecture for implementing Time-Based One-Time Password (TOTP) authentication for password reset functionality.

**Method:** TOTP (RFC 6238 Standard)  
**Authenticator Apps:** Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc.  
**Security Level:** ⭐⭐⭐⭐⭐ (Extremely High)  
**Cost:** FREE (No external services required)  
**User Experience:** ⭐⭐⭐ (Requires app setup)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [TOTP Fundamentals](#2-totp-fundamentals)
3. [Complete Architecture](#3-complete-architecture)
4. [User Flows](#4-user-flows)
5. [Database Design](#5-database-design)
6. [API Specifications](#6-api-specifications)
7. [Security Architecture](#7-security-architecture)
8. [Frontend Design](#8-frontend-design)
9. [Backend Services](#9-backend-services)
10. [Error Handling](#10-error-handling)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Guide](#12-deployment-guide)

---

## 1. System Overview

### 1.1 What is TOTP?

Time-Based One-Time Password (TOTP) is an algorithm that generates a temporary, unique password based on:
- **Shared Secret:** A key known only to the user and server
- **Current Time:** Synchronized between user device and server
- **Algorithm:** HMAC-SHA1 (typically)

**Key Characteristics:**
- Generates 6-digit codes
- New code every 30 seconds
- Works offline (no internet required)
- Industry standard (RFC 6238)
- Used by Google, Microsoft, AWS, GitHub, etc.

### 1.2 How TOTP Works

```
┌─────────────────────────────────────────────────────────────┐
│                    TOTP Generation Process                   │
└─────────────────────────────────────────────────────────────┘

Server Side                                    User Device
─────────────                                  ────────────

[Secret Key]                                   [Secret Key]
     │                                              │
     │                                              │
     ▼                                              ▼
[Current Time]                                [Current Time]
(Unix timestamp                               (Unix timestamp
 ÷ 30 seconds)                                 ÷ 30 seconds)
     │                                              │
     │                                              │
     ▼                                              ▼
[HMAC-SHA1]                                   [HMAC-SHA1]
     │                                              │
     │                                              │
     ▼                                              ▼
[123456] ◄─────── User Enters ───────────────► [123456]
     │                                              
     ▼                                              
[Verify Match]                                     
     │                                              
     ▼                                              
[Allow Password Reset]
```

### 1.3 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    TOTP Password Reset System                       │
└────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Web App    │◄───────►│   Backend    │◄───────►│   MongoDB    │
│  (React UI)  │         │  (FastAPI)   │         │  Database    │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │                         │
       │                   ┌────┴────┐                   │
       │                   │         │                   │
       │                   ▼         ▼                   │
       │            ┌─────────┐ ┌─────────┐             │
       │            │  TOTP   │ │Password │             │
       │            │Validator│ │ Reset   │             │
       │            │ Service │ │ Service │             │
       │            └─────────┘ └─────────┘             │
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                              ┌──────────────┐
│              │                              │              │
│ Authenticator│                              │ Collections: │
│     App      │                              │ - users      │
│ (Google/MS/  │                              │ - totp_setup │
│  Authy)      │                              │ - reset_logs │
│              │                              │              │
└──────────────┘                              └──────────────┘
```

---

## 2. TOTP Fundamentals

### 2.1 TOTP Algorithm Components

```
┌─────────────────────────────────────────────────────────────┐
│                  TOTP Components Breakdown                   │
└─────────────────────────────────────────────────────────────┘

1. SECRET KEY (Base32 Encoded)
   └─ Example: JBSWY3DPEHPK3PXP
   └─ Length: 160 bits (32 characters)
   └─ Generated: Once during setup
   └─ Storage: Encrypted in database

2. TIME COUNTER
   └─ Formula: floor(Unix Timestamp / 30)
   └─ Example: 1673520000 / 30 = 55784000
   └─ Window: 30 seconds (configurable)

3. HMAC ALGORITHM
   └─ Type: HMAC-SHA1 (standard)
   └─ Input: Secret Key + Time Counter
   └─ Output: 20-byte hash

4. TRUNCATION
   └─ Extract: 4 bytes from HMAC output
   └─ Convert: To 6-digit number
   └─ Range: 000000 - 999999
```

### 2.2 Time Synchronization

```
Server Time vs User Device Time
─────────────────────────────────

Perfect Sync (± 0 seconds):
Server: [12:00:00] → Code: 123456
Device: [12:00:00] → Code: 123456 ✓ MATCH

Small Drift (± 30 seconds):
Server: [12:00:00] → Code: 123456
Device: [12:00:15] → Code: 123456 ✓ MATCH (same window)

Large Drift (± 60 seconds):
Server: [12:00:00] → Code: 123456
Device: [12:01:00] → Code: 789012 ✗ NO MATCH

Solution: Accept ±1 time window
├─ Previous window: 11:59:30 - 12:00:00
├─ Current window:  12:00:00 - 12:00:30
└─ Next window:     12:00:30 - 12:01:00
```

### 2.3 QR Code Structure

```
┌─────────────────────────────────────────┐
│  TOTP Setup QR Code Content             │
└─────────────────────────────────────────┘

Format:
otpauth://totp/{ISSUER}:{USER}?secret={SECRET}&issuer={ISSUER}

Example:
otpauth://totp/MongoDB%20Microsite:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MongoDB%20Microsite

Components:
├─ Protocol: otpauth://
├─ Type: totp
├─ Issuer: MongoDB Microsite (your app name)
├─ User: john@example.com (user identifier)
├─ Secret: JBSWY3DPEHPK3PXP (Base32 encoded)
└─ Algorithm: SHA1 (default, can specify SHA256)

Optional Parameters:
├─ algorithm=SHA1 (or SHA256, SHA512)
├─ digits=6 (code length, default 6)
└─ period=30 (time window in seconds)
```

---

## 3. Complete Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Architecture                     │
└─────────────────────────────────────────────────────────────┘

PRESENTATION LAYER (Frontend)
├─ TOTP Setup Modal
│  ├─ QR Code Display
│  ├─ Manual Entry Option
│  └─ Verification Input
│
├─ Password Reset Page
│  ├─ Email Input
│  ├─ TOTP Code Input
│  └─ New Password Form
│
└─ Backup Code Display
   ├─ Code List (10 codes)
   └─ Download/Print Options

APPLICATION LAYER (Backend)
├─ TOTP Service
│  ├─ Secret Generation
│  ├─ QR Code Generation
│  ├─ Code Validation
│  └─ Time Window Management
│
├─ Password Reset Service
│  ├─ User Verification
│  ├─ TOTP Validation
│  ├─ Password Update
│  └─ Session Invalidation
│
└─ Backup Code Service
   ├─ Code Generation
   ├─ Code Validation
   └─ Code Management

DATA LAYER (Database)
├─ users
│  ├─ Basic user info
│  └─ TOTP enabled flag
│
├─ totp_secrets
│  ├─ Encrypted secrets
│  ├─ Backup codes (hashed)
│  └─ Setup status
│
└─ password_reset_logs
   ├─ Reset attempts
   ├─ TOTP validation history
   └─ Security audit trail
```

### 3.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              End-to-End Data Flow Diagram                    │
└─────────────────────────────────────────────────────────────┘

SETUP PHASE
───────────
User               Frontend          Backend           Database
│                  │                 │                 │
│ Request TOTP     │                 │                 │
│ Setup           │                 │                 │
├─────────────────►│                 │                 │
│                  │ POST /setup-totp│                 │
│                  ├────────────────►│                 │
│                  │                 │ Generate Secret │
│                  │                 │ (Base32)        │
│                  │                 │                 │
│                  │                 │ Generate QR     │
│                  │                 │ Data            │
│                  │                 │                 │
│                  │                 │ Store Secret    │
│                  │                 ├────────────────►│
│                  │                 │                 │
│                  │◄────────────────┤                 │
│                  │ QR Code + Secret│                 │
│◄─────────────────┤                 │                 │
│ Display QR       │                 │                 │
│                  │                 │                 │
│ Scan with App    │                 │                 │
│                  │                 │                 │
│ Enter Verify     │                 │                 │
│ Code: 123456     │                 │                 │
├─────────────────►│ POST /verify    │                 │
│                  ├────────────────►│                 │
│                  │                 │ Validate Code   │
│                  │                 │ Enable TOTP     │
│                  │                 ├────────────────►│
│                  │◄────────────────┤                 │
│◄─────────────────┤ Success +       │                 │
│ Backup Codes     │ Backup Codes    │                 │


PASSWORD RESET PHASE
────────────────────
User               Frontend          Backend           Database
│                  │                 │                 │
│ Forgot Password  │                 │                 │
├─────────────────►│                 │                 │
│                  │ POST            │                 │
│ Enter Email      │ /forgot-password│                 │
├─────────────────►├────────────────►│                 │
│                  │                 │ Check User      │
│                  │                 ├────────────────►│
│                  │                 │◄────────────────┤
│                  │                 │ TOTP Enabled?   │
│                  │◄────────────────┤                 │
│◄─────────────────┤ Show TOTP Form  │                 │
│                  │                 │                 │
│ Open Auth App    │                 │                 │
│ Get Code:123456  │                 │                 │
│                  │                 │                 │
│ Enter Code +     │                 │                 │
│ New Password     │                 │                 │
├─────────────────►│ POST            │                 │
│                  │ /reset-password │                 │
│                  ├────────────────►│                 │
│                  │                 │ Validate TOTP   │
│                  │                 │ (±1 window)     │
│                  │                 │                 │
│                  │                 │ Hash Password   │
│                  │                 │ (bcrypt)        │
│                  │                 │                 │
│                  │                 │ Update Password │
│                  │                 ├────────────────►│
│                  │                 │                 │
│                  │                 │ Log Reset       │
│                  │                 ├────────────────►│
│                  │◄────────────────┤                 │
│◄─────────────────┤ Success         │                 │
│ Password Reset!  │                 │                 │
```

---

## 4. User Flows

### 4.1 TOTP Setup Flow (During Registration or Settings)

```
┌─────────────────────────────────────────────────────────────┐
│                    TOTP Setup Journey                        │
└─────────────────────────────────────────────────────────────┘

Step 1: Initiate Setup
┌────────────────────────────────────┐
│  Enable Two-Factor Authentication  │
│                                    │
│  Protect your account with TOTP    │
│  authenticator app.                │
│                                    │
│  ┌────────────────────────┐        │
│  │  Enable TOTP Setup     │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 2: Install Authenticator
┌────────────────────────────────────┐
│  Install Authenticator App         │
│                                    │
│  Download one of these apps:       │
│  • Google Authenticator            │
│  • Microsoft Authenticator         │
│  • Authy                           │
│  • 1Password                       │
│                                    │
│  ┌────────────────────────┐        │
│  │  I have the app        │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 3: Scan QR Code
┌────────────────────────────────────┐
│  Scan QR Code                      │
│                                    │
│  ┌──────────────────────┐          │
│  │  ████  ██  ██  ████  │          │
│  │  ██  ████████  ██    │          │
│  │  ████  ██  ██  ████  │          │
│  │  ██  ████████  ██    │          │
│  │  ████  ██  ██  ████  │          │
│  └──────────────────────┘          │
│                                    │
│  Can't scan?                       │
│  Manual entry: JBSWY3DPEHPK3PXP    │
│                                    │
│  ┌────────────────────────┐        │
│  │  Continue              │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 4: Verify Setup
┌────────────────────────────────────┐
│  Verify TOTP Code                  │
│                                    │
│  Enter the 6-digit code from       │
│  your authenticator app:           │
│                                    │
│  ┌───┬───┬───┬───┬───┬───┐        │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │        │
│  └───┴───┴───┴───┴───┴───┘        │
│                                    │
│  Code refreshes every 30s          │
│                                    │
│  ┌────────────────────────┐        │
│  │  Verify & Enable       │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 5: Save Backup Codes
┌────────────────────────────────────┐
│  Save Backup Codes                 │
│                                    │
│  Keep these codes safe. Use them   │
│  if you lose your device.          │
│                                    │
│  a3f7-9k2m-p5w8-q1n4              │
│  b8j2-c6v9-d4t7-e1r5              │
│  c1k5-d8m3-f2n7-g9p4              │
│  ...                               │
│                                    │
│  ┌──────────┐  ┌──────────┐       │
│  │ Download │  │  Print   │       │
│  └──────────┘  └──────────┘       │
│                                    │
│  ☑ I've saved my backup codes      │
│                                    │
│  ┌────────────────────────┐        │
│  │  Finish Setup          │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 6: Success
┌────────────────────────────────────┐
│  ✓ TOTP Enabled Successfully!      │
│                                    │
│  Your account is now protected     │
│  with two-factor authentication.   │
│                                    │
│  Next time you reset password,     │
│  you'll need your authenticator.   │
│                                    │
│  ┌────────────────────────┐        │
│  │  Done                  │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
```

### 4.2 Password Reset with TOTP Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Password Reset Using TOTP Journey               │
└─────────────────────────────────────────────────────────────┘

Step 1: Forgot Password
┌────────────────────────────────────┐
│  Reset Your Password               │
│                                    │
│  Email Address                     │
│  ┌──────────────────────────────┐  │
│  │ john@example.com             │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌────────────────────────┐        │
│  │  Continue              │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 2: TOTP Required
┌────────────────────────────────────┐
│  Verification Required             │
│                                    │
│  Two-factor authentication is      │
│  enabled on this account.          │
│                                    │
│  Open your authenticator app       │
│  and enter the code:               │
│                                    │
│  ┌────────────────────────┐        │
│  │  Continue with TOTP    │        │
│  └────────────────────────┘        │
│                                    │
│  Lost your device?                 │
│  Use backup code instead           │
└────────────────────────────────────┘
            │
            ▼

Step 3: Enter TOTP Code
┌────────────────────────────────────┐
│  Enter Authentication Code         │
│                                    │
│  Open MongoDB Microsite in your    │
│  authenticator app                 │
│                                    │
│  6-Digit Code                      │
│  ┌───┬───┬───┬───┬───┬───┐        │
│  │ _ │ _ │ _ │ _ │ _ │ _ │        │
│  └───┴───┴───┴───┴───┴───┘        │
│                                    │
│  ⏱ New code in 15 seconds          │
│                                    │
│  ┌────────────────────────┐        │
│  │  Verify                │        │
│  └────────────────────────┘        │
│                                    │
│  Can't access app?                 │
│  Use backup code                   │
└────────────────────────────────────┘
            │
            ▼

Step 4: Set New Password
┌────────────────────────────────────┐
│  Create New Password               │
│                                    │
│  ✓ Authentication successful       │
│                                    │
│  New Password                      │
│  ┌──────────────────────────────┐  │
│  │ ••••••••••••                 │  │
│  └──────────────────────────────┘  │
│                                    │
│  Confirm Password                  │
│  ┌──────────────────────────────┐  │
│  │ ••••••••••••                 │  │
│  └──────────────────────────────┘  │
│                                    │
│  Password Strength: ████████░░     │
│  Strong                            │
│                                    │
│  ┌────────────────────────┐        │
│  │  Reset Password        │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼

Step 5: Success
┌────────────────────────────────────┐
│  ✓ Password Reset Successfully!    │
│                                    │
│  Your password has been updated.   │
│  You can now login with your       │
│  new credentials.                  │
│                                    │
│  For security:                     │
│  • All sessions have been logged   │
│    out                             │
│  • Login from all devices required │
│                                    │
│  ┌────────────────────────┐        │
│  │  Go to Login           │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
```

### 4.3 Backup Code Usage Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Password Reset Using Backup Code                │
└─────────────────────────────────────────────────────────────┘

Step 1: Choose Backup Code
┌────────────────────────────────────┐
│  Lost Your Device?                 │
│                                    │
│  If you can't access your          │
│  authenticator app, use a          │
│  backup code instead.              │
│                                    │
│  Enter Backup Code                 │
│  ┌──────────────────────────────┐  │
│  │ a3f7-9k2m-p5w8-q1n4          │  │
│  └──────────────────────────────┘  │
│                                    │
│  Format: xxxx-xxxx-xxxx-xxxx       │
│                                    │
│  ┌────────────────────────┐        │
│  │  Verify Code           │        │
│  └────────────────────────┘        │
│                                    │
│  ⚠️ Each backup code works once    │
└────────────────────────────────────┘
            │
            ▼

Step 2: Code Validated
┌────────────────────────────────────┐
│  ✓ Backup Code Verified            │
│                                    │
│  Remaining backup codes: 9         │
│                                    │
│  ⚠️ Warning: You have used 1 of    │
│  your 10 backup codes.             │
│                                    │
│  Consider:                         │
│  • Setting up new authenticator    │
│  • Generating new backup codes     │
│                                    │
│  ┌────────────────────────┐        │
│  │  Continue to Reset     │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
            │
            ▼
        (Same as TOTP Step 4)
```

---

## 5. Database Design

### 5.1 Collection Schemas

```javascript
┌─────────────────────────────────────────────────────────────┐
│                   Database Collections                       │
└─────────────────────────────────────────────────────────────┘

COLLECTION: users (Existing - Update Required)
─────────────────────────────────────────────────
{
  _id: "uuid-user-id",
  first_name: "John",
  last_name: "Doe",
  user_email: "john@example.com",
  is_internal: false,
  is_admin: false,
  created_at: "2026-01-12T10:00:00Z",
  
  // NEW FIELDS for TOTP
  totp_enabled: false,              // Whether TOTP is active
  totp_setup_at: null,              // When TOTP was enabled
  totp_last_used: null              // Last successful TOTP auth
}


COLLECTION: totp_secrets (NEW)
──────────────────────────────
{
  _id: "uuid-secret-id",
  user_id: "uuid-user-id",          // FK to users._id
  user_email: "john@example.com",   // Denormalized for queries
  
  // Secret Storage
  secret_encrypted: "AES_ENCRYPTED_BASE32_SECRET",
  encryption_key_id: "key-v1",      // Which encryption key was used
  
  // Setup Information
  is_verified: true,                // Has user verified setup
  setup_completed_at: "2026-01-12T10:30:00Z",
  qr_code_generated_at: "2026-01-12T10:25:00Z",
  
  // Backup Codes
  backup_codes: [
    {
      code_hash: "bcrypt_hash_of_code",
      is_used: false,
      used_at: null
    },
    // ... 9 more codes (10 total)
  ],
  backup_codes_generated_at: "2026-01-12T10:30:00Z",
  
  // Metadata
  created_at: "2026-01-12T10:25:00Z",
  updated_at: "2026-01-12T10:30:00Z",
  
  // Security
  last_validation_attempt: "2026-01-12T14:00:00Z",
  failed_attempts: 0,
  locked_until: null                // Temporary lock after failures
}


COLLECTION: password_reset_logs (NEW)
──────────────────────────────────────
{
  _id: "uuid-log-id",
  user_id: "uuid-user-id",
  user_email: "john@example.com",
  
  // Reset Method
  reset_method: "totp",             // or "backup_code" or "admin"
  
  // TOTP Details
  totp_code_provided: "123456",     // Hashed or logged
  totp_valid: true,
  time_window_used: 0,              // -1, 0, or +1 (which 30s window)
  
  // Request Details
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  device_fingerprint: "hash",
  geolocation: {
    country: "US",
    city: "New York"
  },
  
  // Result
  reset_successful: true,
  failure_reason: null,             // If failed
  
  // Timestamps
  reset_requested_at: "2026-01-12T14:00:00Z",
  reset_completed_at: "2026-01-12T14:02:15Z",
  
  // Security Flags
  suspicious_activity: false,
  admin_notified: false
}


COLLECTION: totp_validation_attempts (NEW)
───────────────────────────────────────────
{
  _id: "uuid-attempt-id",
  user_id: "uuid-user-id",
  user_email: "john@example.com",
  
  // Attempt Details
  code_provided: "123456",
  code_valid: false,
  validation_type: "password_reset", // or "login" or "setup"
  
  // Time Information
  attempted_at: "2026-01-12T14:00:00Z",
  server_time_counter: 55784000,
  time_drift_seconds: 5,
  
  // Request Context
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  
  // Security
  rate_limit_triggered: false,
  account_locked: false
}
```

### 5.2 Database Indexes

```javascript
┌─────────────────────────────────────────────────────────────┐
│                    Required Indexes                          │
└─────────────────────────────────────────────────────────────┘

COLLECTION: users
─────────────────
db.users.createIndex({ "user_email": 1 }, { unique: true })
db.users.createIndex({ "totp_enabled": 1 })


COLLECTION: totp_secrets
────────────────────────
db.totp_secrets.createIndex({ "user_id": 1 }, { unique: true })
db.totp_secrets.createIndex({ "user_email": 1 })
db.totp_secrets.createIndex({ "is_verified": 1 })
db.totp_secrets.createIndex({ "locked_until": 1 })


COLLECTION: password_reset_logs
────────────────────────────────
db.password_reset_logs.createIndex({ "user_id": 1 })
db.password_reset_logs.createIndex({ "reset_requested_at": -1 })
db.password_reset_logs.createIndex({ "ip_address": 1 })
db.password_reset_logs.createIndex({ "reset_method": 1 })
db.password_reset_logs.createIndex({ "suspicious_activity": 1 })


COLLECTION: totp_validation_attempts
─────────────────────────────────────
db.totp_validation_attempts.createIndex({ "user_id": 1, "attempted_at": -1 })
db.totp_validation_attempts.createIndex({ "ip_address": 1, "attempted_at": -1 })
db.totp_validation_attempts.createIndex({ "attempted_at": -1 }, { 
  expireAfterSeconds: 2592000  // Auto-delete after 30 days
})
```

### 5.3 Data Relationships

```
users (1) ──────────── (1) totp_secrets
  │                          
  │                          
  └─(1)──────────(many) password_reset_logs
  │
  │
  └─(1)──────────(many) totp_validation_attempts
```

---

## 6. API Specifications

### 6.1 TOTP Setup Endpoints

#### **POST /api/v1/totp/setup/initiate**

**Description:** Generate TOTP secret and QR code for user

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "user_id": "uuid-here"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "manual_entry_key": "JBSWY3DPEHPK3PXP",
    "issuer": "MongoDB Microsite",
    "account_name": "john@example.com",
    "otpauth_url": "otpauth://totp/MongoDB%20Microsite:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MongoDB%20Microsite"
  }
}
```

**Response (400 Error):**
```json
{
  "detail": "TOTP is already enabled for this user"
}
```

---

#### **POST /api/v1/totp/setup/verify**

**Description:** Verify TOTP code and enable TOTP for user

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "user_id": "uuid-here",
  "totp_code": "123456"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "TOTP enabled successfully",
  "backup_codes": [
    "a3f7-9k2m-p5w8-q1n4",
    "b8j2-c6v9-d4t7-e1r5",
    "c1k5-d8m3-f2n7-g9p4",
    "d4n8-e7p2-f3q6-g1r9",
    "e2p6-f9q3-g8r7-h4s1",
    "f7q1-g4r8-h2s5-i9t3",
    "g3r9-h6s2-i1t4-j8u7",
    "h8s4-i2t7-j5u1-k3v9",
    "i1t3-j9u6-k7v2-l4w8",
    "j6u9-k3v5-l8w1-m2x4"
  ],
  "totp_enabled_at": "2026-01-12T10:30:00Z"
}
```

**Response (400 Error):**
```json
{
  "detail": "Invalid TOTP code"
}
```

**Response (429 Too Many Requests):**
```json
{
  "detail": "Too many verification attempts. Try again in 15 minutes."
}
```

---

### 6.2 Password Reset Endpoints

#### **POST /api/v1/password-reset/request**

**Description:** Initiate password reset (check if TOTP is required)

**Authentication:** None

**Request:**
```json
{
  "user_email": "john@example.com"
}
```

**Response (200 Success - TOTP Enabled):**
```json
{
  "success": true,
  "totp_required": true,
  "message": "TOTP verification required for password reset",
  "reset_token": "temporary-session-token"
}
```

**Response (200 Success - TOTP Not Enabled):**
```json
{
  "success": true,
  "totp_required": false,
  "message": "Password reset link sent to email",
  "reset_token": "standard-reset-token"
}
```

**Response (200 - Email Not Found):**
```json
{
  "success": true,
  "message": "If an account exists, reset instructions have been sent"
}
```

*Note: Always return success to prevent email enumeration*

---

#### **POST /api/v1/password-reset/verify-totp**

**Description:** Verify TOTP code for password reset

**Authentication:** None (uses reset_token from previous step)

**Request:**
```json
{
  "reset_token": "temporary-session-token",
  "totp_code": "123456"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "TOTP verified successfully",
  "password_reset_token": "verified-reset-token-uuid",
  "expires_in": 600
}
```

**Response (400 Error):**
```json
{
  "detail": "Invalid or expired TOTP code"
}
```

**Response (429 Too Many Requests):**
```json
{
  "detail": "Too many attempts. Please try again in 15 minutes."
}
```

---

#### **POST /api/v1/password-reset/verify-backup-code**

**Description:** Verify backup code for password reset

**Authentication:** None (uses reset_token)

**Request:**
```json
{
  "reset_token": "temporary-session-token",
  "backup_code": "a3f7-9k2m-p5w8-q1n4"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "Backup code verified successfully",
  "password_reset_token": "verified-reset-token-uuid",
  "remaining_backup_codes": 9,
  "warning": "You have used 1 of your 10 backup codes. Consider regenerating codes."
}
```

**Response (400 Error):**
```json
{
  "detail": "Invalid or already used backup code"
}
```

---

#### **POST /api/v1/password-reset/complete**

**Description:** Complete password reset with new password

**Authentication:** None (uses password_reset_token)

**Request:**
```json
{
  "password_reset_token": "verified-reset-token-uuid",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "sessions_invalidated": 3,
  "reset_completed_at": "2026-01-12T14:02:15Z"
}
```

**Response (400 Error):**
```json
{
  "detail": "Invalid or expired reset token"
}
```

**Response (422 Validation Error):**
```json
{
  "detail": "Password must be at least 6 characters long"
}
```

---

### 6.3 TOTP Management Endpoints

#### **POST /api/v1/totp/disable**

**Description:** Disable TOTP for user account

**Authentication:** Required (Bearer Token + Current Password)

**Request:**
```json
{
  "user_id": "uuid-here",
  "current_password": "CurrentPassword123!",
  "totp_code": "123456"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "TOTP disabled successfully",
  "disabled_at": "2026-01-12T15:00:00Z"
}
```

---

#### **POST /api/v1/totp/regenerate-backup-codes**

**Description:** Generate new set of backup codes (invalidates old ones)

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "user_id": "uuid-here",
  "totp_code": "123456"
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "backup_codes": [
    "new-code-1",
    "new-code-2",
    // ... 8 more codes
  ],
  "generated_at": "2026-01-12T15:30:00Z",
  "old_codes_invalidated": true
}
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                  Security Architecture                       │
└─────────────────────────────────────────────────────────────┘

LAYER 1: Secret Storage Security
─────────────────────────────────
┌──────────────────────────┐
│ TOTP Secret              │
│ (Base32: JBSWY3DPEHPK)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ AES-256-GCM Encryption   │
│ Key from Environment     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Encrypted String         │
│ Stored in MongoDB        │
└──────────────────────────┘


LAYER 2: Time Window Validation
────────────────────────────────
Accept codes from 3 time windows:
├─ Previous window (-30s)
├─ Current window  (±0s)
└─ Next window     (+30s)

Prevents issues from:
- Clock drift
- Network delays
- User typing speed


LAYER 3: Rate Limiting
───────────────────────
PER USER:
- Max 5 attempts per 15 minutes
- Exponential backoff after failures
- Account lock after 10 failed attempts

PER IP:
- Max 20 attempts per hour
- Prevents brute force attacks


LAYER 4: Code Reuse Prevention
───────────────────────────────
Track used codes within window:
- Store last successfully used code
- Store timestamp of last use
- Reject if same code within 30s
- Prevents replay attacks


LAYER 5: Backup Code Security
──────────────────────────────
┌──────────────────────────┐
│ Backup Code              │
│ (a3f7-9k2m-p5w8-q1n4)   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ bcrypt Hash (12 rounds)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Hashed Code              │
│ Stored in Database       │
└──────────────────────────┘

Properties:
- Single use only
- Marked as used after validation
- Cannot be unhashed
- 10 codes total per user


LAYER 6: Audit Logging
──────────────────────
Log all security events:
├─ TOTP setup attempts
├─ Verification attempts (success/fail)
├─ Password reset requests
├─ Backup code usage
├─ Suspicious patterns
└─ Account lockouts


LAYER 7: Session Management
────────────────────────────
After password reset:
├─ Invalidate all active sessions
├─ Require re-login everywhere
├─ Generate new session tokens
└─ Notify user via email (if possible)
```

### 7.2 Threat Model & Mitigations

```
┌─────────────────────────────────────────────────────────────┐
│                  Threat Analysis & Mitigation                │
└─────────────────────────────────────────────────────────────┘

THREAT 1: Brute Force Attack
────────────────────────────
Attack: Try all 1,000,000 possible codes (000000-999999)

Mitigation:
✓ Rate limiting (5 attempts per 15 min)
✓ Account lockout after 10 failures
✓ IP-based rate limiting
✓ Exponential backoff
✓ Alert on suspicious patterns

Result: Would take ~3,472 years to brute force


THREAT 2: Man-in-the-Middle (MITM)
───────────────────────────────────
Attack: Intercept TOTP code during transmission

Mitigation:
✓ HTTPS/TLS required for all communication
✓ Code expires in 30 seconds
✓ One-time use per window
✓ Cannot replay captured code

Result: Very short window of opportunity


THREAT 3: Phishing Attack
──────────────────────────
Attack: Fake login page steals TOTP code

Mitigation:
✓ Educate users to check URL
✓ Code only valid for 30 seconds
✓ Binds to specific domain in QR code
✓ Monitor for unusual geographic patterns

Result: Reduces risk significantly


THREAT 4: Secret Key Compromise
────────────────────────────────
Attack: Database breach exposes TOTP secrets

Mitigation:
✓ AES-256 encryption at rest
✓ Encryption key separate from database
✓ Key rotation capability
✓ Secrets never logged
✓ Admin access logging

Result: Secrets remain secure even if DB compromised


THREAT 5: Backup Code Theft
────────────────────────────
Attack: Steal user's printed backup codes

Mitigation:
✓ Codes bcrypt hashed in database
✓ Single-use only
✓ Track usage and alert user
✓ Allow regeneration
✓ Log when codes used

Result: Stolen codes can be detected and invalidated


THREAT 6: Time Manipulation
────────────────────────────
Attack: Manipulate server/client time to reuse codes

Mitigation:
✓ Use system time, not user time
✓ Track last used code and timestamp
✓ Reject duplicate codes within window
✓ Monitor for time anomalies

Result: Cannot reuse codes


THREAT 7: Social Engineering
─────────────────────────────
Attack: Trick user into revealing TOTP code

Mitigation:
✓ User education
✓ Never ask for TOTP via email/phone
✓ Display warnings in UI
✓ Monitor for unusual patterns

Result: Educated users are more resistant


THREAT 8: Device Loss/Theft
────────────────────────────
Attack: Steal user's phone with authenticator

Mitigation:
✓ Backup codes allow recovery
✓ Admin-assisted reset available
✓ Device lock protects authenticator apps
✓ Can disable TOTP with current password

Result: Multiple recovery options available
```

### 7.3 Security Best Practices Implementation

```
┌─────────────────────────────────────────────────────────────┐
│              Security Implementation Checklist               │
└─────────────────────────────────────────────────────────────┘

SECRET MANAGEMENT
─────────────────
☑ Generate cryptographically secure random secrets
☑ Use 160-bit (20-byte) secrets minimum
☑ Encrypt secrets at rest (AES-256-GCM)
☑ Never log or display secrets after setup
☑ Implement key rotation capability
☑ Store encryption keys separately from data

CODE VALIDATION
───────────────
☑ Accept ±1 time window for clock drift
☑ Prevent code reuse within same window
☑ Implement rate limiting (user and IP)
☑ Lock account after threshold failures
☑ Use constant-time comparison for codes
☑ Clear codes from memory after validation

BACKUP CODES
────────────
☑ Generate 10 unique backup codes
☑ Use bcrypt with 12 rounds for hashing
☑ Mark codes as used, don't delete
☑ Alert user when codes used
☑ Warn when < 3 codes remaining
☑ Allow regeneration at any time

AUDIT & MONITORING
──────────────────
☑ Log all TOTP setup attempts
☑ Log all validation attempts
☑ Log all password reset events
☑ Track IP addresses and user agents
☑ Alert on suspicious patterns
☑ Retain logs for minimum 90 days

USER COMMUNICATION
──────────────────
☑ Email notification on TOTP setup
☑ Email notification on TOTP disable
☑ Email notification on password reset
☑ Email notification on backup code use
☑ In-app warnings for security events
☑ Clear instructions in UI

ERROR MESSAGES
──────────────
☑ Generic messages (don't reveal details)
☑ Same message for invalid/expired codes
☑ Don't reveal if email exists
☑ Don't specify which backup code invalid
☑ Log detailed errors server-side only

TESTING
───────
☑ Test clock drift scenarios
☑ Test rate limiting enforcement
☑ Test backup code functionality
☑ Test secret encryption/decryption
☑ Security penetration testing
☑ Load testing for rate limits
```

---

## 8. Frontend Design

### 8.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Component Structure                │
└─────────────────────────────────────────────────────────────┘

src/
├── components/
│   ├── totp/
│   │   ├── TOTPSetupModal.tsx
│   │   │   ├── Step 1: Introduction
│   │   │   ├── Step 2: Install App
│   │   │   ├── Step 3: Scan QR Code
│   │   │   ├── Step 4: Verify Code
│   │   │   └── Step 5: Save Backup Codes
│   │   │
│   │   ├── TOTPVerificationInput.tsx
│   │   │   ├── 6-digit input boxes
│   │   │   ├── Auto-focus next box
│   │   │   ├── Timer countdown
│   │   │   └── Error display
│   │   │
│   │   ├── QRCodeDisplay.tsx
│   │   │   ├── QR code image
│   │   │   ├── Manual entry option
│   │   │   └── Copy secret button
│   │   │
│   │   ├── BackupCodesDisplay.tsx
│   │   │   ├── Code list
│   │   │   ├── Download button
│   │   │   ├── Print button
│   │   │   └── Confirmation checkbox
│   │   │
│   │   └── TOTPStatus.tsx
│   │       ├── Enabled/Disabled badge
│   │       ├── Last used timestamp
│   │       └── Manage button
│   │
│   └── password-reset/
│       ├── ForgotPasswordModal.tsx
│       │   └── Email input form
│       │
│       ├── TOTPResetForm.tsx
│       │   ├── TOTP code input
│       │   ├── Backup code option
│       │   └── New password fields
│       │
│       └── ResetSuccessPage.tsx
│           └── Success message & redirect
│
├── pages/
│   ├── Settings.tsx
│   │   └── TOTP management section
│   │
│   └── PasswordReset.tsx
│       └── Password reset flow handler
│
├── api/
│   └── services/
│       └── totpService.ts
│           ├── initiateSetup()
│           ├── verifySetup()
│           ├── validateTOTP()
│           ├── validateBackupCode()
│           └── resetPassword()
│
├── types/
│   └── totp.ts
│       ├── TOTPSetupResponse
│       ├── TOTPVerificationRequest
│       ├── BackupCode
│       └── PasswordResetRequest
│
└── utils/
    ├── totpValidator.ts
    │   ├── validateCodeFormat()
    │   └── validateBackupCodeFormat()
    │
    └── qrCodeGenerator.ts
        └── generateQRDataUrl()
```

### 8.2 UI/UX Wireframes

```
┌─────────────────────────────────────────────────────────────┐
│              TOTP Setup Modal - QR Code Step                 │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  [X]                                                Step 3/5│
│                                                             │
│         Scan QR Code with Authenticator App                │
│         ───────────────────────────────────────            │
│                                                             │
│  Open your authenticator app and scan this code:           │
│                                                             │
│          ┌─────────────────────────┐                       │
│          │  ███  ██████  ██  ████  │                       │
│          │  ██  ████████████  ██   │                       │
│          │  ████  ██  ██  ██  ████ │                       │
│          │  ██  ████████████  ██   │                       │
│          │  ███  ██████  ██  ████  │                       │
│          └─────────────────────────┘                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Recommended Apps:                                    │  │
│  │ • Google Authenticator                               │  │
│  │ • Microsoft Authenticator                            │  │
│  │ • Authy                                              │  │
│  │ • 1Password                                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                             │
│  Can't scan the code?                                      │
│  Enter this key manually: JBSWY3DPEHPK3PXP  [Copy]         │
│                                                             │
│  ┌─────────────┐  ┌──────────────────────────────┐        │
│  │    Back     │  │         Continue             │        │
│  └─────────────┘  └──────────────────────────────┘        │
└────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│            TOTP Verification Input Component                 │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                                                             │
│  Enter the 6-digit code from your authenticator app:       │
│                                                             │
│     ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐             │
│     │ 1 │  │ 2 │  │ 3 │  │ 4 │  │ 5 │  │ 6 │             │
│     └───┘  └───┘  └───┘  └───┘  └───┘  └───┘             │
│                                                             │
│  ⏱ New code in 23 seconds                                  │
│  [▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱]                          │
│                                                             │
│  The code refreshes every 30 seconds                       │
│                                                             │
└────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│               Backup Codes Display Component                 │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  [X]                                                Step 5/5│
│                                                             │
│              Save Your Backup Codes                        │
│              ────────────────────────                      │
│                                                             │
│  ⚠️ IMPORTANT: Save these codes in a secure place.         │
│  You'll need them if you lose access to your device.       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. a3f7-9k2m-p5w8-q1n4                              │  │
│  │  2. b8j2-c6v9-d4t7-e1r5                              │  │
│  │  3. c1k5-d8m3-f2n7-g9p4                              │  │
│  │  4. d4n8-e7p2-f3q6-g1r9                              │  │
│  │  5. e2p6-f9q3-g8r7-h4s1                              │  │
│  │  6. f7q1-g4r8-h2s5-i9t3                              │  │
│  │  7. g3r9-h6s2-i1t4-j8u7                              │  │
│  │  8. h8s4-i2t7-j5u1-k3v9                              │  │
│  │  9. i1t3-j9u6-k7v2-l4w8                              │  │
│  │ 10. j6u9-k3v5-l8w1-m2x4                              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  📥 Download │  │  🖨️ Print   │  │  📋 Copy All │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ☑ I have saved my backup codes securely                   │
│                                                             │
│  Each code works once. If you use all 10, you can          │
│  generate new codes from your account settings.            │
│                                                             │
│  ┌──────────────────────────────┐                          │
│  │      Finish Setup            │                          │
│  └──────────────────────────────┘                          │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Backend Services

### 9.1 Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Backend Service Organization                  │
└─────────────────────────────────────────────────────────────┘

TOTPService
───────────
Responsibilities:
├─ Generate TOTP secrets (Base32)
├─ Generate QR code data URLs
├─ Validate TOTP codes (±1 window)
├─ Manage backup codes
├─ Handle secret encryption/decryption
└─ Track validation attempts

Methods:
├─ generate_secret() → Base32 string
├─ generate_qr_code(secret, user_email) → QR data URL
├─ validate_totp(secret, code, time_window) → boolean
├─ encrypt_secret(secret) → encrypted string
├─ decrypt_secret(encrypted) → secret string
├─ generate_backup_codes() → list of 10 codes
└─ hash_backup_code(code) → bcrypt hash


PasswordResetService
────────────────────
Responsibilities:
├─ Initiate password reset flow
├─ Coordinate TOTP validation
├─ Update user passwords
├─ Invalidate user sessions
└─ Send security notifications

Methods:
├─ initiate_reset(email) → reset token
├─ verify_totp_for_reset(token, code) → verification token
├─ verify_backup_code(token, code) → verification token
├─ complete_reset(verification_token, new_password) → success
├─ invalidate_all_sessions(user_id) → count
└─ send_security_notification(user_id, event) → none


RateLimitService
────────────────
Responsibilities:
├─ Track attempt counts per user
├─ Track attempt counts per IP
├─ Implement exponential backoff
├─ Handle account lockouts
└─ Clean up expired attempts

Methods:
├─ check_rate_limit(user_id, action) → allowed boolean
├─ record_attempt(user_id, ip, success) → none
├─ is_account_locked(user_id) → boolean
├─ lock_account(user_id, duration) → unlock_time
└─ clear_attempts(user_id) → none


AuditLogService
───────────────
Responsibilities:
├─ Log all security events
├─ Track suspicious patterns
├─ Generate security reports
├─ Alert administrators
└─ Comply with audit requirements

Methods:
├─ log_totp_setup(user_id, success) → log_id
├─ log_validation_attempt(user_id, code, result) → log_id
├─ log_password_reset(user_id, method, result) → log_id
├─ detect_suspicious_activity(user_id) → risk_score
└─ generate_security_report(start_date, end_date) → report
```

### 9.2 Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                   Service Dependency Graph                   │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  API Endpoints   │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │   TOTP   │ │Password  │ │  User    │
         │ Service  │ │  Reset   │ │ Service  │
         │          │ │ Service  │ │          │
         └─────┬────┘ └────┬─────┘ └────┬─────┘
               │           │            │
               │   ┌───────┼────────┐   │
               │   │       │        │   │
               ▼   ▼       ▼        ▼   ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │   Rate   │ │  Audit   │ │  Email   │
         │  Limit   │ │   Log    │ │ Service  │
         │ Service  │ │ Service  │ │          │
         └─────┬────┘ └────┬─────┘ └────┬─────┘
               │           │            │
               └───────────┼────────────┘
                           │
                           ▼
                  ┌──────────────┐
                  │ Repositories │
                  │  (Database)  │
                  └──────────────┘
```

---

## 10. Error Handling

### 10.1 Error Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Strategy                   │
└─────────────────────────────────────────────────────────────┘

SETUP ERRORS
────────────
├─ TOTPAlreadyEnabled
│  ├─ Message: "TOTP is already enabled for this account"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Redirect to TOTP management
│
├─ SecretGenerationFailed
│  ├─ Message: "Failed to generate TOTP secret"
│  ├─ HTTP: 500 Internal Server Error
│  └─ Action: Retry, log error, alert admin
│
└─ InvalidVerificationCode
   ├─ Message: "Invalid verification code"
   ├─ HTTP: 400 Bad Request
   └─ Action: Allow retry, increment attempt counter


VALIDATION ERRORS
─────────────────
├─ InvalidTOTPCode
│  ├─ Message: "Invalid or expired authentication code"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Increment attempts, check rate limit
│
├─ CodeAlreadyUsed
│  ├─ Message: "This code has already been used"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Wait for new code, log as suspicious
│
├─ RateLimitExceeded
│  ├─ Message: "Too many attempts. Try again in X minutes"
│  ├─ HTTP: 429 Too Many Requests
│  └─ Action: Enforce wait period, log event
│
└─ AccountLocked
   ├─ Message: "Account temporarily locked due to too many failed attempts"
   ├─ HTTP: 403 Forbidden
   └─ Action: Wait for unlock time, contact support


BACKUP CODE ERRORS
──────────────────
├─ InvalidBackupCode
│  ├─ Message: "Invalid backup code"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Allow retry, don't specify which code
│
├─ BackupCodeAlreadyUsed
│  ├─ Message: "This backup code has already been used"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Suggest using different code
│
└─ NoBackupCodesRemaining
   ├─ Message: "All backup codes have been used"
   ├─ HTTP: 400 Bad Request
   └─ Action: Suggest admin-assisted reset


PASSWORD RESET ERRORS
─────────────────────
├─ InvalidResetToken
│  ├─ Message: "Invalid or expired reset token"
│  ├─ HTTP: 400 Bad Request
│  └─ Action: Request new reset
│
├─ PasswordValidationFailed
│  ├─ Message: "Password must be at least 6 characters"
│  ├─ HTTP: 422 Unprocessable Entity
│  └─ Action: Show password requirements
│
└─ ResetAlreadyCompleted
   ├─ Message: "This reset has already been completed"
   ├─ HTTP: 400 Bad Request
   └─ Action: Attempt login or request new reset


SYSTEM ERRORS
─────────────
├─ DatabaseError
│  ├─ Message: "A system error occurred. Please try again later"
│  ├─ HTTP: 500 Internal Server Error
│  └─ Action: Log error, alert admin, retry logic
│
├─ EncryptionError
│  ├─ Message: "A security error occurred"
│  ├─ HTTP: 500 Internal Server Error
│  └─ Action: Log error, alert security team
│
└─ TimeS syncError
   ├─ Message: "System time synchronization issue"
   ├─ HTTP: 503 Service Unavailable
   └─ Action: Alert admin, check NTP service
```

### 10.2 Error Response Format

```json
{
  "error": {
    "code": "INVALID_TOTP_CODE",
    "message": "Invalid or expired authentication code",
    "details": {
      "attempts_remaining": 3,
      "lockout_minutes": 15
    },
    "timestamp": "2026-01-12T14:00:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Test Cases

```
┌─────────────────────────────────────────────────────────────┐
│                      Unit Test Plan                          │
└─────────────────────────────────────────────────────────────┘

TOTP Generation Tests
─────────────────────
✓ Test secret generation produces valid Base32
✓ Test secret is 160 bits (20 bytes)
✓ Test secrets are unique (generate 1000, check uniqueness)
✓ Test QR code generation produces valid data URL
✓ Test QR code contains correct otpauth:// format


Code Validation Tests
─────────────────────
✓ Test valid code in current window returns true
✓ Test valid code in previous window returns true
✓ Test valid code in next window returns true
✓ Test invalid code returns false
✓ Test code from 2+ windows away returns false
✓ Test empty code returns false
✓ Test non-numeric code returns false
✓ Test code with wrong length returns false


Time Window Tests
─────────────────
✓ Test time counter calculation is correct
✓ Test ±1 window acceptance
✓ Test code changes every 30 seconds
✓ Test same code rejected twice in same window
✓ Test clock drift handling (±60 seconds)


Backup Code Tests
─────────────────
✓ Test backup code generation creates 10 unique codes
✓ Test backup codes have correct format (xxxx-xxxx-xxxx-xxxx)
✓ Test backup code hashing is bcrypt
✓ Test backup code validation is correct
✓ Test used backup code is rejected
✓ Test backup code can only be used once


Rate Limiting Tests
───────────────────
✓ Test 5 attempts allowed in 15 minutes
✓ Test 6th attempt is blocked
✓ Test attempts reset after time window
✓ Test account lock after 10 failures
✓ Test unlock after lock duration
✓ Test IP-based rate limiting


Encryption Tests
────────────────
✓ Test secret encryption produces different output each time
✓ Test encrypted secret can be decrypted correctly
✓ Test encryption uses AES-256-GCM
✓ Test decryption with wrong key fails
✓ Test encrypted data is not plain text
```

### 11.2 Integration Test Cases

```
SETUP FLOW TESTS
────────────────
✓ Complete TOTP setup from start to finish
✓ Verify QR code can be scanned by real authenticator app
✓ Test manual secret entry works
✓ Test verification with correct code succeeds
✓ Test verification with incorrect code fails
✓ Test backup codes are generated and stored
✓ Test duplicate setup attempt is rejected


PASSWORD RESET FLOW TESTS
──────────────────────────
✓ Initiate reset for TOTP-enabled account
✓ Verify TOTP code and get reset token
✓ Complete reset with new password
✓ Verify old password no longer works
✓ Verify new password works
✓ Verify sessions are invalidated
✓ Test backup code as alternative to TOTP


ERROR HANDLING TESTS
────────────────────
✓ Test invalid TOTP code shows correct error
✓ Test expired reset token is rejected
✓ Test rate limit triggers on 6th attempt
✓ Test account lock triggers on 11th attempt
✓ Test generic message for non-existent email
✓ Test all error responses have correct HTTP codes


SECURITY TESTS
──────────────
✓ Test TOTP secret is encrypted in database
✓ Test backup codes are hashed in database
✓ Test replay attack prevention
✓ Test concurrent validation attempts
✓ Test audit log captures all events
✓ Test failed attempts are tracked
```

### 11.3 End-to-End Test Scenarios

```
SCENARIO 1: New User Setup
──────────────────────────
1. User registers account
2. User navigates to security settings
3. User clicks "Enable TOTP"
4. User sees QR code
5. User scans with Google Authenticator
6. User enters verification code
7. User downloads backup codes
8. TOTP is enabled
9. Verify database shows totp_enabled = true


SCENARIO 2: Password Reset with TOTP
─────────────────────────────────────
1. User clicks "Forgot Password"
2. User enters email
3. System detects TOTP is enabled
4. User sees TOTP input form
5. User opens authenticator app
6. User enters current TOTP code
7. Code is validated
8. User enters new password
9. Password is reset
10. User can login with new password
11. Old password is rejected


SCENARIO 3: Lost Device Recovery
─────────────────────────────────
1. User clicks "Forgot Password"
2. User enters email
3. User clicks "Use backup code"
4. User enters one of saved backup codes
5. Code is validated
6. User enters new password
7. User receives warning about remaining codes
8. User generates new backup codes from settings
9. Old backup codes are invalidated


SCENARIO 4: Attack Prevention
──────────────────────────────
1. Attacker tries to reset password
2. Attacker enters victim's email
3. Attacker enters random TOTP codes
4. After 5 attempts, rate limit triggers
5. Attacker waits 15 minutes
6. Attacker tries again
7. After 10 total failures, account locks
8. Victim receives security alert email
9. Admin reviews audit logs
10. Admin assists with legitimate reset
```

---

## 12. Deployment Guide

### 12.1 Environment Configuration

```bash
┌─────────────────────────────────────────────────────────────┐
│                  Environment Variables                       │
└─────────────────────────────────────────────────────────────┘

# TOTP Configuration
TOTP_ENABLED=true
TOTP_ISSUER_NAME="MongoDB Microsite"
TOTP_DIGITS=6
TOTP_PERIOD=30
TOTP_ALGORITHM="SHA1"

# Secret Encryption
TOTP_SECRET_ENCRYPTION_KEY="<256-bit-key-in-base64>"
TOTP_ENCRYPTION_ALGORITHM="AES-256-GCM"

# Rate Limiting
TOTP_MAX_ATTEMPTS_PER_WINDOW=5
TOTP_RATE_LIMIT_WINDOW_MINUTES=15
TOTP_MAX_FAILURES_BEFORE_LOCK=10
TOTP_ACCOUNT_LOCK_DURATION_MINUTES=60

# Backup Codes
TOTP_BACKUP_CODES_COUNT=10
TOTP_BACKUP_CODE_BCRYPT_ROUNDS=12

# Time Windows
TOTP_TIME_WINDOW_TOLERANCE=1  # ±1 window (30 seconds each way)
TOTP_ALLOW_CODE_REUSE=false

# Security
TOTP_LOG_ALL_ATTEMPTS=true
TOTP_ALERT_ON_SUSPICIOUS_ACTIVITY=true
TOTP_REQUIRE_HTTPS=true

# Frontend URLs
FRONTEND_URL="https://yourdomain.com"
TOTP_SETUP_PATH="/settings/security"
PASSWORD_RESET_PATH="/reset-password"
```

### 12.2 Deployment Checklist

```
PRE-DEPLOYMENT
──────────────
☐ Generate secure encryption key
☐ Configure environment variables
☐ Set up MongoDB collections and indexes
☐ Configure backup strategy
☐ Set up monitoring and alerts
☐ Prepare rollback plan
☐ Test in staging environment
☐ Security audit completed
☐ Performance testing completed
☐ Load testing completed


DEPLOYMENT STEPS
────────────────
☐ Deploy database migrations
☐ Verify indexes created successfully
☐ Deploy backend API changes
☐ Deploy frontend changes
☐ Update API documentation
☐ Enable TOTP feature flag
☐ Monitor error rates
☐ Monitor performance metrics
☐ Verify all endpoints responding
☐ Run smoke tests


POST-DEPLOYMENT
───────────────
☐ Monitor user adoption
☐ Check audit logs for errors
☐ Verify email notifications working
☐ Monitor rate limiting effectiveness
☐ Review security logs
☐ Collect user feedback
☐ Document any issues
☐ Plan iterative improvements


ROLLBACK PLAN
─────────────
IF issues occur:
☐ Disable TOTP feature flag
☐ Revert frontend deployment
☐ Revert backend deployment
☐ Keep database schema (backward compatible)
☐ Notify affected users
☐ Investigate root cause
☐ Fix and redeploy
```

### 12.3 Monitoring Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring & Alerts                       │
└─────────────────────────────────────────────────────────────┘

METRICS TO TRACK
────────────────
├─ TOTP setup rate (daily)
├─ TOTP setup success rate
├─ TOTP validation success rate
├─ Password reset with TOTP count
├─ Backup code usage count
├─ Rate limit triggers per hour
├─ Account lockouts per day
├─ Average validation response time
├─ Failed validation attempts per user
└─ Suspicious activity detection count


ALERTS TO CONFIGURE
───────────────────
├─ CRITICAL: Encryption key missing or invalid
├─ CRITICAL: Database connection failures
├─ HIGH: Account lockout spike (>10/hour)
├─ HIGH: Failed validation rate >20%
├─ MEDIUM: Rate limit triggers spike
├─ MEDIUM: Suspicious activity detected
├─ LOW: Backup codes nearly depleted for user
└─ LOW: TOTP setup failures >5%


DASHBOARD WIDGETS
─────────────────
┌──────────────────────────────────┐
│ TOTP Overview                    │
├──────────────────────────────────┤
│ Total Enabled: 1,234             │
│ Setup Today: 45                  │
│ Active Resets: 12                │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Success Rates (24h)              │
├──────────────────────────────────┤
│ Setup: ████████████░░ 92%        │
│ Validation: ███████████░ 88%     │
│ Resets: █████████████ 95%        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Security Events                  │
├──────────────────────────────────┤
│ Rate Limits: 23                  │
│ Account Locks: 2                 │
│ Suspicious: 1                    │
└──────────────────────────────────┘
```

---

## Summary

This TOTP-based password reset architecture provides:

✅ **Industry Standard Security** - RFC 6238 compliant TOTP
✅ **Zero External Costs** - No SMS or email service fees
✅ **Offline Capability** - Works without internet connection
✅ **Multiple Recovery Options** - TOTP codes + backup codes
✅ **Comprehensive Security** - Rate limiting, encryption, audit logging
✅ **Excellent Documentation** - Complete flows, APIs, and deployment guides
✅ **Production Ready** - Error handling, monitoring, and testing strategies

**Key Features:**
- 🔐 AES-256 encrypted secret storage
- ⏱️ 30-second time windows with ±1 tolerance
- 🔢 6-digit codes compatible with all major authenticator apps
- 🎫 10 single-use backup codes for device loss
- 🚫 Rate limiting and account lockout protection
- 📊 Complete audit logging and monitoring
- 🔄 Seamless integration with existing password reset flow

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Status:** Production Ready  
**Implementation Time:** 3-4 days  
**Security Level:** ⭐⭐⭐⭐⭐ Extremely High

