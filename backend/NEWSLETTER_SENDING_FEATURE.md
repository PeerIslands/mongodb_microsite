# Newsletter Sending Feature Documentation

## Overview

A comprehensive bulk newsletter sending system integrated with the existing Email Template management feature. This system allows admins to send newsletters to multiple recipients with advanced filtering, test mode, and proper tracking using the `increment_send_count()` method.

## Features

### Backend Implementation

#### 1. Models (`backend/app/api/v1/models/email_template.py`)

**New Enums:**
- `RecipientFilter`: Defines recipient selection strategies
  - `ALL_USERS`: Send to all registered users
  - `ACTIVE_USERS`: Send to users with active accounts
  - `INTERNAL_USERS`: Send to internal users only
  - `EXTERNAL_USERS`: Send to external users only
  - `CUSTOM_LIST`: Send to specific email addresses

**New Models:**
- `SendNewsletterRequest`: Request payload for bulk newsletter sending
  ```python
  {
    "recipient_filter": RecipientFilter,
    "custom_emails": List[str] (optional),
    "test_mode": bool (default: False),
    "variable_data": Dict[str, Any] (optional)
  }
  ```

- `SendNewsletterResponse`: Response with sending statistics
  ```python
  {
    "success": bool,
    "total_recipients": int,
    "emails_sent": int,
    "emails_failed": int,
    "failed_emails": List[str] (optional),
    "message": str,
    "send_job_id": str (optional)
  }
  ```

#### 2. Endpoint (`backend/app/api/v1/endpoints/email_templates.py`)

**New Endpoint:**
```
POST /api/v1/email-templates/{template_id}/send-newsletter
```

**Features:**
- Admin-only access (requires authentication)
- Multiple recipient filtering options
- Test mode for safe testing
- Batch processing (50 emails per batch with 0.5s delay)
- Automatic `send_count` tracking using `increment_send_count()`
- Active template validation
- Detailed error handling and logging

**Request Example:**
```json
{
  "recipient_filter": "active_users",
  "test_mode": false
}
```

**Test Mode Example:**
```json
{
  "recipient_filter": "custom_list",
  "custom_emails": ["test1@example.com", "test2@example.com"],
  "test_mode": true
}
```

**Response Example:**
```json
{
  "success": true,
  "total_recipients": 150,
  "emails_sent": 148,
  "emails_failed": 2,
  "failed_emails": ["failed1@example.com", "failed2@example.com"],
  "message": "Newsletter sent successfully! 148/150 emails delivered (98.7% success rate)"
}
```

#### 3. Repository Integration

The feature uses the existing `increment_send_count()` method from `EmailTemplateRepository`:

```python
async def increment_send_count(self, template_id: str) -> bool:
    """
    Increment send count and update last_sent_at.
    
    Args:
        template_id: Template ID string
    
    Returns:
        True if updated
    """
    result = await self.collection.update_one(
        {"_id": ObjectId(template_id)},
        {
            "$inc": {"send_count": 1},
            "$set": {"last_sent_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0
```

This method is called automatically after successful newsletter sending (not in test mode).

### Frontend Implementation

#### 1. API Service (`frontend/src/api/services/emailTemplates.ts`)

**New Types:**
```typescript
export type RecipientFilter = 
  | 'all_users' 
  | 'active_users' 
  | 'internal_users' 
  | 'external_users' 
  | 'custom_list';

export interface SendNewsletterRequest {
  recipient_filter: RecipientFilter;
  custom_emails?: string[];
  test_mode?: boolean;
  variable_data?: Record<string, unknown>;
}

export interface SendNewsletterResponse {
  success: boolean;
  total_recipients: number;
  emails_sent: number;
  emails_failed: number;
  failed_emails?: string[];
  message: string;
  send_job_id?: string;
}
```

**New Function:**
```typescript
export const sendNewsletter = async (
  templateId: string,
  request: SendNewsletterRequest
): Promise<SendNewsletterResponse>
```

#### 2. UI Component (`frontend/src/features/admin/components/EmailTemplateForm.tsx`)

**New Section: "Send Bulk Newsletter"**

Added in edit mode only, this section provides:

1. **Recipient Filter Dropdown:**
   - All Users
   - Active Users Only
   - Internal Users
   - External Users
   - Custom Email List

2. **Custom Email List Textarea:**
   - Accepts emails separated by newlines, commas, or semicolons
   - Used for custom list mode or test mode

3. **Test Mode Checkbox:**
   - When enabled, only sends to custom email list
   - Ignores recipient filter
   - Does not increment send_count
   - Adds warning message

4. **Send Button:**
   - Shows spinner during sending
   - Displays "TEST MODE" label when enabled
   - Confirmation dialog before sending
   - Success/error toasts

#### 3. Styling (`frontend/src/styles/features/admin/EmailTemplateForm.css`)

**New Classes:**
- `.newsletter-section`: Special styling for newsletter section with gradient background
- `.section-description`: Subtitle text for sections
- `.form-hint`: Helper text below form fields
- `.form-hint.warning`: Warning styling for test mode
- `.checkbox-label`: Styled checkbox with label
- `.btn-large`: Larger button for send action
- `.spinner`: Loading spinner animation

## Usage Flow

### Admin Workflow

1. **Navigate to Newsletters (Email Templates)**
   - Go to Admin Dashboard → Newsletters tab

2. **Select a Newsletter**
   - Click "👁️ View/Send" on any newsletter

3. **Choose Recipients**
   - Select recipient filter from dropdown:
     - **All Users**: All registered users
     - **Active Users**: Users who can log in
     - **Internal Users**: Company employees
     - **External Users**: Customers/partners
     - **Custom List**: Specific email addresses

