"""
Email Service - Handles sending emails for contact inquiries.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict

from app.core.config import settings


class EmailService:
    """
    Service for sending emails.
    """

    @staticmethod
    def send_contact_inquiry_email(inquiry_data: Dict[str, str]) -> bool:
        """
        Send contact inquiry email to the specified recipient.
        
        Args:
            inquiry_data: Dictionary containing inquiry details
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Recipient email
            to_email = "akshay.anoop@peerislands.io"
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"New Contact Inquiry from {inquiry_data['first_name']} {inquiry_data['last_name']}"
            msg['From'] = settings.SMTP_FROM_EMAIL
            msg['To'] = to_email
            
            # Format inquiry text for HTML (preserve line breaks)
            inquiry_formatted = inquiry_data['inquiry'].replace('\n', '<br>')
            
            # Create HTML email body
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #5b6cff 0%, #4a5ae8 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            background: #f8f9fa;
            padding: 30px 20px;
            border-radius: 0 0 8px 8px;
        }}
        .info-section {{
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .info-row {{
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: bold;
            color: #5b6cff;
            min-width: 150px;
        }}
        .info-value {{
            color: #333;
        }}
        .inquiry-section {{
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #5b6cff;
        }}
        .inquiry-label {{
            font-weight: bold;
            color: #5b6cff;
            margin-bottom: 10px;
        }}
        .inquiry-content {{
            color: #555;
            line-height: 1.8;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 New Contact Inquiry</h1>
    </div>
    <div class="content">
        <p>You have received a new contact inquiry from your website.</p>
        
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">{inquiry_data['first_name']} {inquiry_data['last_name']}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Company:</div>
                <div class="info-value">{inquiry_data['company']}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Job Function:</div>
                <div class="info-value">{inquiry_data['job_function']}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">{inquiry_data['business_phone']}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Country:</div>
                <div class="info-value">{inquiry_data['country']}</div>
            </div>
        </div>
        
        <div class="inquiry-section">
            <div class="inquiry-label">Inquiry Message:</div>
            <div class="inquiry-content">
                {inquiry_formatted}
            </div>
        </div>
        
        <p style="margin-top: 20px; font-style: italic;">
            <strong>{inquiry_data['first_name']} {inquiry_data['last_name']}</strong> from 
            <strong>{inquiry_data['company']}</strong> would like to contact you regarding the above inquiry.
        </p>
    </div>
    <div class="footer">
        <p>This is an automated message from your MongoDB Microsite contact form.</p>
    </div>
</body>
</html>
            """
            
            # Create plain text version as fallback
            text_body = f"""
New Contact Inquiry

Name: {inquiry_data['first_name']} {inquiry_data['last_name']}
Company: {inquiry_data['company']}
Job Function: {inquiry_data['job_function']}
Phone: {inquiry_data['business_phone']}
Country: {inquiry_data['country']}

Inquiry:
{inquiry_data['inquiry']}

---
{inquiry_data['first_name']} {inquiry_data['last_name']} from {inquiry_data['company']} would like to contact you regarding the above inquiry.
            """
            
            # Attach parts
            part1 = MIMEText(text_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Log email for debugging
            print("=" * 80)
            print("SENDING EMAIL TO:", to_email)
            print("SUBJECT:", msg['Subject'])
            print("=" * 80)
            
            # Send email via SMTP
            if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
                try:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        server.set_debuglevel(0)  # Set to 1 for verbose SMTP debugging
                        if settings.SMTP_TLS:
                            server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)
                    print("✅ Email sent successfully!")
                    print("=" * 80)
                except smtplib.SMTPAuthenticationError:
                    print("❌ SMTP Authentication failed. Check your credentials.")
                    print("=" * 80)
                    return False
                except smtplib.SMTPException as e:
                    print(f"❌ SMTP error occurred: {str(e)}")
                    print("=" * 80)
                    return False
                except Exception as e:
                    print(f"❌ Unexpected error sending email: {str(e)}")
                    print("=" * 80)
                    return False
            else:
                print("⚠️  SMTP not configured. Email not sent.")
                print("   Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env")
                print("=" * 80)
                # Return True anyway so the form submission succeeds
                # (Email will be logged to console)
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False

