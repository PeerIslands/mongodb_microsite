"""
SendGrid Email Service

Handles sending emails via SendGrid API.
"""

from typing import List, Optional, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, Personalization
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SendGridService:
    """Service for sending emails via SendGrid"""
    
    def __init__(self):
        """Initialize SendGrid client"""
        if not settings.SENDGRID_API_KEY:
            logger.warning("SendGrid API key not configured")
            self.client = None
        else:
            try:
                self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                logger.info("SendGrid client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid client: {e}")
                self.client = None
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        plain_text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send a simple email using SendGrid.
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            html_content: HTML email content
            plain_text_content: Plain text email content (optional)
            from_email: Sender email (defaults to settings)
            from_name: Sender name (defaults to settings)
        
        Returns:
            Dict with status and message_id
        
        Raises:
            ValueError: If SendGrid is not configured
            Exception: If sending fails
        """
        if not self.client:
            raise ValueError("SendGrid is not configured. Please set SENDGRID_API_KEY in .env")
        
        # Prepare sender
        sender_email = from_email or settings.SENDGRID_FROM_EMAIL
        sender_name = from_name or settings.SENDGRID_FROM_NAME
        from_sender = Email(sender_email, sender_name)
        
        # Prepare recipients
        to_list = [To(email) for email in to_emails]
        
        # Create mail object
        mail = Mail(
            from_email=from_sender,
            to_emails=to_list,
            subject=subject,
            html_content=html_content,
            plain_text_content=plain_text_content or self._strip_html(html_content)
        )
        
        try:
            # Send email
            logger.info(f"Sending email to {len(to_emails)} recipients via SendGrid")
            response = self.client.send(mail)
            
            logger.info(f"Email sent successfully. Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message_id": response.headers.get('X-Message-Id', 'N/A'),
                "status": "Sent"
            }
            
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {e}")
            raise
    
    async def send_template_email(
        self,
        to_emails: List[str],
        template_id: str,
        dynamic_data: Optional[Dict[str, Any]] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send email using a SendGrid dynamic template.
        
        Args:
            to_emails: List of recipient email addresses
            template_id: SendGrid template ID (format: d-xxxxxxxxxxxx)
            dynamic_data: Data to populate template variables
            from_email: Sender email (defaults to settings)
            from_name: Sender name (defaults to settings)
        
        Returns:
            Dict with status and message_id
        """
        if not self.client:
            raise ValueError("SendGrid is not configured")
        
        # Prepare sender
        sender_email = from_email or settings.SENDGRID_FROM_EMAIL
        sender_name = from_name or settings.SENDGRID_FROM_NAME
        from_sender = Email(sender_email, sender_name)
        
        # Create mail object with template
        mail = Mail(from_email=from_sender)
        mail.template_id = template_id
        
        # Add recipients with personalization
        personalization = Personalization()
        for email in to_emails:
            personalization.add_to(To(email))
        
        # Add dynamic template data
        if dynamic_data:
            personalization.dynamic_template_data = dynamic_data
        
        mail.add_personalization(personalization)
        
        try:
            response = self.client.send(mail)
            logger.info(f"Template email sent. Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message_id": response.headers.get('X-Message-Id', 'N/A'),
                "status": "Sent"
            }
            
        except Exception as e:
            logger.error(f"Failed to send template email: {e}")
            raise
    
    def _strip_html(self, html: str) -> str:
        """
        Basic HTML stripping for plain text fallback.
        """
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text


# Singleton instance
_sendgrid_service = None

def get_sendgrid_service() -> SendGridService:
    """Get or create SendGrid service instance"""
    global _sendgrid_service
    if _sendgrid_service is None:
        _sendgrid_service = SendGridService()
    return _sendgrid_service