4. **Add Custom Emails (Optional)**
   - For custom list mode or test mode
   - Enter emails one per line or comma-separated

5. **Enable Test Mode (Recommended First Time)**
   - Check "Test Mode" checkbox
   - Add test email addresses
   - Send to verify newsletter appearance

6. **Send Newsletter**
   - Click "📨 Send Newsletter" button
   - Confirm in dialog
   - Wait for completion
   - View success message with statistics

### Example Scenarios

#### Scenario 1: Send to All Active Users
```
1. Open newsletter in edit mode
2. Select "Active Users Only" filter
3. Click "Send Newsletter"
4. Confirm dialog
5. Newsletter sent to all active users
6. send_count incremented by 1
```

#### Scenario 2: Test Mode First
```
1. Open newsletter in edit mode
2. Select any filter (will be ignored)
3. Enter test emails: "test@company.com, admin@company.com"
4. Check "Test Mode"
5. Click "Send Newsletter (TEST MODE)"
6. Confirm dialog
7. Newsletter sent only to test emails
8. send_count NOT incremented
```

#### Scenario 3: Custom Email List
```
1. Open newsletter in edit mode
2. Select "Custom Email List" filter
3. Enter emails:
   partner1@external.com
   partner2@external.com
   client@company.com
4. Click "Send Newsletter"
5. Confirm dialog
6. Newsletter sent to 3 custom emails
7. send_count incremented by 1
```

## Technical Details

### Batch Processing

To avoid rate limiting and improve deliverability:
- Emails are sent in batches of 50
- 0.5-second delay between batches
- Individual error handling per email
- Detailed failure tracking

### Template Validation

Before sending:
- Template must exist
- Template status must be "active" (unless test mode)
- HTML content must be present

### Error Handling

The system handles:
- Invalid template IDs
- Inactive templates
- Empty recipient lists
- Invalid email addresses
- Email service failures
- Network timeouts

All errors are logged and reported to the admin with clear messages.

### Tracking & Metrics

The system tracks:
- `send_count`: Number of times newsletter was sent (production)
- `test_send_count`: Number of test emails sent
- `last_sent_at`: Timestamp of last send
- `version`: Template version history

### Rate Limiting

Current implementation:
- 50 emails per batch
- 0.5s delay between batches
- ~100 emails per second throughput
- Scales to thousands of recipients

## Security

- **Authentication Required**: All endpoints require admin token
- **Authorization Check**: Only admins can send newsletters
- **Template Ownership**: Tracked via `created_by` field
- **Audit Trail**: All sends are logged with timestamps and user info

## Future Enhancements

Potential improvements:
1. **Scheduled Sending**: Queue newsletters for future delivery
2. **A/B Testing**: Send different versions to segments
3. **Unsubscribe Management**: Respect user preferences
4. **Analytics Dashboard**: Open rates, click tracking
5. **Template Variables**: Personalization with user data
6. **Background Jobs**: Async processing with Celery
7. **Rate Limit Configuration**: Admin-configurable limits
8. **Email Validation**: Pre-send email verification
9. **Retry Logic**: Automatic retry for failed sends
10. **Export Reports**: CSV export of send statistics

## API Reference

### Send Newsletter

**Endpoint:** `POST /api/v1/email-templates/{template_id}/send-newsletter`

**Authentication:** Required (Admin only)

**Parameters:**
- `template_id` (path): Newsletter template ID

**Request Body:**
```json
{
  "recipient_filter": "all_users" | "active_users" | "internal_users" | "external_users" | "custom_list",
  "custom_emails": ["email1@example.com", "email2@example.com"],
  "test_mode": false,
  "variable_data": { "key": "value" }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "total_recipients": 100,
  "emails_sent": 98,
  "emails_failed": 2,
  "failed_emails": ["invalid@example.com"],
  "message": "Newsletter sent successfully! 98/100 emails delivered (98.0% success rate)"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid parameters or inactive template
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Template not found
- `500 Internal Server Error`: Server error during send

## Testing

### Manual Testing Checklist

- [ ] Test mode with single email
- [ ] Test mode with multiple emails
- [ ] All users filter
- [ ] Active users filter
- [ ] Internal users filter
- [ ] External users filter
- [ ] Custom email list
- [ ] Empty recipient list (should show message)
- [ ] Invalid email format handling
- [ ] Confirmation dialog cancellation
- [ ] Send count tracking
- [ ] Error handling and toast messages
- [ ] Loading states and spinners
- [ ] UI responsive on mobile

### Example Test Cases

```bash
# Backend test
curl -X POST "http://localhost:8000/api/v1/email-templates/{id}/send-newsletter" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_filter": "custom_list",
    "custom_emails": ["test@example.com"],
    "test_mode": true
  }'

# Expected: 200 OK with success response
```

## Troubleshooting

### Issue: Emails not sending
**Solution:** 
- Check Azure Communication Services configuration
- Verify `AZURE_COMMUNICATION_CONNECTION_STRING` is set
- Check `AZURE_COMMUNICATION_SENDER_ADDRESS` is configured

### Issue: send_count not incrementing
**Solution:**
- Ensure test_mode is false
- Check MongoDB connection
- Review backend logs for errors

### Issue: Large recipient lists timeout
**Solution:**
- Current timeout is 5 minutes (300,000ms)
- For very large lists, consider implementing background jobs
- Monitor batch processing logs

### Issue: High failure rate
**Solution:**
- Validate email addresses before sending
- Check Azure Communication Services quotas
- Review failed_emails list for patterns

## Conclusion

The newsletter sending feature is fully integrated with the existing email template system, providing admins with powerful tools to communicate with users. The feature includes proper tracking via `increment_send_count()`, extensive error handling, and a user-friendly interface designed for safe and efficient bulk email operations.
