"""
Azure Communication Services Email Service

This service provides email functionality using Azure Communication Services.
"""

from typing import List, Optional, Dict, Any
from azure.communication.email import EmailClient
from azure.core.exceptions import AzureError
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Azure Communication Services"""
    
    def __init__(self):
        """Initialize the email service with Azure Communication Services client"""
        if not settings.AZURE_COMMUNICATION_CONNECTION_STRING:
            logger.warning("Azure Communication Services connection string not configured")
            self.client = None
        else:
            try:
                self.client = EmailClient.from_connection_string(
                    settings.AZURE_COMMUNICATION_CONNECTION_STRING
                )
                logger.info("Azure Communication Services Email client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Azure Communication Services Email client: {e}")
                self.client = None
    
    async def send_email(
        self,
        to_addresses: List[str],
        subject: str,
        html_content: Optional[str] = None,
        plain_text_content: Optional[str] = None,
        cc_addresses: Optional[List[str]] = None,
        bcc_addresses: Optional[List[str]] = None,
        reply_to_address: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Send an email using Azure Communication Services
        
        Args:
            to_addresses: List of recipient email addresses
            subject: Email subject
            html_content: HTML content of the email
            plain_text_content: Plain text content of the email
            cc_addresses: List of CC email addresses
            bcc_addresses: List of BCC email addresses
            reply_to_address: Reply-to email address
            attachments: List of attachment dictionaries with 'name', 'content_type', and 'content_bytes'
        
        Returns:
            Dictionary with status and message_id if successful
        
        Raises:
            ValueError: If email service is not configured or invalid parameters
            AzureError: If email sending fails
        """
        if not self.client:
            raise ValueError("Email service is not configured. Please set AZURE_COMMUNICATION_CONNECTION_STRING")
        
        if not settings.AZURE_COMMUNICATION_SENDER_ADDRESS:
            raise ValueError("Sender email address is not configured. Please set AZURE_COMMUNICATION_SENDER_ADDRESS")
        
        if not to_addresses:
            raise ValueError("At least one recipient email address is required")
        
        if not html_content and not plain_text_content:
            raise ValueError("Either html_content or plain_text_content must be provided")
        
        try:
            # Prepare email message
            message = {
                "senderAddress": settings.AZURE_COMMUNICATION_SENDER_ADDRESS,
                "recipients": {
                    "to": [{"address": email} for email in to_addresses],
                },
                "content": {
                    "subject": subject,
                }
            }
            
            # Add content
            if html_content and plain_text_content:
                message["content"]["html"] = html_content
                message["content"]["plainText"] = plain_text_content
            elif html_content:
                message["content"]["html"] = html_content
            else:
                message["content"]["plainText"] = plain_text_content
            
            # Add optional fields
            if cc_addresses:
                message["recipients"]["cc"] = [{"address": email} for email in cc_addresses]
            
            if bcc_addresses:
                message["recipients"]["bcc"] = [{"address": email} for email in bcc_addresses]
            
            if reply_to_address:
                message["replyTo"] = [{"address": reply_to_address}]
            
            # Add attachments if provided
            if attachments:
                message["attachments"] = []
                for attachment in attachments:
                    message["attachments"].append({
                        "name": attachment["name"],
                        "contentType": attachment["content_type"],
                        "contentInBase64": attachment["content_bytes"]
                    })
            
            # Send email
            logger.info(f"Sending email to {to_addresses} with subject: {subject}")
            poller = self.client.begin_send(message)
            
            # For background tasks, we can optionally wait for result
            # If wait_for_result is False, we start the send and return immediately
            result = poller.result()
            
            logger.info(f"Email sent successfully. Message ID: {result['id']}")
            
            return {
                "success": True,
                "message_id": result["id"],
                "status": result["status"],
                "message": "Email sent successfully"
            }
            
        except AzureError as e:
            logger.error(f"Azure error while sending email: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error while sending email: {e}")
            raise
    
    async def send_simple_email(
        self,
        to_address: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> Dict[str, Any]:
        """
        Send a simple email to a single recipient
        
        Args:
            to_address: Recipient email address
            subject: Email subject
            body: Email body content
            is_html: Whether the body is HTML (True) or plain text (False)
        
        Returns:
            Dictionary with status and message_id if successful
        """
        if is_html:
            return await self.send_email(
                to_addresses=[to_address],
                subject=subject,
                html_content=body
            )
        else:
            return await self.send_email(
                to_addresses=[to_address],
                subject=subject,
                plain_text_content=body
            )
    
    async def send_template_email(
        self,
        to_address: str,
        subject: str,
        template_name: str,
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send an email using a predefined template
        
        Args:
            to_address: Recipient email address
            subject: Email subject
            template_name: Name of the email template
            template_data: Data to populate the template
        
        Returns:
            Dictionary with status and message_id if successful
        """
        # Get template and populate with data
        html_content = self._get_template(template_name, template_data)
        
        return await self.send_email(
            to_addresses=[to_address],
            subject=subject,
            html_content=html_content
        )
    
    def _get_template(self, template_name: str, data: Dict[str, Any]) -> str:
        """
        Get and populate an email template
        
        Args:
            template_name: Name of the template
            data: Data to populate the template with
        
        Returns:
            Populated HTML template
        """
        templates = {
            "welcome": """
                <html>
                <body>
                    <h2>Welcome to MongoDB Microsite!</h2>
                    <p>Hi {name},</p>
                    <p>Thank you for signing up. We're excited to have you on board!</p>
                    <p>Best regards,<br>MongoDB Microsite Team</p>
                </body>
                </html>
            """,
            "password_reset": """
                <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Hi {name},</p>
                    <p>You requested to reset your password. Use the code below:</p>
                    <h3>{reset_code}</h3>
                    <p>This code will expire in {expiry_minutes} minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Best regards,<br>MongoDB Microsite Team</p>
                </body>
                </html>
            """,
            "notification": """
                <html>
                <body>
                    <h2>{title}</h2>
                    <p>{message}</p>
                    <p>Best regards,<br>MongoDB Microsite Team</p>
                </body>
                </html>
            """
        }
        
        template = templates.get(template_name, templates["notification"])
        return template.format(**data)
    
    def send_email_fire_and_forget(
        self,
        to_addresses: List[str],
        subject: str,
        html_content: str,
        plain_text_content: str,
        cc_addresses: Optional[List[str]] = None,
    ):
        """
        Send email without waiting for result (fire and forget).
        Used for background tasks where we don't need to wait.
        
        This method starts the email send operation and returns immediately
        without waiting for Azure to confirm delivery.
        """
        try:
            if not self.client:
                logger.error("Email service is not configured")
                return
            
            message = {
                "senderAddress": settings.AZURE_COMMUNICATION_SENDER_ADDRESS,
                "recipients": {
                    "to": [{"address": email} for email in to_addresses],
                },
                "content": {
                    "subject": subject,
                    "html": html_content,
                    "plainText": plain_text_content,
                }
            }
            
            if cc_addresses:
                message["recipients"]["cc"] = [{"address": email} for email in cc_addresses]
            
            # Start sending email (don't wait for result)
            logger.info(f"Fire-and-forget: Starting email send to {to_addresses}")
            poller = self.client.begin_send(message)
            # Don't call poller.result() - let it send in background
            logger.info("Fire-and-forget: Email send initiated (not waiting for result)")
            
        except Exception as e:
            logger.error(f"Fire-and-forget: Failed to initiate email send: {e}")
    
    @staticmethod
    async def send_contact_inquiry_email(inquiry_data: Dict[str, Any]) -> bool:
        """
        Send a contact inquiry email notification
        
        Args:
            inquiry_data: Dictionary containing inquiry details
                - first_name: Contact's first name
                - last_name: Contact's last name
                - user_email: Contact's email
                - company: Company name
                - job_function: Job function
                - business_phone: Business phone number
                - country: Country
                - inquiry: The inquiry message
        
        Returns:
            True if email initiated successfully, False otherwise
        """
        try:
            # Check if receiver email is configured
            if not settings.CONTACTUS_RECEIVER_EMAIL:
                logger.error("CONTACTUS_RECEIVER_EMAIL not configured")
                return False
            
            # Clean and validate receiver email (remove any brackets or quotes)
            receiver_email = settings.CONTACTUS_RECEIVER_EMAIL.strip().strip('[]"\'')
            
            if not receiver_email:
                logger.error("CONTACTUS_RECEIVER_EMAIL is empty after cleaning")
                return False
            
            logger.info(f"Sending contact inquiry email to: {receiver_email}")
            
            # Get CC emails
            cc_emails = settings.get_contactus_cc_emails()
            
            # Prepare email subject
            subject = f"New Inquiry from {inquiry_data['first_name']} {inquiry_data['last_name']}"
            
            # Prepare HTML email body
            html_body = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    h2 {{ color: #00684A; border-bottom: 2px solid #00684A; padding-bottom: 10px; }}
                    .info-section {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                    .info-row {{ margin: 10px 0; }}
                    .label {{ font-weight: bold; color: #555; }}
                    .inquiry-section {{ background-color: #fff; border-left: 4px solid #00684A; padding: 15px; margin: 20px 0; }}
                    .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>New Contact Form Inquiry</h2>
                    
                    <div class="info-section">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <div class="info-row">
                            <span class="label">Name:</span> {inquiry_data['first_name']} {inquiry_data['last_name']}
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span> <a href="mailto:{inquiry_data['user_email']}">{inquiry_data['user_email']}</a>
                        </div>
                        <div class="info-row">
                            <span class="label">Company:</span> {inquiry_data['company']}
                        </div>
                        <div class="info-row">
                            <span class="label">Job Function:</span> {inquiry_data['job_function']}
                        </div>
                        <div class="info-row">
                            <span class="label">Business Phone:</span> {inquiry_data['business_phone']}
                        </div>
                        <div class="info-row">
                            <span class="label">Country:</span> {inquiry_data['country']}
                        </div>
                    </div>
                    
                    <div class="inquiry-section">
                        <h3 style="margin-top: 0;">Inquiry Message</h3>
                        <p>{inquiry_data['inquiry'].replace(chr(10), '<br>')}</p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message from the MongoDB Microsite contact form.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Prepare plain text version
            plain_text = f"""
New Contact Form Inquiry

Contact Information:
- Name: {inquiry_data['first_name']} {inquiry_data['last_name']}
- Email: {inquiry_data['user_email']}
- Company: {inquiry_data['company']}
- Job Function: {inquiry_data['job_function']}
- Business Phone: {inquiry_data['business_phone']}
- Country: {inquiry_data['country']}

Inquiry Message:
{inquiry_data['inquiry']}

---
This is an automated message from the MongoDB Microsite contact form.
            """
            
            # Create email service instance
            service = EmailService()
            
            # Send email using fire-and-forget (don't wait for result)
            service.send_email_fire_and_forget(
                to_addresses=[receiver_email],
                subject=subject,
                html_content=html_body,
                plain_text_content=plain_text,
                cc_addresses=cc_emails if cc_emails else None
            )
            
            logger.info(f"Contact inquiry email initiated for {receiver_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send contact inquiry email: {e}")
            return False


# Singleton instance
email_service = EmailService()
